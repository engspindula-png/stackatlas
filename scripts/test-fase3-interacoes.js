import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { carregarCatalogo } from '../packages/core/dist/packages/core/src/matcher.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carrega a ficha gravada no diretório do usuário
const fichasDir = path.join(os.homedir(), '.stackatlas', 'fichas');
const fichaArquivo = path.join(fichasDir, 'stackatlas__stackatlas-platform__c9f8e7d.json');
const ficha = JSON.parse(fs.readFileSync(fichaArquivo, 'utf8'));

// Carrega catálogo real do sistema (23 serviços)
const dirCatalogo = path.resolve('catalog');
const catalogoReal = await carregarCatalogo(dirCatalogo);

console.log('='.repeat(70));
console.log('TESTE DE VALIDAÇÃO AUTOMATIZADA: FASE 3 (CAMADAS 1, 2, 3 E 4)');
console.log('='.repeat(70));

let falhas = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`✓ [PASS] ${msg}`);
  } else {
    console.error(`✗ [FAIL] ${msg}`);
    falhas++;
  }
}

// Lógica de descrição de conexão da Camada 4
function obterDescricaoConexao(servico) {
  const sId = (servico.id || '').toLowerCase();
  const cat = (servico.categoria || '').toLowerCase();
  const sub = (servico.subcategoria || '').toLowerCase();

  const DESCRICOES = {
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

// Lógica de verificação de obsolescência
function verificarServicoObsoleto(servico, alertas = [], catalogo = []) {
  const sId = (servico.id || '').toLowerCase();
  const sNome = servico.nome.toLowerCase();

  const alerta = alertas.find(
    (a) => a.tipo === 'obsoleto' && (a.servico.toLowerCase() === sId || a.servico.toLowerCase() === sNome)
  );
  if (alerta) {
    return { obsoleto: true, mensagem: alerta.mensagem };
  }

  const sinalObsoleto = servico.sinais.find(
    (s) => s.tipo === 'dependencia' && s.valor.toLowerCase().includes('obsoleto')
  );
  if (sinalObsoleto) {
    return { obsoleto: true, mensagem: `Usa pacote descontinuado: ${sinalObsoleto.valor}` };
  }

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

// -------------------------------------------------------------
// 1. TESTE DA CAMADA 1: AGRUPAMENTO (MÁXIMO 6-8 NÓS)
// -------------------------------------------------------------
console.log('\n--- 1. Teste Camada 1: Limite de Nós e Regra de Ouro de Agrupamento ---');
const LIMITE_MAX_NOS = 7;
const servicos = ficha.servicos;
const alertas = ficha.alertas;

const servicosComStatus = servicos.map((s) => {
  const statusObs = verificarServicoObsoleto(s, alertas, catalogoReal);
  return {
    servico: s,
    obsoleto: statusObs.obsoleto,
    mensagemObs: statusObs.mensagem,
    dataDescontinuacao: statusObs.dataDescontinuacao,
  };
});

const obsoletos = servicosComStatus.filter((s) => s.obsoleto);
const naoObsoletos = servicosComStatus.filter((s) => !s.obsoleto);
const certos = naoObsoletos.filter((s) => s.servico.confianca === 'certo');
const provaveis = naoObsoletos.filter((s) => s.servico.confianca !== 'certo');

const vagasIndividuais = Math.max(1, LIMITE_MAX_NOS - 1);
const selecionados = [...obsoletos];
const servicosAgrupados = [];

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

const servicosVisiveis = selecionados;
const totalNosNoAnel = servicosVisiveis.length + (servicosAgrupados.length > 0 ? 1 : 0);

assert(servicos.length === 9, `Total de serviços na ficha de teste é 9 (atual: ${servicos.length})`);
assert(totalNosNoAnel <= 8 && totalNosNoAnel >= 6, `Total de nós visíveis no anel está entre 6 e 8 (atual: ${totalNosNoAnel})`);
assert(
  servicosVisiveis.some((s) => s.servico.id === 'amazon-ses'),
  'Regra de Ouro: Amazon SES (com alerta obsoleto) NUNCA é escondido pelo agrupamento e fica visível'
);
assert(
  servicosVisiveis.some((s) => s.servico.id === 'gemini'),
  'Regra de Ouro: Google Gemini (com pacote obsoleto) NUNCA é escondido pelo agrupamento e fica visível'
);
assert(servicosAgrupados.length === 3, `Excedente agrupado em Módulos Internos tem 3 serviços (atual: ${servicosAgrupados.length})`);

// -------------------------------------------------------------
// 2. TESTE DO ALERTA DE OBSOLESCÊNCIA: SETA VERMELHA
// -------------------------------------------------------------
console.log('\n--- 2. Teste Alerta de Obsolescência: Seta Conectora Vermelha ---');
const sesStatus = verificarServicoObsoleto(
  servicos.find((s) => s.id === 'amazon-ses'),
  alertas,
  catalogoReal
);
assert(sesStatus.obsoleto === true, 'Amazon SES detectado como obsoleto devido ao uso de aws-sdk v2');

const corSetaSES = sesStatus.obsoleto ? '#ef4444' : '#10b981';
const markerSetaSES = sesStatus.obsoleto ? 'url(#arrow-obsoleto)' : 'url(#arrow-certo)';
assert(corSetaSES === '#ef4444', `Seta conectora do Amazon SES é vermelha (#ef4444)`);
assert(markerSetaSES === 'url(#arrow-obsoleto)', `Ponta da seta conectora usa marcador url(#arrow-obsoleto)`);

// -------------------------------------------------------------
// 3. TESTE DA CAMADA 2: PAINEL LATERAL FOCADO NO SERVIÇO
// -------------------------------------------------------------
console.log('\n--- 3. Teste Camada 2: Detalhes do Serviço Focado no Painel Lateral ---');
const servicoSES = servicos.find((s) => s.id === 'amazon-ses');
const catSES = catalogoReal.find((c) => c.id === 'amazon-ses');
assert(!!catSES, 'Amazon SES localizado no catálogo tipado');
assert(
  catSES.cadastro === 'https://portal.aws.amazon.com/signup',
  `Link oficial de cadastro verificado: ${catSES.cadastro}`
);

const varsSES = ficha.variaveis.filter((v) => v.idServico === 'amazon-ses');
assert(varsSES.length === 2, `Variáveis do Amazon SES filtradas corretamente: ${varsSES.map((v) => v.nome).join(', ')}`);
assert(varsSES.every((v) => v.obrigatoria === true), 'Variáveis de autenticação marcadas com flag Obrigatória');

const servicoSupabase = servicos.find((s) => s.id === 'supabase');
const varsSupabase = ficha.variaveis.filter((v) => v.idServico === 'supabase');
assert(varsSupabase.length === 3, `Variáveis do Supabase identificadas: ${varsSupabase.length}`);
const varOpcional = varsSupabase.find((v) => v.nome === 'SUPABASE_SERVICE_ROLE_KEY');
assert(varOpcional && varOpcional.obrigatoria === false, 'SUPABASE_SERVICE_ROLE_KEY com flag Opcional (obrigatoria: false)');

// -------------------------------------------------------------
// 4. TESTE DA CAMADA 3: EXPANSÃO DE GRUPOS E SUBGRUPOS MONOREPO
// -------------------------------------------------------------
console.log('\n--- 4. Teste Camada 3: Expansão de Módulos Internos e Subgrupos ---');
const subgrupos = {};
const extrairSubgrupo = (arq) => {
  const limpo = arq.replace(/\\/g, '/');
  const partes = limpo.split('/');
  if (partes.length > 1 && (partes[0] === 'packages' || partes[0] === 'apps')) {
    return `${partes[0]}/${partes[1]}`;
  }
  return 'Raiz do Repositório';
};

for (const item of servicosAgrupados) {
  const arq = item.servico.sinais[0]?.arquivo || 'package.json';
  const sub = extrairSubgrupo(arq);
  if (!subgrupos[sub]) subgrupos[sub] = { servicos: [], tecnologias: [] };
  subgrupos[sub].servicos.push(item.servico.nome);
}
for (const nc of ficha.naoIdentificados) {
  const sub = extrairSubgrupo(nc.arquivo);
  if (!subgrupos[sub]) subgrupos[sub] = { servicos: [], tecnologias: [] };
  subgrupos[sub].tecnologias.push(nc.sinal);
}

assert(Object.keys(subgrupos).length >= 2, `Monorepo particionado em múltiplos subgrupos: ${Object.keys(subgrupos).join(', ')}`);
assert(subgrupos['packages/core'] !== undefined, 'Subgrupo packages/core presente');
assert(subgrupos['packages/web'] !== undefined, 'Subgrupo packages/web presente');

// -------------------------------------------------------------
// 5. TESTE DA CAMADA 4: DESCRIÇÃO EM UMA FRASE NA SETA
// -------------------------------------------------------------
console.log('\n--- 5. Teste Camada 4: Descrição em uma Frase nas Conexões ---');
for (const s of servicos) {
  const desc = obterDescricaoConexao(s);
  assert(
    desc && desc.length > 15 && desc.endsWith('.'),
    `Descrição de [${s.nome}]: "${desc}"`
  );
  assert(!desc.includes('(') || desc.length < 100, `Descrição é limpa e sem código: "${desc}"`);
}

console.log('='.repeat(70));
if (falhas === 0) {
  console.log('✓ TODOS OS TESTES DAS CAMADAS 1, 2, 3 E 4 PASSARAM COM 100% DE SUCESSO!');
} else {
  console.error(`✗ ${falhas} TESTES FALHARAM!`);
  process.exit(1);
}
console.log('='.repeat(70));
