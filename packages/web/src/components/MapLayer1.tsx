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
 * Retorna uma descrição em uma frase curta sem código (SPEC.md Seção 9, Camada 4).
 */
export function obterDescricaoConexao(servico: ServicoFicha): string {
  const sId = (servico.id || '').toLowerCase();
  const cat = (servico.categoria || '').toLowerCase();
  const sub = (servico.subcategoria || '').toLowerCase();

  const DESCRICOES: Record<string, string> = {
    supabase: 'Conecta ao banco de dados relacional e backend como serviço em nuvem.',
    turso: 'Conecta ao banco de dados SQLite distribuído na borda via LibSQL.',
    anthropic: 'Conecta à API de modelos de inteligência artificial Claude.',
    openai: 'Conecta aos modelos de linguagem GPT e embeddings em nuvem.',
    gemini: 'Conecta aos modelos multimodais de inteligência artificial do Google.',
    openrouter: 'Conecta ao roteador unificado de modelos de IA com tarifação flexível.',
    'vercel-ai-sdk': 'Integra o framework unificado para streaming e modelos de IA da Vercel.',
    huggingface: 'Conecta ao hub de modelos abertos e inferência da Hugging Face.',
    together: 'Conecta à nuvem de inferência rápida para modelos abertos.',
    resend: 'Envia e-mails transacionais modernos a partir da aplicação web.',
    sendgrid: 'Conecta à plataforma de entrega e envio massivo de e-mails.',
    postmark: 'Envia e-mails transacionais rápidos com alta taxa de entrega.',
    mailgun: 'Conecta à API de envio, recebimento e rastreamento de e-mails.',
    'amazon-ses': 'Envia e-mails transacionais e marketing pela infraestrutura da AWS.',
    'smtp-generico': 'Envia mensagens através de servidor de e-mail SMTP padrão.',
    neon: 'Conecta ao banco de dados PostgreSQL serverless com escalonamento automático.',
    'cloudflare-d1': 'Conecta ao banco de dados SQL serverless integrado no Cloudflare Workers.',
    mongodb: 'Conecta ao banco de dados NoSQL de documentos em nuvem.',
    upstash: 'Conecta à camada de cache Redis e filas serverless de baixa latência.',
    convex: 'Conecta ao backend reativo em tempo real para sincronização de dados.',
    firebase: 'Conecta ao backend gerenciado pelo Google com autenticação e banco em nuvem.',
    appwrite: 'Conecta ao backend de código aberto com autenticação e banco.',
    pocketbase: 'Conecta ao backend integrado em arquivo único com SQLite em tempo real.',
  };

  if (DESCRICOES[sId]) {
    return DESCRICOES[sId];
  }

  if (cat.includes('banco') || sub.includes('sql') || sub.includes('nosql')) {
    return `Conecta ao banco de dados em nuvem (${servico.nome}).`;
  }
  if (cat.includes('ia') || sub.includes('llm')) {
    return `Conecta aos serviços de inteligência artificial da ${servico.nome}.`;
  }
  if (cat.includes('email')) {
    return `Envia mensagens através do serviço de e-mail ${servico.nome}.`;
  }
  if (cat.includes('backend') || sub.includes('baas')) {
    return `Conecta aos serviços de infraestrutura de backend da ${servico.nome}.`;
  }

  return `Conecta a aplicação ao serviço externo ${servico.nome}.`;
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
  const [conexaoAtiva, setConexaoAtiva] = useState<ConexaoDetalheInfo | null>(null);
  const [modalModulosAberto, setModalModulosAberto] = useState<boolean>(false);

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
  const temNoAgrupado = servicosAgrupados.length > 0 || (ficha.modulosInternos && ficha.modulosInternos > 0) || (ficha.naoIdentificados && ficha.naoIdentificados.length > 0);
  const totalNosNoAnel = servicosVisiveis.length + (temNoAgrupado ? 1 : 0);

  // Alerta interno: se houver alerta nos módulos internos ou alertas de tecnologia não catalogada
  const alertaModuloInterno = alertas.some((a) => a.tipo === 'obsoleto' && !servicosVisiveis.some((sv) => sv.servico.id === a.servico));

  const repoNome = ficha.repo.url.replace(/https?:\/\/github\.com\//, '').replace(/\.git$/, '');
  const idOuNomeAtivo = servicoSelecionado?.id || servicoSelecionado?.nome || servicoHover;

  // Handler para cliques nas conexões (Camada 4)
  const tratarCliqueConexao = (detalhe: ConexaoDetalheInfo) => {
    setConexaoAtiva(detalhe);
    if (aoClicarConexao) {
      aoClicarConexao(detalhe);
    }
  };

  // Handler para abrir Camada 3 (Módulos Internos)
  const tratarCliqueModulos = () => {
    setModalModulosAberto(true);
    if (aoClicarModulosInternos) {
      aoClicarModulosInternos(servicosAgrupados.map((s) => s.servico));
    }
  };

  // Agrupamento para Monorepo na Camada 3:
  // Separa pacotes/serviços por pasta de origem (ex: packages/core, packages/web, apps/...)
  const subgruposMonorepo: Record<string, { servicos: ServicoFicha[]; tecnologias: string[] }> = {};

  const extrairSubgrupo = (arquivo: string): string => {
    const limpo = arquivo.replace(/\\/g, '/');
    const partes = limpo.split('/');
    if (partes.length > 1 && (partes[0] === 'packages' || partes[0] === 'apps' || partes[0] === 'modules')) {
      return `${partes[0]}/${partes[1]}`;
    }
    return 'Raiz do Repositório';
  };

  // Adiciona serviços agrupados
  for (const item of servicosAgrupados) {
    const s = item.servico;
    const arq = s.sinais[0]?.arquivo || 'package.json';
    const subgrupo = extrairSubgrupo(arq);
    if (!subgruposMonorepo[subgrupo]) {
      subgruposMonorepo[subgrupo] = { servicos: [], tecnologias: [] };
    }
    subgruposMonorepo[subgrupo].servicos.push(s);
  }

  // Adiciona tecnologias detectadas não catalogadas
  for (const nc of ficha.naoIdentificados || []) {
    const subgrupo = extrairSubgrupo(nc.arquivo || 'package.json');
    if (!subgruposMonorepo[subgrupo]) {
      subgruposMonorepo[subgrupo] = { servicos: [], tecnologias: [] };
    }
    if (!subgruposMonorepo[subgrupo].tecnologias.includes(nc.sinal)) {
      subgruposMonorepo[subgrupo].tecnologias.push(nc.sinal);
    }
  }

  // Se nada foi agrupado ainda mas há módulos internos declarados
  if (Object.keys(subgruposMonorepo).length === 0) {
    subgruposMonorepo['Módulos Internos'] = {
      servicos: [],
      tecnologias: ['Módulos locais detectados pelo analisador de dependências'],
    };
  }

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

        {/* 1. Conexões dos Serviços Visíveis (Camada 4: Clicáveis) */}
        {servicosVisiveis.map((item, index: number) => {
          const s = item.servico;
          const angulo = (2 * Math.PI * index) / (totalNosNoAnel || 1) - Math.PI / 2;
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

          const detalheConexao: ConexaoDetalheInfo = {
            de: 'Projeto Principal',
            para: s.nome,
            rotulo,
            descricao: ehObsoleto
              ? `Atenção: A biblioteca utilizada para conexão com ${s.nome} está obsoleta/descontinuada.`
              : obterDescricaoConexao(s),
            confianca: s.confianca,
            obsoleto: ehObsoleto,
          };

          return (
            <g
              key={`conn-${index}`}
              className="connection-group"
              style={{ cursor: 'pointer' }}
              onClick={() => tratarCliqueConexao(detalheConexao)}
            >
              {/* Linha da Seta: Vermelha se OBSOLETO, Tracejada se PROVÁVEL, Sólida se CERTO */}
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke={strokeColor}
                strokeWidth={ehObsoleto ? 3 : 2}
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

          const detalheModulo: ConexaoDetalheInfo = {
            de: 'Projeto Principal',
            para: 'Módulos Internos',
            rotulo: 'INTERNO',
            descricao: 'Conecta aos módulos internos, workspaces e pacotes locais do repositório.',
            confianca: 'certo',
            obsoleto: alertaModuloInterno,
          };

          return (
            <g
              key="conn-modulos-internos"
              className="connection-group"
              style={{ cursor: 'pointer' }}
              onClick={() => tratarCliqueConexao(detalheModulo)}
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

        {/* Nós dos Serviços Visíveis (Camada 1 e Camada 2: Clique foca serviço) */}
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

        {/* Nó Especial: "Módulos Internos" (Camada 3: Clique abre expansão de grupos) */}
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
              onClick={tratarCliqueModulos}
              style={{ cursor: 'pointer' }}
              title="Clique para expandir a Camada 3 (Detalhes dos Módulos Internos)"
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

      {/* Camada 4: Card Flutuante / Tooltip ao clicar em uma seta */}
      {conexaoAtiva && (
        <div className="floating-connection-overlay" role="dialog" aria-label="Detalhes da Conexão">
          <button
            className="floating-close-btn"
            onClick={() => setConexaoAtiva(null)}
            aria-label="Fechar detalhes da conexão"
          >
            &times;
          </button>
          <div className="floating-title">
            <span style={{ color: conexaoAtiva.obsoleto ? '#ef4444' : '#60a5fa' }}>➔</span>
            <span>{conexaoAtiva.de} &rarr; {conexaoAtiva.para}</span>
          </div>
          <p className="floating-desc">
            &ldquo;{conexaoAtiva.descricao}&rdquo;
          </p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span
              className="floating-meta-badge"
              style={{
                backgroundColor:
                  conexaoAtiva.obsoleto
                    ? 'rgba(239, 68, 68, 0.2)'
                    : conexaoAtiva.confianca === 'certo'
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(245, 158, 11, 0.2)',
                color:
                  conexaoAtiva.obsoleto
                    ? '#ef4444'
                    : conexaoAtiva.confianca === 'certo'
                    ? '#10b981'
                    : '#f59e0b',
                border: `1px solid ${
                  conexaoAtiva.obsoleto
                    ? 'rgba(239, 68, 68, 0.4)'
                    : conexaoAtiva.confianca === 'certo'
                    ? 'rgba(16, 185, 129, 0.4)'
                    : 'rgba(245, 158, 11, 0.4)'
                }`,
              }}
            >
              {conexaoAtiva.obsoleto
                ? 'ALERTA: OBSOLETO'
                : `CONFIANÇA: ${conexaoAtiva.confianca.toUpperCase()}`}
            </span>
          </div>
        </div>
      )}

      {/* Camada 3: Modal de Expansão de Módulos Internos (com Subgrupos de Monorepo) */}
      {modalModulosAberto && (
        <div
          className="modal-overlay"
          onClick={() => setModalModulosAberto(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span>📦</span>
                <span>Camada 3: Expansão de Módulos Internos</span>
              </div>
              <button
                className="floating-close-btn"
                style={{ position: 'static' }}
                onClick={() => setModalModulosAberto(false)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Detalhamento dos pacotes locais, tecnologias internas e serviços agrupados por pasta ou workspace do repositório:
              </p>

              {Object.entries(subgruposMonorepo).map(([subgrupo, dados], sIdx) => (
                <div key={sIdx} className="subgroup-card">
                  <div className="subgroup-title">
                    <span>📁 {subgrupo}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 400 }}>
                      {dados.servicos.length} serviço(s) &bull; {dados.tecnologias.length} tecnologia(s)
                    </span>
                  </div>

                  {/* Serviços agrupados neste subgrupo */}
                  {dados.servicos.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>
                        Serviços Externos no Subgrupo:
                      </span>
                      {dados.servicos.map((serv, servIdx) => (
                        <div
                          key={servIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: 'rgba(0, 0, 0, 0.25)',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '13px', color: '#fff' }}>{serv.nome}</strong>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                              ({serv.categoria})
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setModalModulosAberto(false);
                              if (aoSelecionarServico) {
                                aoSelecionarServico(serv);
                              }
                            }}
                            style={{
                              backgroundColor: 'rgba(59, 130, 246, 0.2)',
                              color: '#93c5fd',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Ver detalhes ↗
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tecnologias gerais / pacotes detectados */}
                  {dados.tecnologias.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>
                        Pacotes e Bibliotecas:
                      </span>
                      <div className="tech-tags-grid">
                        {dados.tecnologias.map((tech, tIdx) => (
                          <span key={tIdx} className="tech-tag">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
