import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyser, FSProvider, flatten } from '@specfy/stack-analyser';
import '@specfy/stack-analyser/dist/autoload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gabaritoPath = path.join(__dirname, 'gabarito-projetos-reais.json');
const gabarito = JSON.parse(fs.readFileSync(gabaritoPath, 'utf-8'));

console.log('='.repeat(70));
console.log('TESTE DE VIABILIDADE - FASE 0 (REPOSITÓRIOS REAIS E PÚBLICOS)');
console.log('Detector: @specfy/stack-analyser (v1.27.6)');
console.log('='.repeat(70));
console.log('');

const relatorioProjetos = [];
let totalEsperadosGeral = 0;
let totalAcertosGeral = 0;

for (const repo of gabarito.repositorios) {
  const repoDir = path.join(__dirname, 'repos', repo.id);
  console.log(`\n▶ [${repo.nome}]`);
  console.log(`  Tipo: ${repo.tipo}`);
  console.log(`  Pasta: repos/${repo.id}`);

  const provider = new FSProvider({ path: repoDir });
  const rawResult = await analyser({ provider });

  // Pegadinha do flatten: usar o objeto bruto (rawResult), nunca o JSON!
  const flatResult = flatten(rawResult);
  const jsonResult = rawResult.toJson();
  const flatJson = flatResult.toJson();

  // Coletar todas as tecnologias e serviços detectados
  const detectedTechs = new Set([
    ...(jsonResult.techs || []),
    ...(flatJson.childs || []).map((c) => c.tech).filter(Boolean),
    ...(flatJson.childs || []).flatMap((c) => c.techs || []),
  ]);
  if (jsonResult.tech) detectedTechs.add(jsonResult.tech);

  const detectedLanguages = Object.keys(jsonResult.languages || {});

  // Conjunto com todas as detecções normalizadas em minúsculas
  const allDetected = new Set([
    ...Array.from(detectedTechs).map((t) => t.toLowerCase()),
    ...detectedLanguages.map((l) => l.toLowerCase()),
  ]);

  // Lista pura de techs reportadas pelo detector
  const techList = Array.from(detectedTechs).sort();

  // Comparação com o gabarito
  const acertos = [];
  const naoApareceu = [];

  for (const esperada of repo.servicosETecnologiasEsperados) {
    const espLower = esperada.toLowerCase();
    const encontrou = Array.from(allDetected).some((d) => {
      return d === espLower || d.includes(espLower) || espLower.includes(d);
    });

    if (encontrou) {
      acertos.push(esperada);
    } else {
      naoApareceu.push(esperada);
    }
  }

  // Verificar o que foi detectado que NÃO estava no gabarito
  const extrasDetectadas = [];
  for (const tech of techList) {
    const match = repo.servicosETecnologiasEsperados.some((esp) => {
      const espLower = esp.toLowerCase();
      const techLower = tech.toLowerCase();
      return techLower === espLower || techLower.includes(espLower) || espLower.includes(techLower);
    });
    if (!match) {
      extrasDetectadas.push(tech);
    }
  }

  // Verificar se o detector trouxe variáveis de ambiente no JSON
  const jsonString = JSON.stringify(jsonResult);
  const envVarsNoJson = repo.variaveisEsperadas.filter((v) =>
    jsonString.includes(`"${v}"`)
  );

  const taxaAcerto = (acertos.length / repo.servicosETecnologiasEsperados.length) * 100;
  totalEsperadosGeral += repo.servicosETecnologiasEsperados.length;
  totalAcertosGeral += acertos.length;

  console.log(`  ✓ Acertou (${acertos.length}/${repo.servicosETecnologiasEsperados.length}): ${acertos.join(', ') || 'nenhum'}`);
  if (naoApareceu.length > 0) {
    console.log(`  ✗ Não apareceu (${naoApareceu.length}): ${naoApareceu.join(', ')}`);
  }
  console.log(`  ℹ Outras tecnologias detectadas: ${extrasDetectadas.join(', ') || 'nenhuma'}`);
  console.log(`  ℹ Taxa de acerto das esperadas: ${taxaAcerto.toFixed(1)}%`);
  console.log(`  ℹ Variáveis de ambiente no JSON: ${envVarsNoJson.length > 0 ? envVarsNoJson.join(', ') : 'NENHUMA (o detector não extrai variáveis)'}`);

  relatorioProjetos.push({
    id: repo.id,
    nome: repo.nome,
    tipo: repo.tipo,
    url: repo.url,
    motivoEscolha: repo.motivoEscolha,
    servicosETecnologiasEsperados: repo.servicosETecnologiasEsperados,
    todasDetectadas: techList,
    acertos,
    naoApareceu,
    extrasDetectadas,
    taxaAcerto: `${taxaAcerto.toFixed(1)}%`,
    variaveisEsperadas: repo.variaveisEsperadas,
    variaveisNoJson: envVarsNoJson,
  });
}

const taxaGeral = (totalAcertosGeral / totalEsperadosGeral) * 100;
const aprovado = taxaGeral >= 70;

const resumoFinal = {
  data: new Date().toISOString(),
  detector: '@specfy/stack-analyser',
  versao: '1.27.6',
  metaMinima: '>= 70%',
  totalEsperado: totalEsperadosGeral,
  totalAcertos: totalAcertosGeral,
  taxaGeral: `${taxaGeral.toFixed(1)}%`,
  aprovado,
  projetos: relatorioProjetos,
};

fs.writeFileSync(
  path.join(__dirname, 'relatorio-fase0-real.json'),
  JSON.stringify(resumoFinal, null, 2)
);

console.log('\n' + '='.repeat(70));
console.log('RESUMO FINAL GERAL DO TESTE EM PROJETOS REAIS');
console.log('='.repeat(70));
console.log(`Total de tecnologias/serviços esperados: ${totalEsperadosGeral}`);
console.log(`Total de acertos do detector: ${totalAcertosGeral}`);
console.log(`Taxa geral de cobertura: ${taxaGeral.toFixed(1)}%`);
console.log(`Status de aprovação (meta 70%): ${aprovado ? 'APROVADO ✓' : 'REPROVADO ✗'}`);
console.log('='.repeat(70));
