import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeRepository } from '../packages/core/dist/packages/core/src/detector.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, '..', 'fixtures', 'nextjs-subscription-payments');

console.log('='.repeat(70));
console.log('EXECUÇÃO DO DETECTOR INTEGRADO COM LEITOR PRÓPRIO');
console.log('Repositório analisado:', fixturePath);
console.log('='.repeat(70));

const resultado = await analyzeRepository(fixturePath);

console.log('\n[1] Arquivos package.json lidos pelo leitor próprio:');
for (const pkg of resultado.packageJsons) {
  console.log(`- Arquivo: ${pkg.filePath}`);
  console.log(`  Campo "name": ${pkg.name === null ? 'AUSENTE (mas lido com sucesso!)' : pkg.name}`);
  console.log(`  Private: ${pkg.isPrivate}`);
  console.log(`  Total de dependências extraídas: ${pkg.dependencies.length}`);
  console.log(`  Tecnologias mapeadas diretamente: ${pkg.techsMatched.join(', ')}`);
}

console.log('\n[2] Tecnologias detectadas no total (Specfy + Leitor Próprio):');
console.log(resultado.tecnologias.join(', '));

console.log('\n[3] Origem de cada item detectado:');
for (const item of resultado.itensDetectados) {
  console.log(`- ${item.tech.padEnd(16)} | Origem: ${item.origem}`);
}

console.log('\n[4] Linguagens encontradas:');
console.log(resultado.linguagens);

console.log('\n' + '='.repeat(70));
console.log('STATUS: Detecção concluída com sucesso!');
console.log('='.repeat(70));
