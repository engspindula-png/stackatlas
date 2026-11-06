import fs from 'node:fs/promises';
import path from 'node:path';
import '@specfy/stack-analyser/dist/autoload.js';
import { matchDependencies } from '@specfy/stack-analyser/dist/matchDependencies.js';

export interface PackageDependency {
  name: string;
  version: string;
  type: 'dependency' | 'devDependency' | 'peerDependency';
  file: string;
}

export interface ExtractedPackageJson {
  filePath: string;
  name: string | null;
  isPrivate: boolean;
  dependencies: PackageDependency[];
  techsMatched: string[];
}

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  'dist',
  'build',
  'out',
  'coverage',
  '.stackatlas',
]);

/**
 * Busca recursivamente todos os arquivos package.json no diretório,
 * ignorando diretórios de build e dependências (como node_modules).
 */
async function findPackageJsonFiles(dir: string, baseDir: string = dir): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        const subFiles = await findPackageJsonFiles(path.join(dir, entry.name), baseDir);
        results.push(...subFiles);
      }
    } else if (entry.isFile() && entry.name === 'package.json') {
      results.push(path.join(dir, entry.name));
    }
  }

  return results;
}

/**
 * Leitor próprio que força a leitura direta de todos os package.json
 * de um repositório, garantindo a extração mesmo quando o campo "name"
 * estiver ausente (evitando a limitação do detector padrão).
 */
export async function readAllPackageJsons(repoRoot: string): Promise<ExtractedPackageJson[]> {
  const packageJsonFiles = await findPackageJsonFiles(repoRoot);
  const extractedList: ExtractedPackageJson[] = [];

  for (const absPath of packageJsonFiles) {
    const relPath = path.relative(repoRoot, absPath).replace(/\\/g, '/');

    try {
      const rawContent = await fs.readFile(absPath, 'utf-8');
      const json = JSON.parse(rawContent);

      const depsList: PackageDependency[] = [];
      const depNamesForMatcher: string[] = [];

      // Extrai dependencies
      if (json.dependencies && typeof json.dependencies === 'object') {
        for (const [name, version] of Object.entries(json.dependencies)) {
          if (typeof version === 'string') {
            depsList.push({ name, version, type: 'dependency', file: relPath });
            depNamesForMatcher.push(name);
          }
        }
      }

      // Extrai devDependencies
      if (json.devDependencies && typeof json.devDependencies === 'object') {
        for (const [name, version] of Object.entries(json.devDependencies)) {
          if (typeof version === 'string') {
            depsList.push({ name, version, type: 'devDependency', file: relPath });
            depNamesForMatcher.push(name);
          }
        }
      }

      // Extrai peerDependencies
      if (json.peerDependencies && typeof json.peerDependencies === 'object') {
        for (const [name, version] of Object.entries(json.peerDependencies)) {
          if (typeof version === 'string') {
            depsList.push({ name, version, type: 'peerDependency', file: relPath });
            depNamesForMatcher.push(name);
          }
        }
      }

      // Mapeia dependências contra a base de regras do Specfy
      const matchedMap = matchDependencies(depNamesForMatcher, 'npm');
      const techsMatched = Array.from(matchedMap.keys());

      extractedList.push({
        filePath: relPath,
        name: typeof json.name === 'string' ? json.name : null,
        isPrivate: Boolean(json.private),
        dependencies: depsList,
        techsMatched,
      });
    } catch (err) {
      console.warn(`[readAllPackageJsons] Aviso ao ler ${relPath}:`, err);
    }
  }

  return extractedList;
}
