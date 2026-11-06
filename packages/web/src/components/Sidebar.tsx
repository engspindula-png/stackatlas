import React, { useState } from 'react';
import type { Ficha, ServicoFicha, ItemTesteResultado } from '../types.js';

interface SidebarProps {
  ficha: Ficha | null;
  testesEstado?: Record<string, ItemTesteResultado>;
  aoTestar?: (chaveAnthropic?: string) => Promise<void> | void;
  testando?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  ficha,
  testesEstado = {},
  aoTestar,
  testando = false,
}) => {
  const [chaveAnthropic, setChaveAnthropic] = useState<string>('');

  if (!ficha) {
    return (
      <aside className="sidebar vazioview">
        <div className="sidebar-empty">
          <p>Nenhuma ficha carregada.</p>
        </div>
      </aside>
    );
  }

  const dataFormatada = new Date(ficha.analisadoEm).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });

  const commitCurto = ficha.repo.commit.slice(0, 7);
  const temAnthropic = ficha.servicos.some((s) => s.id?.toLowerCase() === 'anthropic');

  return (
    <aside className="sidebar" aria-label="Painel de detalhes da ficha">
      {/* Cabeçalho do Repositório */}
      <div className="sidebar-section repo-header-card">
        <div className="repo-badge-row">
          <span className="badge-visibilidade">{ficha.repo.visibilidade.toUpperCase()}</span>
          <span className="badge-branch">branch: {ficha.repo.branch}</span>
        </div>
        <h2 className="repo-title" title={ficha.repo.url}>
          {ficha.repo.url.replace(/https?:\/\/github\.com\//, '').replace(/\.git$/, '')}
        </h2>
        <div className="repo-meta-grid">
          <div className="meta-item">
            <span className="meta-label">Commit:</span>
            <code className="meta-commit" title={ficha.repo.commit}>
              {commitCurto}
            </code>
          </div>
          <div className="meta-item">
            <span className="meta-label">Analisado em:</span>
            <span className="meta-value">{dataFormatada}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Detector:</span>
            <span className="meta-value">{ficha.detector.nome} v{ficha.detector.versao}</span>
          </div>
        </div>

        {/* Botão de Testes de Conexão (Tarefas 10 e 11) */}
        <div className="testes-acao-container" style={{ marginTop: '16px' }}>
          {temAnthropic && (
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                Chave Anthropic (Nível 3 - apenas em memória):
              </label>
              <input
                type="password"
                placeholder="sk-ant-..."
                value={chaveAnthropic}
                onChange={(e) => setChaveAnthropic(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                }}
              />
            </div>
          )}
          <button
            className="btn-testar-conexoes"
            onClick={() => aoTestar && aoTestar(chaveAnthropic)}
            disabled={testando}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: testando ? '#4b5563' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: testando ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {testando ? 'Testando Conexões...' : '⚡ Testar Conexões (Níveis 1-3)'}
          </button>
        </div>
      </div>

      {/* Lista de Serviços Catalogados */}
      <div className="sidebar-section">
        <div className="section-title-row">
          <h3 className="section-title">Serviços Catalogados</h3>
          <span className="section-count">{ficha.servicos.length}</span>
        </div>

        {ficha.servicos.length === 0 ? (
          <p className="empty-hint">Nenhum serviço catalogado nesta ficha.</p>
        ) : (
          <div className="servicos-lista">
            {ficha.servicos.map((s: ServicoFicha, idx: number) => {
              const ehCerto = s.confianca === 'certo';
              const teste = s.id ? testesEstado[s.id] : undefined;

              return (
                <div key={idx} className={`servico-card ${ehCerto ? 'confianca-certo' : 'confianca-provavel'}`}>
                  <div className="servico-header">
                    <div className="servico-identificacao">
                      <strong className="servico-nome">{s.nome}</strong>
                      <span className="servico-cat">{s.categoria} / {s.subcategoria}</span>
                    </div>
                    <span className={`badge-confianca ${ehCerto ? 'certo' : 'provavel'}`}>
                      {ehCerto ? '✓ CERTO' : '? PROVÁVEL'}
                    </span>
                  </div>

                  {/* Status do Teste de Conexão */}
                  {teste && (
                    <div
                      className={`badge-teste badge-teste-${teste.resultado}`}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        marginTop: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor:
                          teste.resultado === 'ok'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : teste.resultado === 'chave_invalida'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                        color:
                          teste.resultado === 'ok'
                            ? '#10b981'
                            : teste.resultado === 'chave_invalida'
                            ? '#ef4444'
                            : '#f59e0b',
                        border: `1px solid ${
                          teste.resultado === 'ok'
                            ? 'rgba(16, 185, 129, 0.3)'
                            : teste.resultado === 'chave_invalida'
                            ? 'rgba(239, 68, 68, 0.3)'
                            : 'rgba(245, 158, 11, 0.3)'
                        }`,
                      }}
                    >
                      <span>
                        {teste.resultado === 'ok' && `✓ Conexão OK (Nível ${teste.nivel})`}
                        {teste.resultado === 'chave_invalida' && `✕ Chave Inválida (Nível ${teste.nivel})`}
                        {teste.resultado === 'sem_permissao' && `✕ Sem Permissão (403)`}
                        {teste.resultado === 'limite' && `⚠ Limite (429)`}
                        {teste.resultado === 'sem_alcance' && `⚠ Sem Alcance`}
                        {teste.resultado === 'erro' && `✕ Falha`}
                      </span>
                      <span style={{ fontSize: '10px', opacity: 0.8 }} title={teste.detalhe}>
                        {teste.detalhe}
                      </span>
                    </div>
                  )}

                  {/* Sinais identificados */}
                  <div className="sinais-container">
                    <span className="sinais-label">Sinais ({s.sinais.length}):</span>
                    <ul className="sinais-list">
                      {s.sinais.map((sinal, sIdx) => (
                        <li key={sIdx} className="sinal-item">
                          <span className={`sinal-tipo tipo-${sinal.tipo}`}>{sinal.tipo}</span>
                          <span className="sinal-valor" title={`Em: ${sinal.arquivo}`}>{sinal.valor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista de Tecnologias Genéricas / Não Catalogadas */}
      <div className="sidebar-section">
        <div className="section-title-row">
          <h3 className="section-title">Tecnologias Genéricas</h3>
          <span className="section-count">{ficha.naoIdentificados.length}</span>
        </div>

        {ficha.naoIdentificados.length === 0 ? (
          <p className="empty-hint">Nenhuma tecnologia genérica registrada.</p>
        ) : (
          <div className="tech-tags-grid">
            {ficha.naoIdentificados.map((item, idx) => (
              <span key={idx} className="tech-tag" title={item.motivo}>
                {item.sinal}
              </span>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

