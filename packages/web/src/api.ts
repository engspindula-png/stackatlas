import type { RespostaFichasApi, ItemFichaSalva, Ficha } from './types.js';

const API_BASE = '/api';
const DIRECT_BACKEND = 'http://127.0.0.1:4173/api';

/**
 * Busca todas as fichas salvas na rota GET /api/fichas do servidor local.
 */
export async function obterFichas(): Promise<ItemFichaSalva[]> {
  try {
    // Tenta primeiro através do proxy do Vite (/api/fichas)
    let res = await fetch(`${API_BASE}/fichas`);
    if (!res.ok) {
      // Fallback para requisição direta ao backend na porta 4173
      res = await fetch(`${DIRECT_BACKEND}/fichas`);
    }
    if (!res.ok) {
      throw new Error(`Erro na requisição: ${res.status} ${res.statusText}`);
    }
    const data: RespostaFichasApi = await res.json();
    return data.fichas;
  } catch (err) {
    // Tenta fallback direto se a rota relativa falhar
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
