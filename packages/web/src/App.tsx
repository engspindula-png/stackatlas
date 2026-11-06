import React, { useEffect, useState } from 'react';
import { obterFichas, executarTestesConexao, obterEstadoLocal, obterCatalogo } from './api.js';
import { Sidebar } from './components/Sidebar.js';
import { MapLayer1 } from './components/MapLayer1.js';
import type { ItemFichaSalva, Ficha, ItemTesteResultado, ServicoFicha, EntradaCatalogoInfo } from './types.js';

export const App: React.FC = () => {
  const [fichas, setFichas] = useState<ItemFichaSalva[]>([]);
  const [fichaAtivaItem, setFichaAtivaItem] = useState<ItemFichaSalva | null>(null);
  const [catalogo, setCatalogo] = useState<EntradaCatalogoInfo[]>([]);
  const [servicoSelecionado, setServicoSelecionado] = useState<ServicoFicha | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [testando, setTestando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);
  const [testesEstado, setTestesEstado] = useState<Record<string, ItemTesteResultado>>({});

  useEffect(() => {
    (window as any).__selecionarServico = (s: ServicoFicha | null) => setServicoSelecionado(s);
  }, []);

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        setErro(null);
        const [lista, listaCatalogo] = await Promise.all([
          obterFichas(),
          obterCatalogo(),
        ]);
        setFichas(lista);
        setCatalogo(listaCatalogo);
        if (lista.length > 0) {
          setFichaAtivaItem(lista[0]);
          await carregarEstadoFicha(lista[0].arquivo);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Falha ao conectar ao servidor local';
        setErro(msg);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  async function carregarEstadoFicha(nomeArquivo: string) {
    try {
      const estado = await obterEstadoLocal(nomeArquivo);
      if (estado && estado.testes) {
        const mapa: Record<string, ItemTesteResultado> = {};
        for (const [sId, item] of Object.entries(estado.testes as Record<string, any>)) {
          mapa[sId] = {
            servicoId: sId,
            servicoNome: sId,
            nivel: item.nivel,
            resultado: item.resultado,
            data: item.data,
            detalhe: item.detalhe,
          };
        }
        setTestesEstado(mapa);
      } else {
        setTestesEstado({});
      }
    } catch {
      setTestesEstado({});
    }
  }

  const aoMudarFicha = async (evento: React.ChangeEvent<HTMLSelectElement>) => {
    const nomeArquivo = evento.target.value;
    const selecionada = fichas.find((f) => f.arquivo === nomeArquivo);
    if (selecionada) {
      setFichaAtivaItem(selecionada);
      setServicoSelecionado(null);
      await carregarEstadoFicha(selecionada.arquivo);
    }
  };

  const aoTestarConexoes = async (chaveAnthropic?: string) => {
    if (!fichaAtivaItem) return;

    try {
      setTestando(true);
      const servicosParaTestar = fichaAtivaItem.ficha.servicos
        .filter((s) => s.id)
        .map((s) => {
          const sId = s.id!.toLowerCase();
          if (sId === 'anthropic') {
            return {
              servicoId: s.id!,
              nivel: 3 as const,
              valorChave: chaveAnthropic || undefined,
            };
          }
          // Para os demais serviços (Supabase, Turso, etc.), roda Nível 2 (alcance)
          return {
            servicoId: s.id!,
            nivel: 2 as const,
          };
        });

      const resposta = await executarTestesConexao(fichaAtivaItem.arquivo, servicosParaTestar);

      const novoMapa = { ...testesEstado };
      for (const res of resposta.resultados) {
        novoMapa[res.servicoId] = res;
      }
      setTestesEstado(novoMapa);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao executar testes';
      alert(`Falha nos testes de conexão: ${msg}`);
    } finally {
      setTestando(false);
    }
  };

  const fichaAtiva = fichaAtivaItem?.ficha || null;

  return (
    <>
      <header className="app-header">
        <div className="brand">
          <div className="brand-logo">SA</div>
          <div>
            <h1 className="brand-title">StackAtlas</h1>
            <span className="brand-subtitle">Inventário de Arquitetura Local</span>
          </div>
        </div>

        <div className="header-controls">
          {fichas.length > 0 && (
            <select
              className="fichas-select"
              onChange={aoMudarFicha}
              aria-label="Selecionar ficha carregada"
            >
              {fichas.map((f) => (
                <option key={f.arquivo} value={f.arquivo}>
                  {f.dono}/{f.repo} ({f.commit})
                </option>
              ))}
            </select>
          )}

          <div className="status-badge" title="Servidor backend ativo na porta 4173">
            <span className="status-dot"></span>
            <span>127.0.0.1:4173</span>
          </div>
        </div>
      </header>

      <div className="app-container">
        <main className="main-viewport">
          {carregando ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <p>Carregando fichas locais...</p>
            </div>
          ) : erro ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
              <p style={{ color: '#ef4444', fontWeight: 600 }}>Não foi possível carregar as fichas:</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{erro}</p>
              <p style={{ color: 'var(--text-dim)', fontSize: '12px' }}>Certifique-se de que o servidor local está rodando em <code>127.0.0.1:4173</code>.</p>
            </div>
          ) : fichaAtiva ? (
            <MapLayer1
              ficha={fichaAtiva}
              catalogo={catalogo}
              servicoSelecionado={servicoSelecionado}
              aoSelecionarServico={setServicoSelecionado}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <p>Nenhuma ficha selecionada.</p>
            </div>
          )}
        </main>

        <Sidebar
          ficha={fichaAtiva}
          servicoFocado={servicoSelecionado}
          aoLimparFoco={() => setServicoSelecionado(null)}
          catalogo={catalogo}
          testesEstado={testesEstado}
          aoTestar={aoTestarConexoes}
          testando={testando}
        />
      </div>
    </>
  );
};

