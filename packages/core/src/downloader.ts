import { execFile } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface CloneRepoOptions {
  branch?: string;
  timeoutMs?: number;
  token?: string;
}

export interface ClonedRepoInfo {
  dir: string;
  commit: string;
  branch: string;
  cleanup: () => Promise<void>;
}

/**
 * Substitui com segurança qualquer ocorrência do token por '***' para impedir vazamento em logs ou erros.
 */
export function mascararToken(texto: string, token?: string): string {
  const t = (token || process.env.GITHUB_TOKEN || '').trim();
  if (!t || !texto) return texto;
  return texto.split(t).join('***');
}

/**
 * Se houver GITHUB_TOKEN (via parâmetro ou variável de ambiente), injeta de forma segura na URL do GitHub.
 */
export function injetarTokenGitHub(
  repoUrl: string,
  token?: string
): { urlClone: string; urlMascarada: string } {
  const gitHubToken = (token || process.env.GITHUB_TOKEN || '').trim();
  if (!gitHubToken) {
    return { urlClone: repoUrl, urlMascarada: repoUrl };
  }

  // Verifica se a URL é do GitHub via HTTPS
  const regexGitHub = /^https?:\/\/(?:[^@:]+(?::[^@]*)?@)?github\.com\/(.+)$/i;
  const match = repoUrl.match(regexGitHub);
  if (match) {
    const caminhoRepo = match[1];
    const urlClone = `https://${gitHubToken}@github.com/${caminhoRepo}`;
    const urlMascarada = `https://***@github.com/${caminhoRepo}`;
    return { urlClone, urlMascarada };
  }

  return { urlClone: repoUrl, urlMascarada: repoUrl };
}

/**
 * Remove diretório de forma segura no Windows e POSIX.
 */
export async function removeDirectory(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 200,
    });
  } catch (error) {
    console.error(`Falha ao remover pasta temporária ${dirPath}:`, error);
  }
}

/**
 * Clona um repositório Git (público ou privado) de forma rasa (--depth 1) em pasta temporária.
 * Suporta autenticação via GITHUB_TOKEN e mascara rigorosamente tokens em caso de erro.
 * Extrai o hash completo do commit e o nome da branch.
 */
export async function cloneShallowRepo(
  repoUrl: string,
  options: CloneRepoOptions = {}
): Promise<ClonedRepoInfo> {
  const tempDir = path.join(
    os.tmpdir(),
    `stackatlas-${crypto.randomUUID()}`
  );

  const tokenEfetivo = (options.token || process.env.GITHUB_TOKEN || '').trim();
  const { urlClone } = injetarTokenGitHub(repoUrl, tokenEfetivo);

  const cloneArgs = ['clone', '--depth', '1'];
  if (options.branch) {
    cloneArgs.push('--branch', options.branch);
  }
  cloneArgs.push(urlClone, tempDir);

  const execOptions = {
    timeout: options.timeoutMs ?? 60_000,
    windowsHide: true,
  };

  try {
    // 1. Clone raso
    await execFileAsync('git', cloneArgs, execOptions);

    // 2. Extrai hash completo do commit
    const { stdout: commitStdout } = await execFileAsync(
      'git',
      ['-C', tempDir, 'rev-parse', 'HEAD'],
      execOptions
    );
    const commit = commitStdout.trim();

    // 3. Extrai nome da branch
    let branch = 'main';
    try {
      const { stdout: branchStdout } = await execFileAsync(
        'git',
        ['-C', tempDir, 'rev-parse', '--abbrev-ref', 'HEAD'],
        execOptions
      );
      branch = branchStdout.trim() || 'main';
    } catch {
      branch = options.branch || 'main';
    }

    const cleanup = async () => {
      await removeDirectory(tempDir);
    };

    return {
      dir: tempDir,
      commit,
      branch,
      cleanup,
    };
  } catch (error: any) {
    // Limpeza da pasta temporária se criada
    await removeDirectory(tempDir);

    // REGRA DE SEGURANÇA CRÍTICA (Seção 8.6):
    // Mascara o token no erro para garantir que nunca vaze no terminal ou logs
    if (tokenEfetivo) {
      if (error && typeof error === 'object') {
        if (typeof error.message === 'string') {
          error.message = mascararToken(error.message, tokenEfetivo);
        }
        if (typeof error.stderr === 'string') {
          error.stderr = mascararToken(error.stderr, tokenEfetivo);
        }
        if (typeof error.stdout === 'string') {
          error.stdout = mascararToken(error.stdout, tokenEfetivo);
        }
      }
    }

    throw error;
  }
}

/**
 * Executa uma operação com o repositório clonado em pasta temporária
 * e garante que a pasta será apagada no final (mesmo em caso de erro).
 */
export async function withClonedRepo<T>(
  repoUrl: string,
  fn: (repo: { dir: string; commit: string; branch: string }) => Promise<T>,
  options: CloneRepoOptions = {}
): Promise<T> {
  const cloned = await cloneShallowRepo(repoUrl, options);
  try {
    return await fn({
      dir: cloned.dir,
      commit: cloned.commit,
      branch: cloned.branch,
    });
  } finally {
    await cloned.cleanup();
  }
}
