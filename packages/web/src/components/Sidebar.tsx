import React, { useState } from 'react';
import type { Ficha, ServicoFicha, ItemTesteResultado, EntradaCatalogoInfo } from '../types.js';
import { obterIconeServico } from '../utils/icons.js';
import { verificarServicoObsoleto } from './MapLayer1.js';

interface SidebarProps {
  ficha: Ficha | null;
  servicoFocado?: ServicoFicha | null;
  aoLimparFoco?: () => void;
  catalogo?: EntradaCatalogoInfo[];
  testesEstado?: Record<string, ItemTesteResultado>;
  aoTestar?: (chaveAnthropic?: string) => Promise<void> | void;
  testando?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  ficha,
  servicoFocado,
  aoLimparFoco,
  catalogo = [],
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

  // ==========================================
  // CAMADA 2: Detalhes do Serviço Focado
  // ==========================================
  if (servicoFocado) {
    const icone = obterIconeServico(servicoFocado.id || servicoFocado.nome);
    const ehCerto = servicoFocado.confianca === 'certo';
    const teste = servicoFocado.id ? testesEstado[servicoFocado.id] : undefined;

    // Obtém entrada correspondente no catálogo
    const entradaCat = catalogo.find(
      (c) =>
        c.id.toLowerCase() === (servicoFocado.id || '').toLowerCase() ||
        c.nome.toLowerCase() === servicoFocado.nome.toLowerCase()
    );

    // Valida se o serviço é obsoleto
    const statusObs = verificarServicoObsoleto(servicoFocado, ficha.alertas, catalogo);

    // Filtra variáveis deste serviço
    const sId = (servicoFocado.id || '').toLowerCase();
    const variaveisDoServico = (ficha.variaveis || []).filter((v) => {
      if (v.idServico && v.idServico.toLowerCase() === sId) return true;
      if (sId === 'supabase' && v.nome.toUpperCase().includes('SUPABASE')) return true;
      if (sId === 'turso' && v.nome.toUpperCase().includes('TURSO')) return true;
      if (sId === 'anthropic' && v.nome.toUpperCase().includes('ANTHROPIC')) return true;
      if (sId === 'openai' && v.nome.toUpperCase().includes('OPENAI')) return true;
      if (sId === 'resend' && v.nome.toUpperCase().includes('RESEND')) return true;
      return false;
    });

    const linkCadastro = entradaCat?.cadastro || entradaCat?.site || 'https://github.com';
    const linkSite = entradaCat?.site;

    return (
      <aside className="sidebar" aria-label="Painel de detalhes do serviço focado">
        <button
          className="btn-voltar"
          onClick={aoLimparFoco}
          title="Retornar à visão geral de todos os serviços"
        >
          ← Voltar à visão geral
        </button>

        {/* Cabeçalho do Serviço */}
        <div className="sidebar-section foco-header-card">
          <div className="foco-titulo-row">
            <div className="foco-icone-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill={icone.hex || '#3b82f6'}>
                <path d={icone.path} />
              </svg>
            </div>
            <div>
              <h2 className="foco-nome">{servicoFocado.nome}</h2>
              <span className="foco-sub">
                {servicoFocado.categoria.toUpperCase()} &bull; {servicoFocado.subcategoria}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className={`badge-confianca ${ehCerto ? 'certo' : 'provavel'}`}>
              {ehCerto ? '✓ CONFIANÇA CERTA (2+ SINAIS)' : '? CONFIANÇA PROVÁVEL (1 SINAL)'}
            </span>
            {servicoFocado.catalogado && (
              <span className="badge-visibilidade" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>
                CATALOGADO V1
              </span>
            )}
          </div>
        </div>

        {/* Alerta de Obsolescência (se aplicável) */}
        {statusObs.obsoleto && (
          <div className="sidebar-section">
            <div className="alerta-obsoleto-card">
              <div className="alerta-obsoleto-titulo">
                <span>⚠️ Alerta de Obsolescência</span>
              </div>
              <p className="alerta-obsoleto-msg">
                {statusObs.mensagem || 'Este serviço utiliza pacotes descontinuados ou em processo de desativação.'}
              </p>
              {statusObs.dataDescontinuacao && (
                <span className="alerta-descontinuacao">
                  Data de descontinuação: <strong>{statusObs.dataDescontinuacao}</strong>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Link Oficial de Cadastro e Site */}
        <div className="sidebar-section">
          <div className="section-title-row">
            <h3 className="section-title">Acesso &amp; Cadastro</h3>
          </div>
          <div className="cadastro-action-card">
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#f3f4f6' }}>Criar conta ou acessar dashboard:</p>
              {linkSite && (
                <a href={linkSite} target="_blank" rel="noopener noreferrer" className="site-sec-link">
                  Site oficial ({servicoFocado.nome}) ↗
                </a>
              )}
            </div>
            <a
              href={linkCadastro}
              target="_blank"
              rel="noopener noreferrer"
              className="cadastro-btn"
            >
              Criar Conta ↗
            </a>
          </div>
        </div>

        {/* Variáveis de Ambiente do Serviço */}
        <div className="sidebar-section">
          <div className="section-title-row">
            <h3 className="section-title">Variáveis de Ambiente</h3>
            <span className="section-count">{variaveisDoServico.length}</span>
          </div>

          {variaveisDoServico.length === 0 ? (
            <p className="empty-hint">
              Nenhuma variável de ambiente necessária ou declarada para este serviço no repositório.
            </p>
          ) : (
            <div className="variaveis-lista">
              {variaveisDoServico.map((v, i) => {
                const ehObrigatoria = v.obrigatoria === true;
                const ehOpcional = v.obrigatoria === false;
                const flagClass = ehObrigatoria ? 'obrigatoria' : ehOpcional ? 'opcional' : 'nao-definida';
                const flagTexto = ehObrigatoria ? 'Obrigatória' : ehOpcional ? 'Opcional' : 'Declarada';

                return (
                  <div key={i} className="variavel-item-card">
                    <div className="variavel-nome-row">
                      <span className="variavel-nome">{v.nome}</span>
                      <span className={`badge-flag ${flagClass}`}>{flagTexto}</span>
                    </div>
                    {v.descricao && (
                      <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{v.descricao}</p>
                    )}
                    <span className="variavel-origem">Origem: {v.arquivo}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sinais Detectados */}
        <div className="sidebar-section">
          <div className="section-title-row">
            <h3 className="section-title">Sinais Identificados</h3>
            <span className="section-count">{servicoFocado.sinais.length}</span>
          </div>
          <div className="sinais-container">
            {servicoFocado.sinais.map((sinal, sIdx) => (
              <div key={sIdx} className="sinal-item">
                <span className={`sinal-tipo tipo-${sinal.tipo}`}>{sinal.tipo}</span>
                <span className="sinal-valor" title={`${sinal.valor} (${sinal.arquivo})`}>
                  {sinal.valor}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Teste de Conexão */}
        {teste && (
          <div className="sidebar-section">
            <div className="section-title-row">
              <h3 className="section-title">Último Teste de Conexão</h3>
            </div>
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nível {teste.nivel}</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor:
                      teste.resultado === 'ok'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)',
                    color: teste.resultado === 'ok' ? '#10b981' : '#f87171',
                  }}
                >
                  {teste.resultado.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-main)' }}>{teste.detalhe}</p>
              <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                {new Date(teste.data).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        )}
      </aside>
    );
  }

  // ==========================================
  // VISÃO GERAL DO PROJETO (Sem foco ativo)
  // ==========================================
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
            <span className="meta-date">{dataFormatada}</span>
          </div>
        </div>
      </div>

      {/* Seção de Testes de Conexão */}
      <div className="sidebar-section">
        <div className="section-title-row">
          <h3 className="section-title">Testes de Conexão</h3>
          <span className="section-count">Níveis 1 a 3</span>
        </div>
        <div
          style={{
            backgroundColor: 'rgba(0,0,0,0.25)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Valida existência de variáveis, alcance DNS e autenticação direta via <code>127.0.0.1</code>.
          </p>

          {temAnthropic && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                Chave da Anthropic (Nível 3):
              </label>
              <input
                type="password"
                placeholder="sk-ant-... (somente em memória)"
                value={chaveAnthropic}
                onChange={(e) => setChaveAnthropic(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                }}
              />
            </div>
          )}

          <button
            onClick={() => aoTestar && aoTestar(chaveAnthropic)}
            disabled={testando}
            style={{
              backgroundColor: testando ? '#4b5563' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 14px',
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
              const statusObs = verificarServicoObsoleto(s, ficha.alertas, catalogo);

              return (
                <div
                  key={idx}
                  className={`servico-card ${ehCerto ? 'confianca-certo' : 'confianca-provavel'}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => aoLimparFoco && (s.id || s.nome) ? (window as any).__selecionarServico?.(s) : null}
                  title="Clique para ver os detalhes completos deste serviço"
                >
                  <div className="servico-header">
                    <div className="servico-identificacao">
                      <strong className="servico-nome">{s.nome}</strong>
                      <span className="servico-cat">{s.categoria} / {s.subcategoria}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {statusObs.obsoleto && (
                        <span style={{ fontSize: '10px', background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          ⚠ OBSOLETO
                        </span>
                      )}
                      <span className={`badge-confianca ${ehCerto ? 'certo' : 'provavel'}`}>
                        {ehCerto ? '✓ CERTO' : '? PROVÁVEL'}
                      </span>
                    </div>
                  </div>

                  {/* Status do Teste de Conexão */}
                  {teste && (
                    <div
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>Nível {teste.nivel}:</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color:
                            teste.resultado === 'ok'
                              ? '#10b981'
                              : teste.resultado === 'chave_invalida'
                              ? '#f87171'
                              : '#f59e0b',
                        }}
                      >
                        {teste.resultado.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Lista de Sinais Resumida */}
                  <div className="sinais-container">
                    <span className="sinais-label">Sinais identificados:</span>
                    {s.sinais.map((sinal, sIdx) => (
                      <div key={sIdx} className="sinal-item">
                        <span className={`sinal-tipo tipo-${sinal.tipo}`}>{sinal.tipo}</span>
                        <span className="sinal-valor" title={`${sinal.valor} (${sinal.arquivo})`}>
                          {sinal.valor}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista de Tecnologias Genéricas */}
      {ficha.naoIdentificados && ficha.naoIdentificados.length > 0 && (
        <div className="sidebar-section">
          <div className="section-title-row">
            <h3 className="section-title">Tecnologias Gerais Detectadas</h3>
            <span className="section-count">{ficha.naoIdentificados.length}</span>
          </div>
          <div className="tech-tags-grid">
            {ficha.naoIdentificados.map((item, idx) => (
              <span key={idx} className="tech-tag" title={item.motivo}>
                {item.sinal}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
