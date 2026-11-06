import type {
  RespostaFichasApi,
  ItemFichaSalva,
  Ficha,
  RespostaTesteApi,
  ItemTesteResultado,
  EntradaCatalogoInfo,
} from './types.js';
import { CATALOGO_FALLBACK } from './utils/catalogoFallback.js';

const API_BASE = '/api';
const DIRECT_BACKEND = 'http://127.0.0.1:4173/api';

/**
 * Busca todas as fichas salvas na rota GET /api/fichas do servidor local.
 */
export async function obterFichas(): Promise<ItemFichaSalva[]> {
  try {
    let res = await fetch(`${API_BASE}/fichas`);
    if (!res.ok) {
      res = await fetch(`${DIRECT_BACKEND}/fichas`);
    }
    if (!res.ok) {
      throw new Error(`Erro na requisição: ${res.status} ${res.statusText}`);
    }
    const data: RespostaFichasApi = await res.json();
    return data.fichas;
  } catch (err) {
    try {
      const res = await fetch(`${DIRECT_BACKEND}/fichas`);
      if (res.ok) {
        const data: RespostaFichasApi = await res.json();
        return data.fichas;
      }
    } catch {
      // ignora e lança o erro original
    }
    console.error('Falha ao buscar fichas do servidor local:', err);
    throw err;
  }
}

/**
 * Busca uma ficha específica pelo nome do arquivo JSON.
 */
export async function obterFichaPorNome(nomeArquivo: string): Promise<Ficha> {
  let res = await fetch(`${API_BASE}/fichas/${encodeURIComponent(nomeArquivo)}`);
  if (!res.ok) {
    res = await fetch(`${DIRECT_BACKEND}/fichas/${encodeURIComponent(nomeArquivo)}`);
  }
  if (!res.ok) {
    throw new Error(`Falha ao obter ficha ${nomeArquivo}: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Executa testes de conexão via POST /api/testar no servidor local.
 */
export async function executarTestesConexao(
  chaveFicha: string,
  servicos: Array<{ servicoId: string; nivel?: 1 | 2 | 3; valorChave?: string }>
): Promise<RespostaTesteApi> {
  const payload = {
    chaveFicha,
    servicos,
  };

  let res = await fetch(`${API_BASE}/testar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    res = await fetch(`${DIRECT_BACKEND}/testar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  if (!res.ok) {
    throw new Error(`Erro ao executar testes: ${res.status} ${res.statusText}`);
  }

  return await res.json();
}

/**
 * Obtém o estado local registrado para uma ficha específica.
 */
export async function obterEstadoLocal(chaveFicha: string): Promise<any> {
  try {
    let res = await fetch(`${API_BASE}/estado/${encodeURIComponent(chaveFicha)}`);
    if (!res.ok) {
      res = await fetch(`${DIRECT_BACKEND}/estado/${encodeURIComponent(chaveFicha)}`);
    }
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Obtém a lista completa de serviços do catálogo a partir de GET /api/catalogo.
 */
export async function obterCatalogo(): Promise<EntradaCatalogoInfo[]> {
  try {
    let res = await fetch(`${API_BASE}/catalogo`);
    if (!res.ok) {
      res = await fetch(`${DIRECT_BACKEND}/catalogo`);
    }
    if (res.ok) {
      const data = await res.json();
      if (data.catalogo && data.catalogo.length > 0) {
        return data.catalogo;
      }
    }
  } catch {
    // se falhar conexão direta, utiliza o catálogo tipado local
  }
  return CATALOGO_FALLBACK;
}

