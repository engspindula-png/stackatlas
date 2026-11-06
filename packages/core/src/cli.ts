#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { withClonedRepo } from './downloader.js';
import { analyzeRepository } from './detector.js';
import { readEnvAndConfigs } from './configReader.js';
import { cruzarComCatalogo } from './matcher.js';
import { montarFicha, gravarFicha, extrairDonoERepo } from './fichaRecorder.js';
import { iniciarServidor } from './server.js';
import { exportarContextoIa } from './aiExporter.js';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve o caminho do catálogo a partir da raiz do monorepo
function resolverDiretorioCatalogo(): string {
  let dirAtual = __dirname;
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dirAtual, 'catalog');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    dirAtual = path.dirname(dirAtual);
  }
  return path.resolve('catalog');
}

async function obterGitInfoLocal(repoPath: string): Promise<{ commit: string; branch: string }> {
  try {
    const { stdout: commitOut } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: repoPath });
    const { stdout: branchOut } = await execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repoPath });
    return {
      commit: commitOut.trim(),
      branch: branchOut.trim() || 'main',
    };
  } catch {
    return {
      commit: '0000000000000000000000000000000000000000',
      branch: 'main',
    };
  }
}

export async function executarAnalise(alvo: string, catalogDir?: string): Promise<{ caminhoFicha: string }> {
  const resolvedCatalog = catalogDir || resolverDiretorioCatalogo();
  const isGitRemote = alvo.startsWith('http://') || alvo.startsWith('https://') || alvo.startsWith('git@');

  if (isGitRemote) {
    console.log(`\n▶ Clonando repositório remoto: ${alvo}`);
    return await withClonedRepo(alvo, async ({ dir, commit, branch }) => {
      return await processarAnalise(dir, alvo, commit, branch, resolvedCatalog);
    });
  } else {
    const caminhoAbsoluto = path.resolve(alvo);
    console.log(`\n▶ Analisando diretório local: ${caminhoAbsoluto}`);
    const { commit, branch } = await obterGitInfoLocal(caminhoAbsoluto);
    return await processarAnalise(caminhoAbsoluto, alvo, commit, branch, resolvedCatalog);
  }
}

async function processarAnalise(
  dirAlvo: string,
  urlOuCaminho: string,
  commit: string,
  branch: string,
  catalogDir: string
): Promise<{ caminhoFicha: string }> {
  console.log('[1/4] Detectando tecnologias e dependências (Specfy + Leitor Próprio)...');
  const detectorResult = await analyzeRepository(dirAlvo);
  console.log(`      Total detectado: ${detectorResult.tecnologias.length} tecnologias.`);

  console.log('[2/4] Lendo arquivos .env e configurações (zero vazamento de valores)...');
  const configResult = await readEnvAndConfigs(dirAlvo);
  console.log(`      Variáveis encontradas: ${configResult.variaveis.length}. Configurações: ${configResult.configuracoes.filter(c => c.presente).length}.`);

  console.log('[3/4] Cruzando sinais com o Catálogo oficial...');
  const cruzamento = await cruzarComCatalogo(detectorResult, configResult, catalogDir);
  console.log(`      Serviços catalogados identificados: ${cruzamento.servicos.length}.`);
  for (const s of cruzamento.servicos) {
    const badge = s.confianca === 'certo' ? '✓ CERTO' : '? PROVÁVEL';
    console.log(`      - ${s.nome} (${s.categoria}/${s.subcategoria}) [${badge}]`);
  }

  console.log('[4/4] Validando Zod Schema e gravando JSON versionado...');
  const { dono, repo: nomeRepo } = extrairDonoERepo(urlOuCaminho);
  const ficha = montarFicha({
    repo: {
      url: urlOuCaminho,
      commit,
      branch,
      visibilidade: 'publico',
      dono,
      nomeRepo,
    },
    cruzamento,
  });

  const gravado = await gravarFicha(ficha, { dono, nomeRepo });
  console.log(`\n✓ FICHA SALVA COM SUCESSO!`);
  console.log(`  Arquivo: ${gravado.caminho}`);
  console.log(`  Identificador: ${dono}/${nomeRepo}@${commit.slice(0, 7)}`);

  return { caminhoFicha: gravado.caminho };
}

export async function main(args: string[] = process.argv.slice(2)): Promise<void> {
  const comando = args[0];

  if (!comando || comando === '--help' || comando === '-h') {
    console.log(`
Uso do StackAtlas CLI:
  stackatlas analisar <caminho-ou-url>    Analisa um repositório local ou remoto e grava a ficha
  stackatlas exportar-ia <caminho-ou-alvo> Gera o arquivo CLAUDE.md compacto de contexto para IA
  stackatlas server [--porta <porta>]     Inicia o servidor HTTP local (127.0.0.1)
  stackatlas --help                       Exibe esta mensagem de ajuda
`);
    return;
  }

  if (comando === 'analisar' || comando === 'analyze') {
    const alvo = args[1];
    if (!alvo) {
      console.error('Erro: informe o caminho do projeto ou a URL do GitHub para análise.');
      console.error('Exemplo: stackatlas analisar fixtures/nextjs-subscription-payments');
      process.exit(1);
    }
    try {
      await executarAnalise(alvo);
    } catch (err) {
      console.error('Erro durante a análise:', err);
      process.exit(1);
    }
    return;
  }

  if (comando === 'exportar-ia' || comando === 'export-ia') {
    const alvo = args[1];
    if (!alvo) {
      console.error('Erro: informe o caminho do projeto ou a ficha para exportar o contexto de IA.');
      console.error('Exemplo: stackatlas exportar-ia fixtures/nextjs-subscription-payments');
      process.exit(1);
    }

    const saidaIdx = args.indexOf('--saida');
    const arquivoSaida = saidaIdx !== -1 && args[saidaIdx + 1] ? args[saidaIdx + 1] : undefined;

    try {
      const res = await exportarContextoIa(alvo, { arquivoSaida });
      console.log('='.repeat(70));
      console.log(`✓ Contexto para IA exportado com sucesso!`);
      console.log(`  Arquivo gerado: ${res.caminhoArquivo}`);
      console.log('='.repeat(70));
    } catch (err) {
      console.error('Erro ao exportar contexto para IA:', err);
      process.exit(1);
    }
    return;
  }

  if (comando === 'server' || comando === 'serve') {
    const portaIdx = args.indexOf('--porta');
    const porta = portaIdx !== -1 && args[portaIdx + 1] ? parseInt(args[portaIdx + 1], 10) : 4173;

    try {
      const servidor = await iniciarServidor({ porta });
      console.log('='.repeat(70));
      console.log(`Servidor local do StackAtlas iniciado com sucesso!`);
      console.log(`Endereço: ${servidor.url} (estritamente em 127.0.0.1)`);
      console.log(`Rotas disponíveis:`);
      console.log(`  - GET /health`);
      console.log(`  - GET /api/fichas`);
      console.log(`  - GET /api/fichas/<nome-do-arquivo.json>`);
      console.log('='.repeat(70));
    } catch (err) {
      console.error('Erro ao iniciar servidor local:', err);
      process.exit(1);
    }
    return;
  }

  console.error(`Comando desconhecido: "${comando}". Use "stackatlas --help" para ver as opções.`);
  process.exit(1);
}

// Executa se invocado diretamente
if (process.argv[1] && (process.argv[1].endsWith('cli.js') || process.argv[1].endsWith('stackatlas.js') || process.argv[1].endsWith('cli.ts'))) {
  main().catch((err) => {
    console.error('Falha fatal:', err);
    process.exit(1);
  });
}
