import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { Ficha, ServicoFicha } from '../../../schemas/ficha.js';

export interface OpcoesExportacaoIa {
  arquivoSaida?: string;
  destinoDir?: string;
  nomeArquivo?: 'CLAUDE.md' | 'AGENTS.md';
  meuStack?: string[];
  caminhoRelativoCatalogo?: string;
}

/**
 * Localiza a ficha correspondente a um projeto a partir do caminho informado ou de ~/.stackatlas/fichas/
 */
export function resolverFichaParaAlvo(alvo: string): { caminhoFicha: string; ficha: Ficha } {
  // 1. Se o alvo for diretamente um arquivo .json existente
  if (alvo.endsWith('.json') && fs.existsSync(alvo)) {
    const raw = fs.readFileSync(alvo, 'utf8');
    return { caminhoFicha: path.resolve(alvo), ficha: JSON.parse(raw) as Ficha };
  }

  const fichasDir = path.join(os.homedir(), '.stackatlas', 'fichas');
  if (!fs.existsSync(fichasDir)) {
    throw new Error(`Diretório de fichas não encontrado em: ${fichasDir}`);
  }

  // Normaliza o nome do alvo (ex: 'fixtures/nextjs-subscription-payments' -> 'nextjs-subscription-payments')
  const baseName = path.basename(alvo);
  const arquivos = fs.readdirSync(fichasDir).filter((f) => f.endsWith('.json'));

  // Busca arquivo que contenha o nome do repositório
  const match = arquivos.find((f) => f.includes(baseName));
  if (match) {
    const fullPath = path.join(fichasDir, match);
    const raw = fs.readFileSync(fullPath, 'utf8');
    return { caminhoFicha: fullPath, ficha: JSON.parse(raw) as Ficha };
  }

  // Se não encontrar por nome exato, verifica o campo repo dentro das fichas
  for (const arq of arquivos) {
    try {
      const fullPath = path.join(fichasDir, arq);
      const data = JSON.parse(fs.readFileSync(fullPath, 'utf8')) as Ficha;
      if (
        data.repo?.url?.includes(baseName) ||
        data.repo?.url?.endsWith(alvo) ||
        data.repo?.commit?.startsWith(alvo)
      ) {
        return { caminhoFicha: fullPath, ficha: data };
      }
    } catch {
      // ignora arquivos corrompidos
    }
  }

  throw new Error(`Nenhuma ficha encontrada para o alvo '${alvo}' em ~/.stackatlas/fichas/`);
}

/**
 * Gera o conteúdo ultracompacto para o arquivo de contexto da IA (CLAUDE.md / AGENTS.md).
 * Contém o índice da stack atual e a regra de consulta sob demanda ao catálogo.
 */
export function gerarContextoIa(ficha: Ficha, opcoes: OpcoesExportacaoIa = {}): string {
  const relCatalog = opcoes.caminhoRelativoCatalogo || 'catalog';
  const linhas: string[] = [];

  linhas.push(`# StackAtlas — Contexto de Arquitetura`);
  linhas.push(``);
  linhas.push(`> Repositório: \`${ficha.repo.url}\` | Commit: \`${ficha.repo.commit.slice(0, 7)}\``);
  linhas.push(``);

  // 1. Índice da Stack Atual
  linhas.push(`## 1. Índice da Stack Atual`);
  linhas.push(``);

  // Serviços Externos Catalogados
  if (ficha.servicos && ficha.servicos.length > 0) {
    linhas.push(`### Serviços Externos Detectados`);
    for (const s of ficha.servicos) {
      const depPrincipal = s.sinais.find((sn) => sn.tipo === 'dependencia')?.valor || 'N/A';
      const yamlRef = `${relCatalog}/${s.categoria}/${s.id}.yaml`;
      linhas.push(`- **${s.nome}** (\`${s.id}\`) — Categoria: *${s.categoria}* | Confiança: \`${s.confianca}\``);
      linhas.push(`  - Pacote/Sinal: \`${depPrincipal}\``);
      linhas.push(`  - Especificação e Schema: \`${yamlRef}\``);
    }
    linhas.push(``);
  }

  // Tecnologias Gerais e Infraestrutura
  if (ficha.naoIdentificados && ficha.naoIdentificados.length > 0) {
    linhas.push(`### Infraestrutura e Frameworks`);
    const agrupado = ficha.naoIdentificados.map((n) => `\`${n.sinal}\``).join(', ');
    linhas.push(`- Tecnologias base: ${agrupado}`);
    linhas.push(``);
  }

  // Variáveis Declaradas
  if (ficha.variaveis && ficha.variaveis.length > 0) {
    linhas.push(`### Variáveis de Ambiente Esperadas`);
    for (const v of ficha.variaveis) {
      const flag = v.obrigatoria ? 'Obrigatória' : 'Opcional';
      linhas.push(`- \`${v.nome}\` (${flag}) — Serviço: ${v.idServico || 'Geral'}`);
    }
    linhas.push(``);
  }

  // 2. Regra de Consulta Sob Demanda ao Catálogo
  linhas.push(`## 2. Instruções Rígidas para IA de Programação`);
  linhas.push(``);
  linhas.push(`1. **Consulta Sob Demanda ao Catálogo:**`);
  linhas.push(`   - NUNCA despeje ou solicite o catálogo inteiro de uma vez.`);
  linhas.push(`   - Quando precisar configurar, codificar ou integrar um serviço específico, consulte EXCLUSIVAMENTE o seu arquivo YAML individual em \`${relCatalog}/<categoria>/<servico>.yaml\`.`);
  linhas.push(`   - Obtenha dele a lista oficial de variáveis, padrões de autenticação e bibliotecas suportadas.`);

  return linhas.join('\n') + '\n';
}

/**
 * Exporta o arquivo de contexto para IA no diretório de destino do projeto.
 */
export async function exportarContextoIa(
  alvo: string,
  opcoes: OpcoesExportacaoIa = {}
): Promise<{ caminhoArquivo: string; conteudo: string }> {
  const { caminhoFicha, ficha } = resolverFichaParaAlvo(alvo);
  const nomeArquivo = opcoes.nomeArquivo || 'CLAUDE.md';

  let dirDestino = opcoes.destinoDir;
  if (!dirDestino) {
    if (fs.existsSync(alvo) && fs.statSync(alvo).isDirectory()) {
      dirDestino = path.resolve(alvo);
    } else {
      dirDestino = process.cwd();
    }
  }

  const caminhoSaida = opcoes.arquivoSaida
    ? path.resolve(opcoes.arquivoSaida)
    : path.join(dirDestino, nomeArquivo);

  const conteudo = gerarContextoIa(ficha, opcoes);
  fs.writeFileSync(caminhoSaida, conteudo, 'utf8');

  return { caminhoArquivo: caminhoSaida, conteudo };
}
