import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { Ficha, ServicoFicha } from '../../../schemas/ficha.js';
import { lerMeuStack, sincronizarServicosComMeuStack, obterCaminhoMeuStack } from './meuStack.js';

export interface OpcoesExportacaoIa {
  arquivoSaida?: string;
  destinoDir?: string;
  nomeArquivo?: 'CLAUDE.md' | 'AGENTS.md';
  meuStack?: string[];
  caminhoRelativoCatalogo?: string;
  sincronizarMeuStack?: boolean;
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
 * Contém o índice da stack atual e regras de sistema estritas sobre meu-stack.json,
 * nomenclatura oficial de .env.example e proteção contra pacotes obsoletos.
 */
export function gerarContextoIa(ficha: Ficha, opcoes: OpcoesExportacaoIa = {}): string {
  const relCatalog = opcoes.caminhoRelativoCatalogo || 'catalog';
  const linhas: string[] = [];

  // Obtém lista de serviços homologados do meu-stack.json
  const meuStackAtual = opcoes.meuStack && opcoes.meuStack.length > 0
    ? opcoes.meuStack
    : lerMeuStack().servicos.map((s) => s.id);

  linhas.push(`# StackAtlas — Contexto de Arquitetura e Regras de Sistema`);
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

  // 2. Regras Estritas de Sistema para IA de Programação
  linhas.push(`## 2. Regras Estritas de Sistema para IA de Programação`);
  linhas.push(``);
  linhas.push(`A IA que atua no desenvolvimento, manutenção ou refatoração deste projeto DEVE obedecer rigorosamente às seguintes diretrizes:`);
  linhas.push(``);

  // Regra 1: Reaproveitamento da Stack Homologada (meu-stack.json)
  const listaStackStr = meuStackAtual.length > 0
    ? meuStackAtual.map((s) => `\`${s}\``).join(', ')
    : '`supabase`';

  linhas.push(`1. **Reaproveitamento de Serviços Homologados (\`meu-stack.json\`):**`);
  linhas.push(`   - Antes de sugerir a adoção de novas ferramentas para novas funcionalidades (como bancos de dados, autenticação, modelos de IA ou e-mails), consulte os serviços já homologados pelo usuário em \`~/.stackatlas/meu-stack.json\`.`);
  linhas.push(`   - Priorize SEMPRE os serviços já homologados e familiares ao desenvolvedor (${listaStackStr}).`);
  linhas.push(`   - NUNCA introduza ferramentas redundantes ou novos fornecedores externos para categorias já atendidas pela stack homologada sem requisição explícita.`);
  linhas.push(``);

  // Regra 2: Geração de .env.example com nomenclatura exata
  linhas.push(`2. **Geração e Manutenção do \`.env.example\` com Nomenclatura Exata:**`);
  linhas.push(`   - Ao adicionar ou alterar variáveis de ambiente para serviços externos, NUNCA invente nomes arbitrários.`);
  linhas.push(`   - Consulte o YAML do serviço em \`${relCatalog}/<categoria>/<servico>.yaml\` e utilize EXATAMENTE os nomes de variáveis homologados no campo \`variaveis\` do catálogo.`);
  linhas.push(`   - NUNCA insira nem solicite valores reais, credenciais ou tokens em arquivos de código ou exemplos; limite-se aos nomes padronizados.`);
  linhas.push(``);

  // Regra 3: Proteção contra dependências obsoletas
  linhas.push(`3. **Proteção Rigorosa Contra Dependências Obsoletas:**`);
  linhas.push(`   - NUNCA sugira a instalação ou o uso de pacotes listados em \`dependenciasObsoletas\` no catálogo do StackAtlas.`);
  linhas.push(`   - Pacotes descontinuados conhecidos e suas alternativas oficiais obrigatórias:`);
  linhas.push(`     - ❌ \`aws-sdk\` (v2 descontinuado) ➔ Utilize SDK v3 modular (ex: \`@aws-sdk/client-ses\`).`);
  linhas.push(`     - ❌ \`@google/generative-ai\` (obsoleto) ➔ Utilize \`@google/genai\`.`);
  linhas.push(`     - ❌ \`mailgun-js\` (abandonado) ➔ Utilize \`mailgun.js\` com \`form-data\`.`);
  linhas.push(`   - Antes de sugerir comandos de instalação (\`npm install\`, \`pnpm add\`), verifique se o pacote não está presente em \`dependenciasObsoletas\` no YAML do respectivo serviço.`);
  linhas.push(``);

  // Regra 4: Consulta Sob Demanda ao Catálogo
  linhas.push(`4. **Consulta Sob Demanda ao Catálogo:**`);
  linhas.push(`   - NUNCA solicite nem carregue em contexto o catálogo inteiro de uma vez.`);
  linhas.push(`   - Ao implementar ou integrar um serviço específico, consulte EXCLUSIVAMENTE o seu arquivo YAML individual em \`${relCatalog}/<categoria>/<servico>.yaml\`.`);
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

  // Sincroniza os serviços da ficha atual no meu-stack.json do usuário
  if (opcoes.sincronizarMeuStack !== false && ficha.servicos && ficha.servicos.length > 0) {
    sincronizarServicosComMeuStack(
      ficha.servicos
        .filter((s): s is ServicoFicha & { id: string } => typeof s.id === 'string' && s.id.length > 0)
        .map((s) => ({
          id: s.id,
          nome: s.nome,
          categoria: s.categoria,
          origem: ficha.repo.url,
        }))
    );
  }

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
