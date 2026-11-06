import React, { useEffect, useState } from 'react';
import { obterFichas } from './api.js';
import { Sidebar } from './components/Sidebar.js';
import type { ItemFichaSalva, Ficha } from './types.js';

export const App: React.FC = () => {
  const [fichas, setFichas] = useState<ItemFichaSalva[]>([]);
  const [fichaAtiva, setFichaAtiva] = useState<Ficha | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        setErro(null);
        const lista = await obterFichas();
        setFichas(lista);
        if (lista.length > 0) {
          setFichaAtiva(lista[0].ficha);
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

  const aoMudarFicha = (evento: React.ChangeEvent<HTMLSelectElement>) => {
    const nomeArquivo = evento.target.value;
    const selecionada = fichas.find((f) => f.arquivo === nomeArquivo);
    if (selecionada) {
      setFichaAtiva(selecionada.ficha);
    }
  };

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
          ) : (
            <div id="map-container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* O mapa da Camada 1 será montado aqui na Tarefa 12 */}
              <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
                <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Visualização da Camada 1
                </p>
                <p style={{ fontSize: '13px' }}>
                  {fichaAtiva ? `${fichaAtiva.servicos.length} serviço(s) catalogado(s) identificado(s)` : 'Selecione uma ficha'}
                </p>
              </div>
            </div>
          )}
        </main>

        <Sidebar ficha={fichaAtiva} />
      </div>
    </>
  );
};
