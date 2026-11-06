import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { obterDiretorioFichasPadrao } from './fichaRecorder.js';
import { testarServico, type SolicitacaoTesteItem, type ItemTesteResultado } from './tester.js';
import type { Ficha } from '../../../schemas/ficha.js';

export interface ResumoFichaSalva {
  arquivo: string;
  dono: string;
  repo: string;
  commit: string;
  analisadoEm: string;
  servicosQtd: number;
  tecnologiasQtd: number;
  ficha: Ficha;
}

export interface ServidorOptions {
  host?: string;
  porta?: number;
  diretorioFichas?: string;
}

export interface ServidorInstancia {
  server: http.Server;
  host: string;
  porta: number;
  url: string;
  fechar: () => Promise<void>;
}

/**
 * Lê todas as fichas gravadas no diretório local de fichas.
 */
export async function listarFichasSalvas(diretorioFichas?: string): Promise<ResumoFichaSalva[]> {
  const dir = diretorioFichas || obterDiretorioFichasPadrao();
  try {
    await fs.mkdir(dir, { recursive: true });
    const arquivos = await fs.readdir(dir);
    const arquivosJson = arquivos.filter((a) => a.endsWith('.json'));

    const lista: ResumoFichaSalva[] = [];
    for (const arq of arquivosJson) {
      try {
        const conteudo = await fs.readFile(path.join(dir, arq), 'utf-8');
        const ficha = JSON.parse(conteudo) as Ficha;
        const partes = arq.replace('.json', '').split('__');
        const dono = partes[0] || 'desconhecido';
        const repo = partes[1] || 'desconhecido';
        const commit = partes[2] || ficha.repo?.commit?.slice(0, 7) || '0000000';

        lista.push({
          arquivo: arq,
          dono,
          repo,
          commit,
          analisadoEm: ficha.analisadoEm || new Date().toISOString(),
          servicosQtd: ficha.servicos?.length || 0,
          tecnologiasQtd: (ficha.servicos?.length || 0) + (ficha.naoIdentificados?.length || 0),
          ficha,
        });
      } catch (err) {
        console.warn(`[listarFichasSalvas] Erro ao ler ficha ${arq}:`, err);
      }
    }

    // Ordena da mais recente para a mais antiga
    return lista.sort((a, b) => new Date(b.analisadoEm).getTime() - new Date(a.analisadoEm).getTime());
  } catch (err) {
    console.error(`[listarFichasSalvas] Erro ao acessar diretório ${dir}:`, err);
    return [];
  }
}

/**
 * Inicia o servidor HTTP leve, estritamente vinculado a 127.0.0.1 (SPEC.md Seção 8.2).
 */
export async function iniciarServidor(options: ServidorOptions = {}): Promise<ServidorInstancia> {
  // Segurança fundamental (Seção 8.2): o host DEVE ser 127.0.0.1
  const host = options.host || '127.0.0.1';
  if (host !== '127.0.0.1' && host !== 'localhost') {
    throw new Error(`[SEGURANÇA - Seção 8.2] O servidor local deve escutar estritamente em 127.0.0.1! Tentativa: ${host}`);
  }

  const porta = options.porta || 4173;
  const dirFichas = options.diretorioFichas || obterDiretorioFichasPadrao();

  const server = http.createServer(async (req, res) => {
    // Configura cabeçalhos CORS e JSON
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url || '/', `http://${host}:${porta}`);
    const pathname = parsedUrl.pathname;

    try {
      // Rota POST /api/testar (Executa testes de conexão conforme Seção 7)
      if (req.method === 'POST' && pathname === '/api/testar') {
        let corpoRaw = '';
        for await (const chunk of req) {
          corpoRaw += chunk;
        }

        let payload: { servicos?: SolicitacaoTesteItem[]; servicoId?: string; nivel?: 1 | 2 | 3; valorChave?: string; chaveFicha?: string } = {};
        try {
          payload = corpoRaw ? JSON.parse(corpoRaw) : {};
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ erro: 'JSON inválido no corpo da requisição.' }));
          return;
        }

        // Permite enviar um único serviço ou lista de serviços
        const listaSolicitada: SolicitacaoTesteItem[] = payload.servicos || (payload.servicoId ? [{
          servicoId: payload.servicoId,
          nivel: payload.nivel,
          valorChave: payload.valorChave,
        }] : []);

        const resultados: ItemTesteResultado[] = [];
        for (const item of listaSolicitada) {
          // Segurança (Seção 7.2): nunca loga ou armazena chaves
          const resultado = await testarServico(item);
          resultados.push(resultado);
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ total: resultados.length, resultados }, null, 2));
        return;
      }
      // Rota GET / ou GET /health
      if (pathname === '/' || pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(
          JSON.stringify(
            {
              status: 'ok',
              servico: 'StackAtlas Local Server',
              versao: '0.1.0',
              host,
              porta,
              diretorioFichas: dirFichas,
            },
            null,
            2
          )
        );
        return;
      }

      // Rota GET /api/fichas (lista todas as fichas salvas)
      if (pathname === '/api/fichas') {
        const fichas = await listarFichasSalvas(dirFichas);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(
          JSON.stringify(
            {
              total: fichas.length,
              diretorio: dirFichas,
              fichas,
            },
            null,
            2
          )
        );
        return;
      }

      // Rota GET /api/fichas/:nome (busca uma ficha específica pelo nome do arquivo)
      if (pathname.startsWith('/api/fichas/')) {
        const nomeArquivoRaw = pathname.replace('/api/fichas/', '');
        // Higienização contra Path Traversal
        const nomeArquivo = path.basename(nomeArquivoRaw);
        if (!nomeArquivo.endsWith('.json')) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ erro: 'O arquivo solicitado deve ser um JSON válido.' }));
          return;
        }

        const caminhoArquivo = path.join(dirFichas, nomeArquivo);
        try {
          const conteudo = await fs.readFile(caminhoArquivo, 'utf-8');
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(conteudo);
          return;
        } catch {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ erro: `Ficha não encontrada: ${nomeArquivo}` }));
          return;
        }
      }

      // 404 para outras rotas
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ erro: 'Rota não encontrada.', rotasDisponiveis: ['/health', '/api/fichas', '/api/fichas/:nome'] }));
    } catch (err: unknown) {
      console.error('[Servidor StackAtlas] Erro na requisição:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      const mensagem = err instanceof Error ? err.message : 'Erro interno do servidor';
      res.end(JSON.stringify({ erro: mensagem }));
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(porta, host, () => resolve());
    server.once('error', reject);
  });

  const url = `http://${host}:${porta}`;

  return {
    server,
    host,
    porta,
    url,
    fechar: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    },
  };
}
