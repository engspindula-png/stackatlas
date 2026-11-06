import React from 'react';
import type { Ficha, ServicoFicha } from '../types.js';

interface SidebarProps {
  ficha: Ficha | null;
  fechado?: boolean;
  aoAlternar?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ ficha }) => {
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
