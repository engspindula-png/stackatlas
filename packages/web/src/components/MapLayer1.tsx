import React, { useState } from 'react';
import type { Ficha, ServicoFicha } from '../types.js';
import { obterIconeServico } from '../utils/icons.js';

interface MapLayer1Props {
  ficha: Ficha;
}

export const MapLayer1: React.FC<MapLayer1Props> = ({ ficha }) => {
  const [servicoAtivo, setServicoAtivo] = useState<string | null>(null);

  const cx = 450;
  const cy = 300;
  const raio = 230;

  const servicos = ficha.servicos || [];
  const totalServicos = servicos.length;

  const repoNome = ficha.repo.url.replace(/https?:\/\/github\.com\//, '').replace(/\.git$/, '');

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
          strokeDasharray="4,8"
        />

        {/* Conexões (Setas) do Centro para os Serviços */}
        {servicos.map((s: ServicoFicha, index: number) => {
          const angulo = (2 * Math.PI * index) / (totalServicos || 1) - Math.PI / 2;
          const x = cx + raio * Math.cos(angulo);
          const y = cy + raio * Math.sin(angulo);

          const ehCerto = s.confianca === 'certo';
          const strokeColor = ehCerto ? '#10b981' : '#f59e0b';
          const markerId = ehCerto ? 'url(#arrow-certo)' : 'url(#arrow-provavel)';

          // Encurta ligeiramente a linha para não invadir o nó
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const raioInicio = 70;
          const raioFim = 50;

          const startX = cx + (dx / dist) * raioInicio;
          const startY = cy + (dy / dist) * raioInicio;
          const endX = x - (dx / dist) * raioFim;
          const endY = y - (dy / dist) * raioFim;

          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;

          const rotulo = s.subcategoria || s.categoria;

          return (
            <g key={`conn-${index}`} className="connection-group">
              {/* Linha da Seta: Tracejada se PROVÁVEL, Sólida se CERTO */}
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke={strokeColor}
                strokeWidth={ehCerto ? 2 : 2}
                strokeDasharray={ehCerto ? 'none' : '6,6'}
                markerEnd={markerId}
                opacity={servicoAtivo && servicoAtivo !== s.nome ? 0.3 : 0.85}
                className="connection-line"
              />

              {/* Rótulo curto sobre a conexão */}
              <g transform={`translate(${midX}, ${midY})`}>
                <rect
                  x="-35"
                  y="-10"
                  width="70"
                  height="20"
                  rx="10"
                  fill="#111827"
                  stroke={strokeColor}
                  strokeWidth="1"
                  opacity={servicoAtivo && servicoAtivo !== s.nome ? 0.3 : 1}
                />
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  fill="#e5e7eb"
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
            y="-22"
            textAnchor="middle"
            fill="#60a5fa"
            fontSize="10"
            fontWeight="700"
            letterSpacing="1"
            fontFamily="'Plus Jakarta Sans', sans-serif"
          >
            PROJETO LOCAL
          </text>
          <text
            x="0"
            y="-2"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="12"
            fontWeight="700"
            fontFamily="'Plus Jakarta Sans', sans-serif"
          >
            {repoNome.length > 20 ? repoNome.slice(0, 18) + '...' : repoNome}
          </text>
          <text
            x="0"
            y="18"
            textAnchor="middle"
            fill="#9ca3af"
            fontSize="10"
            fontFamily="'JetBrains Mono', monospace"
          >
            {ficha.repo.commit.slice(0, 7)}
          </text>
          <rect
            x="-35"
            y="26"
            width="70"
            height="16"
            rx="8"
            fill="rgba(59, 130, 246, 0.2)"
            stroke="#3b82f6"
            strokeWidth="0.8"
          />
          <text
            x="0"
            y="37.5"
            textAnchor="middle"
            fill="#93c5fd"
            fontSize="9"
            fontWeight="700"
          >
            CENTRO
          </text>
        </g>

        {/* Nós dos Serviços Externos (com Simple Icons oficiais) */}
        {servicos.map((s: ServicoFicha, index: number) => {
          const angulo = (2 * Math.PI * index) / (totalServicos || 1) - Math.PI / 2;
          const x = cx + raio * Math.cos(angulo);
          const y = cy + raio * Math.sin(angulo);

          const icone = obterIconeServico(s.id || s.nome);
          const ehCerto = s.confianca === 'certo';
          const corBorda = ehCerto ? '#10b981' : '#f59e0b';
          const isSelected = servicoAtivo === s.nome;

          return (
            <g
              key={`serv-${index}`}
              className="service-node-group"
              transform={`translate(${x}, ${y})`}
              onClick={() => setServicoAtivo(isSelected ? null : s.nome)}
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
                stroke={isSelected ? '#ffffff' : corBorda}
                strokeWidth={isSelected ? 3 : 2}
                className="service-card-rect"
              />

              {/* Ícone oficial do Simple Icons */}
              <g transform="translate(-50, -22)">
                <rect
                  x="-4"
                  y="-4"
                  width="30"
                  height="30"
                  rx="6"
                  fill="#111827"
                  stroke="#374151"
                  strokeWidth="1"
                />
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill={icone.hex}
                >
                  <path d={icone.path} />
                </svg>
              </g>

              {/* Nome e Informações do Serviço */}
              <text
                x="-16"
                y="-6"
                fill="#ffffff"
                fontSize="13"
                fontWeight="700"
                fontFamily="'Plus Jakarta Sans', sans-serif"
              >
                {s.nome}
              </text>

              <text
                x="-16"
                y="10"
                fill="#9ca3af"
                fontSize="10"
                fontFamily="'Plus Jakarta Sans', sans-serif"
              >
                {s.subcategoria || s.categoria}
              </text>

              {/* Badge de Confiança */}
              <g transform="translate(0, 22)">
                <rect
                  x="-55"
                  y="-6"
                  width="110"
                  height="14"
                  rx="4"
                  fill={ehCerto ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'}
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill={ehCerto ? '#10b981' : '#f59e0b'}
                  fontSize="8.5"
                  fontWeight="700"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {ehCerto ? '✓ CONFIANÇA CERTA' : '? PROVÁVEL (1 SINAL)'}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Legenda do Mapa */}
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-line solid"></span>
          <span>Certo (2+ sinais independentes)</span>
        </div>
        <div className="legend-item">
          <span className="legend-line dashed"></span>
          <span>Provável (1 sinal / genérico)</span>
        </div>
      </div>
    </div>
  );
};
