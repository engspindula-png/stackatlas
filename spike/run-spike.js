import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyser, FSProvider, flatten } from '@specfy/stack-analyser';
import '@specfy/stack-analyser/dist/autoload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturesDir = path.join(__dirname, 'fixtures');
const projects = fs.readdirSync(fixturesDir).filter((f) => {
  return fs.statSync(path.join(fixturesDir, f)).isDirectory();
});

console.log('='.repeat(60));
console.log('TESTE DE VIABILIDADE - FASE 0 (SPIKE)');
console.log('Detector: @specfy/stack-analyser (v1.27.6)');
console.log('Meta de aprovação: >= 70% das tecnologias esperadas');
console.log('='.repeat(60));
console.log('');

const results = [];
let totalExpected = 0;
let totalFound = 0;

for (const project of projects) {
  const projectPath = path.join(fixturesDir, project);
  const expectedPath = path.join(projectPath, 'esperado.json');
  const expected = JSON.parse(fs.readFileSync(expectedPath, 'utf-8'));

  console.log(`\n▶ Analisando: ${expected.nome} (${project})...`);

  const provider = new FSProvider({ path: projectPath });
  const rawResult = await analyser({ provider });
  const flatResult = flatten(rawResult);
  const jsonResult = rawResult.toJson();
  const flatJson = flatResult.toJson();

  // Coleta todas as tecnologias detectadas (root + childs + componentes)
  const detectedTechs = new Set([
    ...(jsonResult.techs || []),
    ...(flatJson.childs || []).map((c) => c.tech).filter(Boolean),
    ...(flatJson.childs || []).flatMap((c) => c.techs || []),
  ]);
  if (jsonResult.tech) detectedTechs.add(jsonResult.tech);

  // Também verificar linguagens
  const detectedLanguages = Object.keys(jsonResult.languages || {});

  // Mapeamento normalizado para comparação
  const allDetected = new Set([
    ...Array.from(detectedTechs).map((t) => t.toLowerCase()),
    ...detectedLanguages.map((l) => l.toLowerCase()),
  ]);

  // Checar tecnologias esperadas
  const matched = [];
  const missed = [];

  for (const tech of expected.tecnologiasEsperadas) {
    const techLower = tech.toLowerCase();
    // Verifica se alguma tecnologia detectada contém ou é igual à esperada
    const found = Array.from(allDetected).some((d) => {
      return d === techLower || d.includes(techLower) || techLower.includes(d);
    });

    if (found) {
      matched.push(tech);
    } else {
      missed.push(tech);
    }
  }

  // Verifica se o resultado do detector extraiu variáveis de ambiente
  const jsonString = JSON.stringify(jsonResult);
  const envVarsExtracted = expected.variaveisEsperadas.filter((v) =>
    jsonString.includes(`"${v}"`)
  );

  const percentage = (matched.length / expected.tecnologiasEsperadas.length) * 100;
  totalExpected += expected.tecnologiasEsperadas.length;
  totalFound += matched.length;

  const projectReport = {
    projeto: expected.nome,
    pasta: project,
    esperadas: expected.tecnologiasEsperadas,
    detectadas: Array.from(allDetected),
    acertos: matched,
    naoDetectadas: missed,
    taxaAcerto: `${percentage.toFixed(1)}%`,
    variaveisEsperadas: expected.variaveisEsperadas,
    variaveisExtraidasPeloDetector: envVarsExtracted,
  };

  results.push(projectReport);

  console.log(`  ✓ Tecnologias detectadas: ${Array.from(allDetected).join(', ') || 'nenhuma'}`);
  console.log(`  ✓ Acertos (${matched.length}/${expected.tecnologiasEsperadas.length}): ${matched.join(', ') || 'nenhum'}`);
  if (missed.length > 0) {
    console.log(`  ✗ Não detectadas: ${missed.join(', ')}`);
  }
  console.log(`  ✓ Taxa de detecção: ${percentage.toFixed(1)}%`);
  console.log(`  ℹ Variáveis de ambiente no JSON do detector: ${envVarsExtracted.length > 0 ? envVarsExtracted.join(', ') : 'Nenhuma (conforme previsto no SPEC.md)'}`);
}

const overallPercentage = (totalFound / totalExpected) * 100;
const aprovado = overallPercentage >= 70;

const summary = {
  data: new Date().toISOString(),
  detector: '@specfy/stack-analyser',
  versao: '1.27.6',
  criterioAprovacao: '>= 70%',
  totalEsperado: totalExpected,
  totalEncontrado: totalFound,
  taxaGeral: `${overallPercentage.toFixed(1)}%`,
  aprovado,
  projetos: results,
};

fs.writeFileSync(
  path.join(__dirname, 'spike-report.json'),
  JSON.stringify(summary, null, 2)
);

console.log('\n' + '='.repeat(60));
console.log('RESUMO FINAL DO SPIKE');
console.log('='.repeat(60));
console.log(`Total de tecnologias esperadas: ${totalExpected}`);
console.log(`Total de tecnologias detectadas: ${totalFound}`);
console.log(`Taxa geral de cobertura: ${overallPercentage.toFixed(1)}%`);
console.log(`Critério mínimo de 70%: ${aprovado ? 'APROVADO ✓' : 'REPROVADO ✗'}`);
console.log('='.repeat(60));
