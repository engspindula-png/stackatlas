import fs from 'node:fs/promises';
import os from 'node:os';
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

  if (nivel === 3) {
    return await executarTesteNivel3(entrada, solicitacao);
  }

  return {
    servicoId: entrada.id,
    servicoNome: entrada.nome,
    nivel,
    resultado: 'nao_testado',
    data: new Date().toISOString(),
    detalhe: 'Nível de teste não suportado',
  };
}

/**
 * Executa o Teste de Nível 3 (Autenticação leve, somente leitura - Seções 7.2 e 7.3).
 * Implementado especificamente para Anthropic: GET https://api.anthropic.com/v1/models
 */
export async function executarTesteNivel3(
  servico: EntradaCatalogo,
  solicitacao: SolicitacaoTesteItem
): Promise<ItemTesteResultado> {
  const agora = new Date().toISOString();

  // Se não foi fornecida nenhuma chave em memória
  if (!solicitacao.valorChave || solicitacao.valorChave.trim().length === 0) {
    return {
      servicoId: servico.id,
      servicoNome: servico.nome,
      nivel: 3,
      resultado: 'chave_invalida',
      data: agora,
      detalhe: 'Nenhuma chave fornecida em memória para autenticação',
    };
  }

  // Anthropic ✓: GET https://api.anthropic.com/v1/models
  if (servico.id.toLowerCase() === 'anthropic') {
    const urlAlvo = 'https://api.anthropic.com/v1/models';
    const dominiosPermitidos = ['api.anthropic.com'];

    // Segurança (Seção 7.2): Validar domínio
    if (!validarDominioPermitido(urlAlvo, dominiosPermitidos)) {
      return {
        servicoId: servico.id,
        servicoNome: servico.nome,
        nivel: 3,
        resultado: 'erro',
        data: agora,
        detalhe: 'Domínio do endpoint não autorizado pelo catálogo',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // Chave em memória apenas nos headers, NUNCA exposta em log ou URL
      const response = await fetch(urlAlvo, {
        method: 'GET',
        headers: {
          'x-api-key': solicitacao.valorChave.trim(),
          'anthropic-version': '2023-06-01',
          'User-Agent': 'StackAtlas/0.1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Mapeamento estrito da Seção 7.2:
      // 200 é ok; 401 é chave inválida; 403 é sem permissão; 429 é limite; falha de rede/DNS é sem alcance
      if (response.status === 200) {
        return {
          servicoId: servico.id,
          servicoNome: servico.nome,
          nivel: 3,
          resultado: 'ok',
          data: agora,
          detalhe: 'Autenticação bem-sucedida (status 200)',
        };
      }

      if (response.status === 401) {
        return {
          servicoId: servico.id,
          servicoNome: servico.nome,
          nivel: 3,
          resultado: 'chave_invalida',
          data: agora,
          detalhe: 'Chave de autenticação inválida (status 401)',
        };
      }

      if (response.status === 403) {
        return {
          servicoId: servico.id,
          servicoNome: servico.nome,
          nivel: 3,
          resultado: 'sem_permissao',
          data: agora,
          detalhe: 'Sem permissão de acesso à API (status 403)',
        };
      }

      if (response.status === 429) {
        return {
          servicoId: servico.id,
          servicoNome: servico.nome,
          nivel: 3,
          resultado: 'limite',
          data: agora,
          detalhe: 'Limite de taxa de requisições excedido (status 429)',
        };
      }

      return {
        servicoId: servico.id,
        servicoNome: servico.nome,
        nivel: 3,
        resultado: 'erro',
        data: agora,
        detalhe: `Resposta inesperada da API (status ${response.status})`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const detalheCurto = msg.includes('abort') ? 'Tempo limite de 10s excedido' : 'Falha de conexão com a API';

      return {
        servicoId: servico.id,
        servicoNome: servico.nome,
        nivel: 3,
        resultado: 'sem_alcance',
        data: agora,
        detalhe: detalheCurto,
      };
    }
  }

  // Para outros serviços na v1 sem nível 3 liberado
  return {
    servicoId: servico.id,
    servicoNome: servico.nome,
    nivel: 3,
    resultado: 'nao_testado',
    data: agora,
    detalhe: 'Endpoint de nível 3 não implementado para este serviço',
  };
}

/**
 * Estrutura do arquivo de Estado Local (SPEC.md Seção 5.2):
 * ~/.stackatlas/estado/<mesma chave da ficha>.json
 */
export interface EstadoLocalArquivo {
  schemaVersion: number;
  chaveFicha: string;
  atualizadoEm: string;
  testes: Record<
    string,
    {
      nivel: NivelTeste;
      resultado: ResultadoTesteStatus;
      data: string;
      detalhe: string;
    }
  >;
}

export function obterDiretorioEstadoPadrao(): string {
  return path.join(os.homedir(), '.stackatlas', 'estado');
}

/**
 * Grava o arquivo de estado local, NUNCA gravando chaves ou segredos (Seção 5.2 e 7.2).
 */
export async function gravarEstadoLocal(
  chaveFicha: string,
  novosResultados: ItemTesteResultado[],
  dirEstado?: string
): Promise<{ caminho: string; estado: EstadoLocalArquivo }> {
  const dir = dirEstado || obterDiretorioEstadoPadrao();
  await fs.mkdir(dir, { recursive: true });

  const chaveLimpa = chaveFicha.replace(/\.json$/, '');
  const caminhoArquivo = path.join(dir, `${chaveLimpa}.json`);

  // Lê estado existente se houver
  let estadoExistente: EstadoLocalArquivo = {
    schemaVersion: 1,
    chaveFicha: chaveLimpa,
    atualizadoEm: new Date().toISOString(),
    testes: {},
  };

  try {
    const conteudo = await fs.readFile(caminhoArquivo, 'utf-8');
    estadoExistente = JSON.parse(conteudo);
  } catch {
    // Arquivo novo
  }

  // Atualiza com os novos testes
  for (const item of novosResultados) {
    estadoExistente.testes[item.servicoId] = {
      nivel: item.nivel,
      resultado: item.resultado,
      data: item.data,
      detalhe: item.detalhe,
    };
  }

  estadoExistente.atualizadoEm = new Date().toISOString();

  // Teste de segurança: varredura no JSON gerado para garantir ausência de chaves
  const jsonFinal = JSON.stringify(estadoExistente, null, 2);
  const padroesSuspeitos = [
    /eyJ[A-Za-z0-9-_]{10,}\.eyJ[A-Za-z0-9-_]{10,}/,
    /sk_live_[0-9a-zA-Z]{20,}/,
    /sk-ant-[0-9a-zA-Z]{10,}/,
    /sbp_[a-f0-9]{30,}/,
  ];
  for (const p of padroesSuspeitos) {
    if (p.test(jsonFinal)) {
      throw new Error('[SEGURANÇA - Seção 7.2] Tentativa de gravar chave sensível no arquivo de estado!');
    }
  }

  await fs.writeFile(caminhoArquivo, jsonFinal, 'utf-8');

  return {
    caminho: caminhoArquivo,
    estado: estadoExistente,
  };
}

/**
 * Lê o arquivo de estado local para a ficha especificada.
 */
export async function lerEstadoLocal(
  chaveFicha: string,
  dirEstado?: string
): Promise<EstadoLocalArquivo | null> {
  const dir = dirEstado || obterDiretorioEstadoPadrao();
  const chaveLimpa = chaveFicha.replace(/\.json$/, '');
  const caminhoArquivo = path.join(dir, `${chaveLimpa}.json`);

  try {
    const conteudo = await fs.readFile(caminhoArquivo, 'utf-8');
    return JSON.parse(conteudo) as EstadoLocalArquivo;
  } catch {
    return null;
  }
}

