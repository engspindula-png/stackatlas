import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { iniciarServidor } from '../packages/core/dist/packages/core/src/server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('='.repeat(70));
console.log('INICIANDO STACKATLAS (BACK-END + FRONT-END)');
console.log('='.repeat(70));

// 1. Inicia o servidor Back-end HTTP na porta 4173 (127.0.0.1)
const backend = await iniciarServidor({ porta: 4173 });
console.log(`[Back-end API] Rodando em: ${backend.url} (estritamente em 127.0.0.1)`);
console.log(`  - Fichas: ${backend.url}/api/fichas`);

// 2. Inicia o servidor Front-end Vite na porta 5173
const webDir = path.join(rootDir, 'packages', 'web');
const viteCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const viteProcess = spawn(viteCmd, ['vite', '--host', '127.0.0.1', '--port', '5173'], {
  cwd: webDir,
  stdio: 'inherit',
  shell: true,
});

viteProcess.on('error', (err) => {
  console.error('[Front-end Vite] Falha ao iniciar:', err);
});

process.on('SIGINT', async () => {
  console.log('\nEncerrando servidores do StackAtlas...');
  await backend.fechar();
  viteProcess.kill();
  process.exit(0);
});

console.log('='.repeat(70));
console.log('✓ AMBOS OS SERVIDORES ESTÃO ATIVOS!');
console.log('URL LOCAL PARA ACESSO NO NAVEGADOR:');
console.log('👉 http://127.0.0.1:5173');
console.log('='.repeat(70));
