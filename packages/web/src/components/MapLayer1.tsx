import React, { useState } from 'react';
import type { Ficha, ServicoFicha, AlertaFicha, EntradaCatalogoInfo, ConexaoDetalheInfo } from '../types.js';
import { obterIconeServico } from '../utils/icons.js';

interface MapLayer1Props {
  ficha: Ficha;
  catalogo?: EntradaCatalogoInfo[];
  servicoSelecionado?: ServicoFicha | null;
  aoSelecionarServico?: (servico: ServicoFicha | null) => void;
  aoClicarModulosInternos?: (servicosAgrupados: ServicoFicha[]) => void;
  aoClicarConexao?: (detalhe: ConexaoDetalheInfo) => void;
}

/**
 * Verifica se um serviço possui dependências obsoletas catalogadas ou alertas de obsolescência.
 */
export function verificarServicoObsoleto(
  servico: ServicoFicha,
  alertas: AlertaFicha[] = [],
  catalogo: EntradaCatalogoInfo[] = []
): { obsoleto: boolean; mensagem?: string; dataDescontinuacao?: string } {
  const sId = (servico.id || '').toLowerCase();
  const sNome = servico.nome.toLowerCase();

  // 1. Alertas gravados na ficha
  const alerta = alertas.find(
    (a) => a.tipo === 'obsoleto' && (a.servico.toLowerCase() === sId || a.servico.toLowerCase() === sNome)
  );
  if (alerta) {
    return { obsoleto: true, mensagem: alerta.mensagem };
  }

  // 2. Sinais de dependência marcados com (obsoleto)
  const sinalObsoleto = servico.sinais.find(
    (s) => s.tipo === 'dependencia' && s.valor.toLowerCase().includes('obsoleto')
  );
  if (sinalObsoleto) {
    return { obsoleto: true, mensagem: `Usa pacote descontinuado: ${sinalObsoleto.valor}` };
  }

  // 3. Cruzamento direto com dependenciasObsoletas do catálogo
  const entradaCat = catalogo.find(
    (c) => c.id.toLowerCase() === sId || c.nome.toLowerCase() === sNome
  );
  if (entradaCat?.sinais?.dependenciasObsoletas) {
    for (const itemObs of entradaCat.sinais.dependenciasObsoletas) {
      const nomeObs = typeof itemObs === 'string' ? itemObs : itemObs.nome;
      const dataObs = typeof itemObs === 'object' ? itemObs.data : undefined;
      const motivoObs = typeof itemObs === 'object' ? itemObs.motivo : undefined;

      const sinal = servico.sinais.find((s) => {
        if (s.tipo !== 'dependencia') return false;
        const dep = s.valor.split('@')[0].trim();
        return dep === nomeObs || (nomeObs.endsWith('*') && dep.startsWith(nomeObs.slice(0, -1)));
      });

      if (sinal) {
        return {
          obsoleto: true,
          mensagem: `Pacote obsoleto '${nomeObs}'${dataObs ? ` (descontinuado em ${dataObs})` : ''}${motivoObs ? `: ${motivoObs}` : ''}`,
          dataDescontinuacao: dataObs,
        };
      }
    }
  }

  return { obsoleto: false };
}

export const MapLayer1: React.FC<MapLayer1Props> = ({
  ficha,
  catalogo = [],
  servicoSelecionado,
  aoSelecionarServico,
  aoClicarModulosInternos,
  aoClicarConexao,
}) => {
  const [servicoHover, setServicoHover] = useState<string | null>(null);

  const cx = 450;
  const cy = 300;
  const raio = 230;

  // Limite da Camada 1 (Seção 9 e Seção 13): No máximo 6 a 8 nós visíveis
  const LIMITE_MAX_NOS = 7;
  const servicos = ficha.servicos || [];
  const alertas = ficha.alertas || [];

  // Mapeia serviços avaliando a presença de pacotes obsoletos
  const servicosComStatus = servicos.map((s) => {
    const statusObs = verificarServicoObsoleto(s, alertas, catalogo);
    return {
      servico: s,
      obsoleto: statusObs.obsoleto,
      mensagemObs: statusObs.mensagem,
      dataDescontinuacao: statusObs.dataDescontinuacao,
    };
  });

  // Aplicação da REGRA DE OURO da interface:
  // "o alerta nunca pode ser escondido pelo agrupamento (se um módulo interno estiver obsoleto, o alerta deve ser puxado para fora ou o nó mantido visível)"
  let servicosVisiveis: typeof servicosComStatus = [];
  let servicosAgrupados: typeof servicosComStatus = [];

  const precisaAgrupar = servicosComStatus.length > LIMITE_MAX_NOS || (ficha.modulosInternos > 0 && servicosComStatus.length >= LIMITE_MAX_NOS);

  if (!precisaAgrupar) {
    servicosVisiveis = servicosComStatus;
    servicosAgrupados = [];
  } else {
    // 1. Serviços com alerta de obsolescência são OBRIGATORIAMENTE visíveis
    const obsoletos = servicosComStatus.filter((s) => s.obsoleto);
    const naoObsoletos = servicosComStatus.filter((s) => !s.obsoleto);

    const certos = naoObsoletos.filter((s) => s.servico.confianca === 'certo');
    const provaveis = naoObsoletos.filter((s) => s.servico.confianca !== 'certo');

    // Reserva 1 nó para "Módulos Internos", sobrando vagas individuais
    const vagasIndividuais = Math.max(1, LIMITE_MAX_NOS - 1);
    const selecionados = [...obsoletos];

    for (const c of certos) {
      if (selecionados.length < vagasIndividuais) {
        selecionados.push(c);
      } else {
        servicosAgrupados.push(c);
      }
    }

    for (const p of provaveis) {
      if (selecionados.length < vagasIndividuais) {
        selecionados.push(p);
      } else {
        servicosAgrupados.push(p);
      }
    }

    servicosVisiveis = selecionados;
  }

  // Verifica se o nó de agrupamento deve ser renderizado
  const temNoAgrupado = servicosAgrupados.length > 0 || (ficha.modulosInternos && ficha.modulosInternos > 0);
  const totalNosNoAnel = servicosVisiveis.length + (temNoAgrupado ? 1 : 0);

  // Alerta interno: se houver alerta nos módulos internos ou alertas de tecnologia não catalogada
  const alertaModuloInterno = alertas.some((a) => a.tipo === 'obsoleto' && !servicosVisiveis.some((sv) => sv.servico.id === a.servico));

  const repoNome = ficha.repo.url.replace(/https?:\/\/github\.com\//, '').replace(/\.git$/, '');

  const idOuNomeAtivo = servicoSelecionado?.id || servicoSelecionado?.nome || servicoHover;

  return (
    <div className="map-layer-wrapper">
      <svg
        className="map-svg"
        viewBox="0 0 900 600"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Mapa de arquitetura da Camada 1"
      >
        <defs>
          {/* Marcador de Seta Sólida (Confiança CERTO) */}
          <marker
            id="arrow-certo"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
          </marker>

          {/* Marcador de Seta Tracejada (Confiança PROVÁVEL) */}
          <marker
            id="arrow-provavel"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
          </marker>

          {/* Marcador de Seta Vermelha (ALERTA DE OBSOLESCÊNCIA) */}
          <marker
            id="arrow-obsoleto"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
          </marker>

          {/* Marcador para Módulos Internos */}
          <marker
            id="arrow-modulo"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#8b5cf6" />
          </marker>

          {/* Gradiente do Nó Central (Projeto) */}
          <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.0" />
          </radialGradient>
        </defs>

        {/* Círculo Guia da Órbita */}
        <circle
          cx={cx}
          cy={cy}
          r={raio}
          fill="none"
          stroke="#1f2937"
          strokeWidth="1.5"
          strokeDasharray="4,4"
        />

        {/* 1. Conexões dos Serviços Visíveis */}
        {servicosVisiveis.map((item, index: number) => {
          const s = item.servico;
          const angulo = (2 * Math.PI * index) / (totalNosNoAnel || 1) - Math.PI / 2;
          const x = cx + raio * Math.cos(angulo);
          const y = cy + raio * Math.sin(angulo);

          const startDist = 65;
          const endDist = raio - 52;
          const startX = cx + startDist * Math.cos(angulo);
          const startY = cy + startDist * Math.sin(angulo);
          const endX = cx + endDist * Math.cos(angulo);
          const endY = cy + endDist * Math.sin(angulo);

          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;

          const ehCerto = s.confianca === 'certo';
          const ehObsoleto = item.obsoleto;

          // Regra de ouro: se obsoleto, seta vermelha obrigatória
          const strokeColor = ehObsoleto ? '#ef4444' : (ehCerto ? '#10b981' : '#f59e0b');
          const markerId = ehObsoleto
            ? 'url(#arrow-obsoleto)'
            : (ehCerto ? 'url(#arrow-certo)' : 'url(#arrow-provavel)');

          const rotulo = ehObsoleto ? 'OBSOLETO' : (s.categoria ? s.categoria.toUpperCase() : 'SERVIÇO');
          const isAtivo = idOuNomeAtivo === (s.id || s.nome);

          return (
            <g
              key={`conn-${index}`}
              className="connection-group"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                if (aoClicarConexao) {
                  aoClicarConexao({
                    de: 'Projeto Principal',
                    para: s.nome,
                    rotulo,
                    descricao: ehObsoleto
                      ? `Aviso: Conexão com ${s.nome} utiliza biblioteca obsoleta. Atualização necessária.`
                      : `Conecta ao serviço ${s.nome} (${s.subcategoria || s.categoria}) com nível de confiança ${s.confianca}.`,
                    confianca: s.confianca,
                    obsoleto: ehObsoleto,
                  });
                }
              }}
            >
              {/* Linha da Seta: Vermelha se OBSOLETO, Tracejada se PROVÁVEL, Sólida se CERTO */}
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke={strokeColor}
                strokeWidth={ehObsoleto ? 2.5 : 2}
                strokeDasharray={ehObsoleto ? 'none' : (ehCerto ? 'none' : '6,6')}
                markerEnd={markerId}
                opacity={idOuNomeAtivo && !isAtivo ? 0.25 : 0.9}
                className="connection-line"
              />

              {/* Rótulo curto clicável sobre a conexão */}
              <g transform={`translate(${midX}, ${midY})`}>
                <rect
                  x="-35"
                  y="-10"
                  width="70"
                  height="20"
                  rx="10"
                  fill="#111827"
                  stroke={strokeColor}
                  strokeWidth="1.2"
                  opacity={idOuNomeAtivo && !isAtivo ? 0.3 : 1}
                />
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  fill={ehObsoleto ? '#f87171' : '#e5e7eb'}
                  fontSize="10"
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight="600"
                >
                  {rotulo}
                </text>
              </g>
            </g>
          );
        })}

        {/* 2. Conexão do Nó "Módulos Internos" (se presente) */}
        {temNoAgrupado && (() => {
          const index = servicosVisiveis.length;
          const angulo = (2 * Math.PI * index) / (totalNosNoAnel || 1) - Math.PI / 2;
          const startDist = 65;
          const endDist = raio - 52;
          const startX = cx + startDist * Math.cos(angulo);
          const startY = cy + startDist * Math.sin(angulo);
          const endX = cx + endDist * Math.cos(angulo);
          const endY = cy + endDist * Math.sin(angulo);
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;

          const strokeColor = alertaModuloInterno ? '#ef4444' : '#8b5cf6';
          const markerId = alertaModuloInterno ? 'url(#arrow-obsoleto)' : 'url(#arrow-modulo)';

          return (
            <g
              key="conn-modulos-internos"
              className="connection-group"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                if (aoClicarModulosInternos) {
                  aoClicarModulosInternos(servicosAgrupados.map((s) => s.servico));
                }
              }}
            >
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke={strokeColor}
                strokeWidth="2"
                strokeDasharray="4,4"
                markerEnd={markerId}
                opacity={0.85}
                className="connection-line"
              />
              <g transform={`translate(${midX}, ${midY})`}>
                <rect
                  x="-35"
                  y="-10"
                  width="70"
                  height="20"
                  rx="10"
                  fill="#111827"
                  stroke={strokeColor}
                  strokeWidth="1.2"
                />
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  fill="#c4b5fd"
                  fontSize="10"
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight="600"
                >
                  INTERNO
                </text>
              </g>
            </g>
          );
        })()}

        {/* Nó Central: O Projeto Analisado */}
        <g className="project-node" transform={`translate(${cx}, ${cy})`}>
          <circle r="90" fill="url(#center-glow)" />
          <circle
            r="60"
            fill="#111827"
            stroke="#3b82f6"
            strokeWidth="2.5"
            className="project-circle"
          />
          <text
            x="0"
            y="-10"
            textAnchor="middle"
            fill="#f9fafb"
            fontSize="14"
            fontWeight="700"
          >
            {repoNome.length > 14 ? `${repoNome.slice(0, 12)}…` : repoNome}
          </text>
          <text
            x="0"
            y="8"
            textAnchor="middle"
            fill="#60a5fa"
            fontSize="10"
            fontWeight="500"
          >
            StackAtlas
          </text>
          <text
            x="0"
            y="22"
            textAnchor="middle"
            fill="#9ca3af"
            fontSize="10"
            fontFamily="'JetBrains Mono', monospace"
          >
            {ficha.repo.commit.slice(0, 7)}
          </text>
        </g>

        {/* Nós dos Serviços Visíveis */}
        {servicosVisiveis.map((item, index: number) => {
          const s = item.servico;
          const angulo = (2 * Math.PI * index) / (totalNosNoAnel || 1) - Math.PI / 2;
          const x = cx + raio * Math.cos(angulo);
          const y = cy + raio * Math.sin(angulo);

          const icone = obterIconeServico(s.id || s.nome);
          const ehCerto = s.confianca === 'certo';
          const ehObsoleto = item.obsoleto;
          const corBorda = ehObsoleto ? '#ef4444' : (ehCerto ? '#10b981' : '#f59e0b');
          const isSelected = (servicoSelecionado?.id || servicoSelecionado?.nome) === (s.id || s.nome);

          return (
            <g
              key={`serv-${index}`}
              className="service-node-group"
              transform={`translate(${x}, ${y})`}
              onClick={() => {
                if (aoSelecionarServico) {
                  aoSelecionarServico(isSelected ? null : s);
                }
              }}
              onMouseEnter={() => setServicoHover(s.id || s.nome)}
              onMouseLeave={() => setServicoHover(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Fundo do Card do Nó */}
              <rect
                x="-65"
                y="-35"
                width="130"
                height="70"
                rx="10"
                fill="#1f2937"
                stroke={corBorda}
                strokeWidth={isSelected ? '2.5' : (ehObsoleto ? '2' : '1.5')}
                className="service-card-rect"
                opacity={idOuNomeAtivo && !isSelected && servicoHover !== (s.id || s.nome) ? 0.5 : 1}
              />

              {/* Tag Superior de Alerta Obsoleto (se aplicável) */}
              {ehObsoleto && (
                <g transform="translate(0, -35)">
                  <rect
                    x="-40"
                    y="-8"
                    width="80"
                    height="16"
                    rx="8"
                    fill="#ef4444"
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="700"
                  >
                    ⚠ OBSOLETO
                  </text>
                </g>
              )}

              {/* Tag Superior de Confiança (se não for obsoleto) */}
              {!ehObsoleto && (
                <g transform="translate(0, -35)">
                  <rect
                    x="-32"
                    y="-8"
                    width="64"
                    height="16"
                    rx="8"
                    fill={ehCerto ? '#064e3b' : '#78350f'}
                    stroke={ehCerto ? '#10b981' : '#f59e0b'}
                    strokeWidth="0.8"
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    fill={ehCerto ? '#6ee7b7' : '#fde68a'}
                    fontSize="8.5"
                    fontWeight="700"
                  >
                    {ehCerto ? 'CERTO' : 'PROVÁVEL'}
                  </text>
                </g>
              )}

              {/* Ícone da Ferramenta */}
              <g transform="translate(-46, -12)">
                <circle cx="15" cy="15" r="16" fill="#111827" stroke="#374151" strokeWidth="1" />
                <svg
                  x="5"
                  y="5"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={icone.hex || '#3b82f6'}
                >
                  <path d={icone.path} />
                </svg>
              </g>

              {/* Nome e Categoria do Serviço */}
              <text
                x="-10"
                y="5"
                fill="#f9fafb"
                fontSize="12.5"
                fontWeight="600"
              >
                {s.nome.length > 11 ? `${s.nome.slice(0, 10)}…` : s.nome}
              </text>
              <text
                x="-10"
                y="19"
                fill="#9ca3af"
                fontSize="9.5"
              >
                {s.subcategoria || s.categoria}
              </text>
            </g>
          );
        })}

        {/* Nó Especial: "Módulos Internos" (Agrupamento dos excedentes) */}
        {temNoAgrupado && (() => {
          const index = servicosVisiveis.length;
          const angulo = (2 * Math.PI * index) / (totalNosNoAnel || 1) - Math.PI / 2;
          const x = cx + raio * Math.cos(angulo);
          const y = cy + raio * Math.sin(angulo);
          const iconeModulo = obterIconeServico('modulosinternos');
          const totalAgrupados = servicosAgrupados.length;
          const totalPacotes = ficha.modulosInternos || ficha.naoIdentificados?.length || 0;

          return (
            <g
              key="node-modulos-internos"
              className="service-node-group internal-modules-node"
              transform={`translate(${x}, ${y})`}
              onClick={() => {
                if (aoClicarModulosInternos) {
                  aoClicarModulosInternos(servicosAgrupados.map((s) => s.servico));
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x="-65"
                y="-35"
                width="130"
                height="70"
                rx="10"
                fill="#1f2937"
                stroke={alertaModuloInterno ? '#ef4444' : '#8b5cf6'}
                strokeWidth="2"
                strokeDasharray="3,3"
                className="service-card-rect"
              />

              <g transform="translate(0, -35)">
                <rect
                  x="-38"
                  y="-8"
                  width="76"
                  height="16"
                  rx="8"
                  fill="#4c1d95"
                  stroke="#8b5cf6"
                  strokeWidth="0.8"
                />
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  fill="#ddd6fe"
                  fontSize="8.5"
                  fontWeight="700"
                >
                  +{totalAgrupados} SERVIÇOS
                </text>
              </g>

              {/* Ícone de Módulos */}
              <g transform="translate(-46, -12)">
                <circle cx="15" cy="15" r="16" fill="#111827" stroke="#4c1d95" strokeWidth="1" />
                <svg
                  x="5"
                  y="5"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="#a78bfa"
                >
                  <path d={iconeModulo.path} />
                </svg>
              </g>

              <text
                x="-10"
                y="5"
                fill="#f9fafb"
                fontSize="11.5"
                fontWeight="700"
              >
                Módulos Internos
              </text>
              <text
                x="-10"
                y="19"
                fill="#c4b5fd"
                fontSize="9"
              >
                {totalPacotes > 0 ? `${totalPacotes} pacotes locais` : 'Clique p/ ver'}
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Legenda do Mapa */}
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-line solid" />
          <span>Confiança Certa (2+ sinais)</span>
        </div>
        <div className="legend-item">
          <span className="legend-line dashed" />
          <span>Confiança Provável (1 sinal)</span>
        </div>
        <div className="legend-item">
          <span className="legend-line" style={{ backgroundColor: '#ef4444' }} />
          <span>Alerta: Pacote Obsoleto</span>
        </div>
        {temNoAgrupado && (
          <div className="legend-item">
            <span className="legend-line" style={{ backgroundColor: '#8b5cf6', borderBottom: '1px dashed' }} />
            <span>Módulos Internos (Agrupados)</span>
          </div>
        )}
      </div>
    </div>
  );
};
