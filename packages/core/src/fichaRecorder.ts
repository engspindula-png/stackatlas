import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  FichaSchema,
  type Ficha,
  type ServicoFicha,
  type VariavelFicha,
} from '../../../schemas/ficha.js';
import type { ResultadoCruzamento } from './matcher.js';

export interface ParametrosRepoFicha {
  url: string;
  commit: string;
  branch?: string;
  visibilidade?: 'publico' | 'privado';
  dono?: string;
  nomeRepo?: string;
}

export interface MontarFichaInput {
  repo: ParametrosRepoFicha;
  cruzamento: ResultadoCruzamento;
  modulosInternos?: number;
}

export interface GravarFichaOptions {
  diretorioFichas?: string;
  valoresProibidos?: string[];
}

/**
 * Extrai dono e nome do repositório a partir de uma URL ou caminho.
 */
export function extrairDonoERepo(urlOuCaminho: string): { dono: string; repo: string } {
  const limpo = urlOuCaminho.replace(/\.git$/, '').replace(/\/+$/, '');

  // Padrão GitHub HTTPS / SSH
  const matchGit = limpo.match(/(?:github\.com[/:])([^/]+)\/([^/]+)$/i);
  if (matchGit) {
    return { dono: matchGit[1], repo: matchGit[2] };
  }

  // Padrão pasta local (ex: fixtures/nextjs-subscription-payments)
  const partes = limpo.split(/[/\\]/).filter(Boolean);
  if (partes.length >= 2) {
    const repo = partes[partes.length - 1];
    const dono = partes[partes.length - 2];
    return { dono, repo };
  } else if (partes.length === 1) {
    return { dono: 'local', repo: partes[0] };
  }

  return { dono: 'local', repo: 'projeto' };
}

/**
 * Validação de segurança rigorosa (SPEC.md Seção 8.5):
 * Garante que NENHUM valor de variável de ambiente ou segredo vaze para o JSON da ficha.
 */
export function verificarSegurancaFicha(fichaJson: string, valoresProibidos: string[] = []): void {
  // 1. Verifica se algum valor proibido explícito foi injetado no JSON
  for (const valor of valoresProibidos) {
    const trimmed = valor.trim();
    if (trimmed.length >= 4 && fichaJson.includes(trimmed)) {
      throw new Error(`[SEGURANÇA - Seção 8.5] Violação detectada: valor confidencial encontrado no JSON da ficha: "${trimmed.slice(0, 3)}***"`);
    }
  }

  // 2. Analisa o objeto JSON para verificar a integridade dos sinais e variáveis
  const obj = JSON.parse(fichaJson) as Ficha;

  // Verifica cada variável listada
  for (const v of obj.variaveis) {
    // Nomes de variáveis devem conter apenas caracteres válidos de identificador
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(v.nome)) {
      throw new Error(`[SEGURANÇA - Seção 8.5] Nome de variável suspeito ou malformado: "${v.nome}"`);
    }
    // Garante que não foi embutida nenhuma atribuição com valor
    if (v.nome.includes('=') || v.nome.includes(':')) {
      throw new Error(`[SEGURANÇA - Seção 8.5] Variável contém atribuição com valor: "${v.nome}"`);
    }
  }

  // Verifica sinais de tipo 'variavel' em cada serviço
  for (const s of obj.servicos) {
    for (const sinal of s.sinais) {
      if (sinal.tipo === 'variavel') {
        if (sinal.valor.includes('=') || sinal.valor.includes(':')) {
          throw new Error(`[SEGURANÇA - Seção 8.5] Sinal de variável contém valor ou atribuição: "${sinal.valor}"`);
        }
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(sinal.valor)) {
          throw new Error(`[SEGURANÇA - Seção 8.5] Sinal de variável não é um identificador puro: "${sinal.valor}"`);
        }
      }
    }
  }

  // 3. Varredura por padrões comuns de tokens / chaves no texto do JSON
  const padroesChaves = [
    /eyJ[A-Za-z0-9-_]{10,}\.eyJ[A-Za-z0-9-_]{10,}/, // JWT Tokens
    /sk_live_[0-9a-zA-Z]{20,}/,                      // Stripe Live Secret
    /sk_test_[0-9a-zA-Z]{20,}/,                      // Stripe Test Secret
    /sbp_[a-f0-9]{30,}/,                             // Supabase Access Token
    /ghp_[0-9a-zA-Z]{30,}/,                          // GitHub Personal Access Token
  ];

  for (const padrao of padroesChaves) {
    if (padrao.test(fichaJson)) {
      throw new Error(`[SEGURANÇA - Seção 8.5] Padrão de chave/token sensível detectado no JSON gerado!`);
    }
  }
}

/**
 * Mapeia o resultado do motor de cruzamento para o modelo Zod da Ficha.
 */
export function montarFicha(input: MontarFichaInput): Ficha {
  const { repo, cruzamento, modulosInternos = 0 } = input;

  // Mapeia serviços para o formato estrito de ServicoFicha
  const servicos: ServicoFicha[] = cruzamento.servicos.map((s) => ({
    id: s.id,
    nome: s.nome,
    categoria: s.categoria,
    subcategoria: s.subcategoria,
    confianca: s.confianca,
    catalogado: s.catalogado,
    sinais: s.sinais.map((sinal) => ({
      tipo: sinal.tipo,
      valor: sinal.valor,
      arquivo: sinal.arquivo,
    })),
  }));

  // Mapeia variáveis
  const variaveis: VariavelFicha[] = cruzamento.variaveis.map((v) => ({
    nome: v.nome,
    idServico: v.idServico,
    arquivo: v.arquivo,
    obrigatoria: v.obrigatoria,
    descricao: v.descricao,
  }));

  const fichaCrua: Ficha = {
    schemaVersion: 1,
    repo: {
      url: repo.url,
      commit: repo.commit,
      branch: repo.branch || 'main',
      visibilidade: repo.visibilidade || 'publico',
    },
    analisadoEm: new Date().toISOString(),
    detector: {
      nome: '@specfy/stack-analyser',
      versao: '1.27.6',
      versaoRegrasProprias: '0.1.0',
    },
    servicos,
    variaveis,
    conexoes: [],
    naoIdentificados: cruzamento.naoCatalogados.map((nc) => ({
      sinal: nc.tech,
      arquivo: nc.sinais[0]?.arquivo || 'package.json',
      motivo: 'Tecnologia detectada ainda não cadastrada no catálogo v1',
    })),
    modulosInternos,
    alertas: [],
  };

  // Validação estrita via Zod
  return FichaSchema.parse(fichaCrua);
}

/**
 * Obtém o diretório padrão ~/.stackatlas/fichas/ resolvendo o 'home' no Windows/POSIX.
 */
export function obterDiretorioFichasPadrao(): string {
  return path.join(os.homedir(), '.stackatlas', 'fichas');
}

/**
 * Gera o nome de arquivo versionado: <dono>__<repo>__<commit_curto>.json
 */
export function gerarNomeArquivoFicha(dono: string, nomeRepo: string, commitHash: string): string {
  const donoSanitizado = dono.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const repoSanitizado = nomeRepo.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const commitCurto = (commitHash || '0000000').slice(0, 7);
  return `${donoSanitizado}__${repoSanitizado}__${commitCurto}.json`;
}

/**
 * Valida a ficha com Zod, executa o teste de segurança e grava o JSON versionado em disco.
 */
export async function gravarFicha(
  ficha: Ficha,
  options: GravarFichaOptions & { dono?: string; nomeRepo?: string } = {}
): Promise<{ caminho: string; ficha: Ficha; conteudoJson: string }> {
  // 1. Validação com Zod
  const fichaValidada = FichaSchema.parse(ficha);

  // 2. Determina dono e repositório
  const { dono: donoInferido, repo: repoInferido } = extrairDonoERepo(fichaValidada.repo.url);
  const dono = options.dono || donoInferido;
  const repo = options.nomeRepo || repoInferido;

  // 3. Serializa o JSON formatado
  const conteudoJson = JSON.stringify(fichaValidada, null, 2);

  // 4. Teste de segurança rigoroso (Seção 8.5)
  verificarSegurancaFicha(conteudoJson, options.valoresProibidos);

  // 5. Garante a existência da pasta ~/.stackatlas/fichas/
  const dirFichas = options.diretorioFichas || obterDiretorioFichasPadrao();
  await fs.mkdir(dirFichas, { recursive: true });

  // 6. Grava o arquivo JSON
  const nomeArquivo = gerarNomeArquivoFicha(dono, repo, fichaValidada.repo.commit);
  const caminhoCompleto = path.join(dirFichas, nomeArquivo);
  await fs.writeFile(caminhoCompleto, conteudoJson, 'utf-8');

  return {
    caminho: caminhoCompleto,
    ficha: fichaValidada,
    conteudoJson,
  };
}
