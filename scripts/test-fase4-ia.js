import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  lerMeuStack,
  salvarMeuStack,
  sincronizarServicosComMeuStack,
  obterCaminhoMeuStack,
} from '../packages/core/dist/packages/core/src/meuStack.js';
import {
  gerarContextoIa,
  exportarContextoIa,
  resolverFichaParaAlvo,
} from '../packages/core/dist/packages/core/src/aiExporter.js';

console.log('='.repeat(70));
console.log('TESTE DE VALIDAÇÃO AUTOMATIZADA: FASE 4 (CAMADA PARA IA DE PROGRAMAÇÃO)');
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

// -----------------------------------------------------------------
// 1. TESTE DA GESTÃO DO MEU-STACK.JSON
// -----------------------------------------------------------------
console.log('\n--- 1. Teste de Gestão do ~/.stackatlas/meu-stack.json ---');
const caminhoMeuStack = obterCaminhoMeuStack();
assert(caminhoMeuStack.endsWith('meu-stack.json'), `Caminho resolvido corretamente: ${caminhoMeuStack}`);

// Sincroniza serviços de teste
const resStack = sincronizarServicosComMeuStack([
  { id: 'supabase', nome: 'Supabase', categoria: 'backend' },
  { id: 'turso', nome: 'Turso', categoria: 'bancos' },
  { id: 'anthropic', nome: 'Anthropic', categoria: 'ia' },
]);

assert(fs.existsSync(caminhoMeuStack), 'Arquivo ~/.stackatlas/meu-stack.json criado no disco');
const lido = lerMeuStack();
assert(lido.versao === 1, 'Versão do meu-stack.json é 1');
assert(lido.servicos.length >= 3, `Total de serviços em meu-stack.json >= 3 (atual: ${lido.servicos.length})`);
assert(lido.servicos.some((s) => s.id === 'supabase'), 'Serviço Supabase presente em meu-stack.json');
assert(lido.servicos.some((s) => s.id === 'turso'), 'Serviço Turso presente em meu-stack.json');
assert(lido.servicos.some((s) => s.id === 'anthropic'), 'Serviço Anthropic presente em meu-stack.json');

// -----------------------------------------------------------------
// 2. TESTE DA EXPORTAÇÃO DE CONTEXTO PARA IA
// -----------------------------------------------------------------
console.log('\n--- 2. Teste de Exportação do CLAUDE.md para Repositório de Teste ---');
const alvo = 'fixtures/nextjs-subscription-payments';
const resultadoExport = await exportarContextoIa(alvo, {
  nomeArquivo: 'CLAUDE.md',
});

assert(fs.existsSync(resultadoExport.caminhoArquivo), `Arquivo gerado no disco: ${resultadoExport.caminhoArquivo}`);
const conteudo = resultadoExport.conteudo;

// Validações do Conteúdo Ultracompacto
assert(conteudo.includes('# StackAtlas — Contexto de Arquitetura'), 'Cabeçalho principal do StackAtlas presente');
assert(conteudo.includes('## 1. Índice da Stack Atual'), 'Seção 1: Índice da stack atual presente');
assert(conteudo.includes('Supabase'), 'Serviço Supabase listado no índice');
assert(conteudo.includes('catalog/backend/supabase.yaml'), 'Ponteiro para catalog/backend/supabase.yaml presente');

// Validações das Regras Estritas de Sistema
console.log('\n--- 3. Teste das Regras de Sistema e Proteção contra Obsolescência ---');
assert(conteudo.includes('## 2. Regras Estritas de Sistema para IA de Programação'), 'Seção 2: Regras estritas de sistema presente');
assert(
  conteudo.includes('meu-stack.json') && conteudo.includes('Reaproveitamento de Serviços Homologados'),
  'Regra 1: Instrução de reaproveitar serviços do meu-stack.json'
);
assert(
  conteudo.includes('.env.example') && conteudo.includes('Nomenclatura Exata'),
  'Regra 2: Instrução de gerar .env.example com nomenclatura exata do catálogo'
);
assert(
  conteudo.includes('dependenciasObsoletas') && conteudo.includes('Proteção Rigorosa Contra Dependências Obsoletas'),
  'Regra 3: Instrução de NUNCA sugerir dependências da lista dependenciasObsoletas'
);
assert(
  conteudo.includes('aws-sdk') && conteudo.includes('@google/generative-ai'),
  'Regra 3: Alertas expressos contra pacotes descontinuados (aws-sdk, @google/generative-ai)'
);
assert(
  conteudo.includes('Consulta Sob Demanda ao Catálogo') && conteudo.includes('NUNCA solicite nem carregue em contexto o catálogo inteiro'),
  'Regra 4: Consulta estritamente sob demanda sem despejo total'
);

console.log('='.repeat(70));
if (falhas === 0) {
  console.log('✓ TODOS OS TESTES DA FASE 4 PASSARAM COM 100% DE SUCESSO!');
} else {
  console.error(`✗ ${falhas} TESTES FALHARAM!`);
  process.exit(1);
}
console.log('='.repeat(70));
