import fs from 'node:fs/promises';
import path from 'node:path';

export interface VariavelExtraida {
  nome: string;
  arquivo: string;
}

export interface ArquivoConfiguracao {
  arquivo: string;
  presente: boolean;
  tipo: string;
}

export interface ResultadoLeituraConfig {
  variaveis: VariavelExtraida[];
  configuracoes: ArquivoConfiguracao[];
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

const ENV_FILE_PATTERNS = [
  /^\.env.*\.example$/i,
  /^\.env.*\.sample$/i,
  /^\.env.*\.template$/i,
  /^\.env\.example$/i,
  /^\.env\.sample$/i,
  /^\.env\.template$/i,
];

const KNOWN_CONFIG_FILES: Array<{ path: string; tipo: string }> = [
  { path: 'firebase.json', tipo: 'firebase' },
  { path: 'google-services.json', tipo: 'firebase_android' },
  { path: 'wrangler.toml', tipo: 'cloudflare_workers' },
  { path: 'wrangler.jsonc', tipo: 'cloudflare_workers' },
  { path: 'wrangler.json', tipo: 'cloudflare_workers' },
  { path: 'vercel.json', tipo: 'vercel' },
  { path: 'supabase/config.toml', tipo: 'supabase' },
  { path: 'fly.toml', tipo: 'flyio' },
  { path: 'netlify.toml', tipo: 'netlify' },
  { path: 'render.yaml', tipo: 'render' },
];

/**
 * Encontra recursivamente arquivos de exemplo de variáveis de ambiente
 * (.env.example, .env.sample, .env.template e variações como .env.local.example).
 */
async function findEnvFiles(dir: string, baseDir: string = dir): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        const subFiles = await findEnvFiles(path.join(dir, entry.name), baseDir);
        results.push(...subFiles);
      }
    } else if (entry.isFile()) {
      const isEnvFile = ENV_FILE_PATTERNS.some((pattern) => pattern.test(entry.name));
      if (isEnvFile) {
        results.push(path.join(dir, entry.name));
      }
    }
  }

  return results;
}

/**
 * Lê um arquivo de ambiente e extrai APENAS os nomes das variáveis,
 * ignorando comentários, linhas vazias e descartando completamente qualquer valor.
 */
function parseEnvVariableNames(content: string, relFilePath: string): VariavelExtraida[] {
  const lines = content.split(/\r?\n/);
  const vars: VariavelExtraida[] = [];
  const seen = new Set<string>();

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Ignora linhas vazias e comentários
    if (!line || line.startsWith('#')) {
      continue;
    }

    // Suporta 'export VAR_NAME=...' ou 'VAR_NAME=...' ou 'VAR_NAME: ...'
    const cleanLine = line.startsWith('export ') ? line.slice(7).trim() : line;
    const match = cleanLine.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*[=:]/);

    if (match && match[1]) {
      const varName = match[1].trim();
      if (!seen.has(varName)) {
        seen.add(varName);
        vars.push({
          nome: varName,
          arquivo: relFilePath,
        });
      }
    }
  }

  return vars;
}

/**
 * Lê variáveis de ambiente de arquivos .env.example/.sample/.template
 * e busca arquivos de configuração específicos no repositório.
 */
export async function readEnvAndConfigs(repoRoot: string): Promise<ResultadoLeituraConfig> {
  const absoluteRoot = path.resolve(repoRoot);

  // 1. Extração de variáveis de ambiente
  const envFiles = await findEnvFiles(absoluteRoot);
  const variaveis: VariavelExtraida[] = [];
  const seenVars = new Set<string>();

  for (const filePath of envFiles) {
    const relPath = path.relative(absoluteRoot, filePath).replace(/\\/g, '/');
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const extracted = parseEnvVariableNames(content, relPath);

      for (const item of extracted) {
        const key = `${item.nome}::${item.arquivo}`;
        if (!seenVars.has(key)) {
          seenVars.add(key);
          variaveis.push(item);
        }
      }
    } catch (err) {
      console.warn(`[readEnvAndConfigs] Aviso ao ler ${relPath}:`, err);
    }
  }

  // 2. Busca por arquivos de configuração conhecidos
  const configuracoes: ArquivoConfiguracao[] = [];

  for (const config of KNOWN_CONFIG_FILES) {
    const fullPath = path.join(absoluteRoot, config.path);
    try {
      await fs.access(fullPath);
      configuracoes.push({
        arquivo: config.path,
        presente: true,
        tipo: config.tipo,
      });
    } catch {
      configuracoes.push({
        arquivo: config.path,
        presente: false,
        tipo: config.tipo,
      });
    }
  }

  return {
    variaveis,
    configuracoes,
  };
}
