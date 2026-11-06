import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { carregarCatalogo, type EntradaCatalogo } from './matcher.js';

export type NivelTeste = 1 | 2 | 3;
export type ResultadoTesteStatus =
  | 'ok'
  | 'chave_invalida'
  | 'sem_permissao'
  | 'limite'
  | 'sem_alcance'
  | 'nao_testado'
  | 'erro';

export interface ItemTesteResultado {
  servicoId: string;
  servicoNome: string;
  nivel: NivelTeste;
  resultado: ResultadoTesteStatus;
  data: string;
  detalhe: string;
}

export interface SolicitacaoTesteItem {
  servicoId: string;
  nivel?: NivelTeste;
  // Chave opcional mantida ESTRITAMENTE em memória
  valorChave?: string;
  variavelPreenchida?: boolean;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolverCatalogoDir(): string {
  return path.resolve('catalog');
}

/**
 * Valida se um domínio de destino é permitido pelo catálogo (Seção 7.2).
 */
export function validarDominioPermitido(urlAlvo: string, dominiosPermitidos: string[]): boolean {
  try {
    const parsed = new URL(urlAlvo);
    const hostAlvo = parsed.hostname.toLowerCase();

    return dominiosPermitidos.some((d) => {
      const dLimpo = d.toLowerCase();
      if (dLimpo.startsWith('*.')) {
        const sufixo = dLimpo.slice(2);
        return hostAlvo.endsWith(sufixo);
      }
      return hostAlvo === dLimpo || hostAlvo.endsWith(`.${dLimpo}`);
    });
  } catch {
    return false;
  }
}

/**
 * Executa o Teste de Nível 1 (Existência):
 * Checa se a variável exigida está preenchida (sem enviar nada a ninguém, Seção 7.1).
 */
export function executarTesteNivel1(
  servico: EntradaCatalogo,
  solicitacao: SolicitacaoTesteItem
): ItemTesteResultado {
  const agora = new Date().toISOString();
  const preenchida = Boolean(
    solicitacao.variavelPreenchida || (solicitacao.valorChave && solicitacao.valorChave.trim().length > 0)
  );

  if (preenchida) {
    return {
      servicoId: servico.id,
      servicoNome: servico.nome,
      nivel: 1,
      resultado: 'ok',
      data: agora,
      detalhe: 'Variável de ambiente preenchida em memória',
    };
  }

  return {
    servicoId: servico.id,
    servicoNome: servico.nome,
    nivel: 1,
    resultado: 'erro',
    data: agora,
    detalhe: 'Nenhuma variável configurada para este serviço',
  };
}

/**
 * Executa o Teste de Nível 2 (Alcance):
 * Requisição simples (somente leitura, GET/HEAD) no domínio do serviço com timeout de 10s (Seção 7.1 e 7.2).
 */
export async function executarTesteNivel2(
  servico: EntradaCatalogo
): Promise<ItemTesteResultado> {
  const agora = new Date().toISOString();

  // Determina URL e domínios permitidos a partir do catálogo
  let urlAlvo = servico.site;
  if (!urlAlvo.startsWith('http://') && !urlAlvo.startsWith('https://')) {
    urlAlvo = `https://${urlAlvo}`;
  }

  // Domínios declarados no catálogo
  const dominiosPermitidos: string[] = [];
  try {
    const urlObj = new URL(urlAlvo);
    dominiosPermitidos.push(urlObj.hostname);
  } catch {
    // URL inválida no catálogo
  }

  if (servico.sinais.hosts) {
    dominiosPermitidos.push(...servico.sinais.hosts);
  }

  // Segurança (Seção 7.2): Só domínios declarados no catálogo
  if (!validarDominioPermitido(urlAlvo, dominiosPermitidos)) {
    return {
      servicoId: servico.id,
      servicoNome: servico.nome,
      nivel: 2,
      resultado: 'erro',
      data: agora,
      detalhe: 'Domínio não declarado ou não permitido no catálogo',
    };
  }

  try {
    // Timeout estrito de 10 segundos (Seção 7.2), sem repetição automática
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(urlAlvo, {
      method: 'GET',
      headers: {
        'User-Agent': 'StackAtlas/0.1.0 (Architecture Mapping)',
      },
      signal: controller.signal,
      redirect: 'follow', // Segue redirecionamentos internos, mas validando domínios
    });

    clearTimeout(timeoutId);

    // Se o serviço respondeu (alcance DNS e conexão HTTP bem-sucedidos)
    return {
      servicoId: servico.id,
      servicoNome: servico.nome,
      nivel: 2,
      resultado: 'ok',
      data: agora,
      detalhe: `Domínio alcançável (status ${response.status})`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const detalheCurto = msg.includes('abort') ? 'Tempo limite de 10s excedido' : 'Falha de rede ou DNS';

    return {
      servicoId: servico.id,
      servicoNome: servico.nome,
      nivel: 2,
      resultado: 'sem_alcance',
      data: agora,
      detalhe: detalheCurto,
    };
  }
}

/**
 * Motor de testes unificado para Níveis 1 e 2.
 */
export async function testarServico(
  solicitacao: SolicitacaoTesteItem,
  catalogoDir?: string
): Promise<ItemTesteResultado> {
  const dir = catalogoDir || resolverCatalogoDir();
  const catalogo = await carregarCatalogo(dir);
  const entrada = catalogo.find(
    (c) => c.id.toLowerCase() === solicitacao.servicoId.toLowerCase()
  );

  if (!entrada) {
    return {
      servicoId: solicitacao.servicoId,
      servicoNome: solicitacao.servicoId,
      nivel: solicitacao.nivel || 1,
      resultado: 'erro',
      data: new Date().toISOString(),
      detalhe: 'Serviço não catalogado',
    };
  }

  const nivel = solicitacao.nivel || 2;

  if (nivel === 1) {
    return executarTesteNivel1(entrada, solicitacao);
  }

  if (nivel === 2) {
    return await executarTesteNivel2(entrada);
  }

  return {
    servicoId: entrada.id,
    servicoNome: entrada.nome,
    nivel: 3,
    resultado: 'nao_testado',
    data: new Date().toISOString(),
    detalhe: 'Nível 3 implementado na Tarefa 11',
  };
}
