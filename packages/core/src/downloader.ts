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
}

export interface ClonedRepoInfo {
  dir: string;
  commit: string;
  branch: string;
  cleanup: () => Promise<void>;
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
 * Clona um repositório Git público de forma rasa (--depth 1) em pasta temporária.
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

  const cloneArgs = ['clone', '--depth', '1'];
  if (options.branch) {
    cloneArgs.push('--branch', options.branch);
  }
  cloneArgs.push(repoUrl, tempDir);

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
  } catch (error) {
    // Se falhar durante o clone, garante a limpeza da pasta se tiver sido criada
    await removeDirectory(tempDir);
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
