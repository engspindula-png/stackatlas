import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'yaml';
import { EntradaCatalogoSchema } from '../packages/core/dist/schemas/catalogo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogDir = path.resolve(__dirname, '..', 'catalog');

async function coletarArquivosYaml(dir) {
  const arquivos = [];
  const itens = await fs.readdir(dir, { withFileTypes: true });
  for (const item of itens) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      arquivos.push(...(await coletarArquivosYaml(full)));
    } else if (item.isFile() && (item.name.endsWith('.yaml') || item.name.endsWith('.yml'))) {
      arquivos.push(full);
    }
  }
  return arquivos;
}

console.log('Validando catálogo YAML com Zod Schema...');
const yamls = await coletarArquivosYaml(catalogDir);
let erros = 0;
let validados = 0;

for (const y of yamls) {
  const relPath = path.relative(catalogDir, y);
  try {
    const raw = await fs.readFile(y, 'utf-8');
    const parsed = yaml.parse(raw);
    EntradaCatalogoSchema.parse(parsed);
    validados++;
    console.log(`✓ [OK] ${relPath} (${parsed.nome})`);
  } catch (err) {
    erros++;
    console.error(`✕ [ERRO] ${relPath}:`, err.message || err);
  }
}

console.log(`\nResultado da validação: ${validados} arquivo(s) válidos, ${erros} erro(s).`);

if (erros > 0) {
  process.exit(1);
}
