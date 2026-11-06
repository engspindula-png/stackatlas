import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeRepository } from '../packages/core/dist/packages/core/src/detector.js';
import { readEnvAndConfigs } from '../packages/core/dist/packages/core/src/configReader.js';
import { cruzarComCatalogo } from '../packages/core/dist/packages/core/src/matcher.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const catalogDir = path.join(rootDir, 'catalog');
const targetRepo = process.argv[2] || path.join(rootDir, 'fixtures', 'nextjs-subscription-payments');

console.log('='.repeat(75));
console.log('FLUXO COMPLETO DO STACKATLAS (Fase 1 - Tarefas 4 a 6)');
console.log('Alvo:', targetRepo);
console.log('Catálogo:', catalogDir);
console.log('='.repeat(75));

// 1. Detecção de pacotes e código (Specfy + Leitor Próprio)
console.log('\n[Passo 1] Analisando dependências e tecnologias...');
const detectorResult = await analyzeRepository(targetRepo);
console.log(`✓ Total de tecnologias detectadas: ${detectorResult.tecnologias.length}`);
console.log(`  (${detectorResult.tecnologias.join(', ')})`);

// 2. Leitura de variáveis de ambiente (.env.example) e arquivos de configuração
console.log('\n[Passo 2] Extraindo variáveis de ambiente e arquivos de configuração...');
const configResult = await readEnvAndConfigs(targetRepo);
console.log(`✓ Total de variáveis encontradas: ${configResult.variaveis.length} (apenas nomes, zero valores)`);
for (const v of configResult.variaveis) {
  console.log(`  - ${v.nome} (${v.arquivo})`);
}
const configsPresentes = configResult.configuracoes.filter((c) => c.presente);
console.log(`✓ Arquivos de configuração detectados: ${configsPresentes.length}`);
for (const c of configsPresentes) {
  console.log(`  - ${c.arquivo} [${c.tipo}]`);
}

// 3. Cruzamento com Catálogo e Cálculo de Confiança
console.log('\n[Passo 3] Cruzando sinais com o Catálogo oficial...');
const resultadoCruzamento = await cruzarComCatalogo(detectorResult, configResult, catalogDir);

console.log('\n' + '='.repeat(75));
console.log('RESULTADO DO CRUZAMENTO (SERVIÇOS CATALOGADOS IDENTIFICADOS):');
console.log('='.repeat(75));

if (resultadoCruzamento.servicos.length === 0) {
  console.log('Nenhum serviço do catálogo identificado neste repositório.');
} else {
  for (const s of resultadoCruzamento.servicos) {
    const badgeConfianca = s.confianca === 'certo' ? '✓ CERTO' : '? PROVÁVEL';
    console.log(`\n▶ SERVIÇO: ${s.nome} [${s.id}] - ${badgeConfianca}`);
    console.log(`  Categoria: ${s.categoria} / ${s.subcategoria}`);
    console.log(`  Justificativa: ${s.detalheConfianca}`);
    console.log(`  Sinais identificados (${s.sinais.length}):`);
    for (const sinal of s.sinais) {
      console.log(`    - [${sinal.tipo.toUpperCase()}] ${sinal.valor} (em: ${sinal.arquivo})`);
    }
  }
}

console.log('\n' + '-'.repeat(75));
console.log('TECNOLOGIAS DETECTADAS AINDA NÃO CATALOGADAS NA V1:');
console.log('-'.repeat(75));
console.log(resultadoCruzamento.naoCatalogados.map((n) => n.tech).join(', '));

console.log('\n' + '='.repeat(75));
console.log('FLUXO FINALIZADO COM SUCESSO!');
console.log('='.repeat(75));
