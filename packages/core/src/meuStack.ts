import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export interface ServicoMeuStack {
  id: string;
  nome: string;
  categoria: string;
  validadoEm?: string;
  origem?: string;
}

export interface MeuStackData {
  versao: number;
  atualizadoEm: string;
  servicos: ServicoMeuStack[];
}

/**
 * Retorna o caminho absoluto do arquivo ~/.stackatlas/meu-stack.json
 */
export function obterCaminhoMeuStack(): string {
  return path.join(os.homedir(), '.stackatlas', 'meu-stack.json');
}

/**
 * Lê o arquivo ~/.stackatlas/meu-stack.json.
 * Se o arquivo não existir, retorna a estrutura inicial vazia.
 */
export function lerMeuStack(): MeuStackData {
  const caminho = obterCaminhoMeuStack();
  if (!fs.existsSync(caminho)) {
    return {
      versao: 1,
      atualizadoEm: new Date().toISOString(),
      servicos: [],
    };
  }

  try {
    const raw = fs.readFileSync(caminho, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      versao: parsed.versao || 1,
      atualizadoEm: parsed.atualizadoEm || new Date().toISOString(),
      servicos: Array.isArray(parsed.servicos) ? parsed.servicos : [],
    };
  } catch (err) {
    console.warn(`[meuStack] Aviso ao ler ${caminho}:`, err);
    return {
      versao: 1,
      atualizadoEm: new Date().toISOString(),
      servicos: [],
    };
  }
}

/**
 * Salva os dados no arquivo ~/.stackatlas/meu-stack.json com formatação JSON.
 */
export function salvarMeuStack(dados: MeuStackData): void {
  const caminho = obterCaminhoMeuStack();
  const dir = path.dirname(caminho);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  dados.atualizadoEm = new Date().toISOString();
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), 'utf8');
}

/**
 * Registra ou atualiza um ou mais serviços validados no meu-stack.json.
 * Não duplica serviços existentes (atualiza apenas data/origem se já existir).
 */
export function sincronizarServicosComMeuStack(
  novosServicos: Array<{ id: string; nome?: string; categoria?: string; origem?: string }>
): MeuStackData {
  const meuStack = lerMeuStack();
  let alterado = false;

  for (const s of novosServicos) {
    if (!s.id) continue;
    const sId = s.id.toLowerCase();
    const index = meuStack.servicos.findIndex((item) => item.id.toLowerCase() === sId);

    if (index === -1) {
      meuStack.servicos.push({
        id: sId,
        nome: s.nome || s.id,
        categoria: s.categoria || 'geral',
        validadoEm: new Date().toISOString(),
        origem: s.origem,
      });
      alterado = true;
    } else {
      // Atualiza timestamp se já existir
      meuStack.servicos[index].validadoEm = new Date().toISOString();
      if (s.origem) meuStack.servicos[index].origem = s.origem;
      alterado = true;
    }
  }

  if (alterado || !fs.existsSync(obterCaminhoMeuStack())) {
    salvarMeuStack(meuStack);
  }

  return meuStack;
}
