import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { FichaSchema } from '../packages/core/dist/schemas/ficha.js';

const fichaDemonstracao = {
  schemaVersion: 1,
  repo: {
    url: 'https://github.com/stackatlas/stackatlas-platform',
    commit: 'c9f8e7d6a5b4c3d2e1f0123456789abcdef01234',
    branch: 'main',
    visibilidade: 'publico',
  },
  analisadoEm: new Date().toISOString(),
  detector: {
    nome: '@specfy/stack-analyser',
    versao: '1.27.6',
    versaoRegrasProprias: '0.1.0',
  },
  servicos: [
    {
      id: 'supabase',
      nome: 'Supabase',
      categoria: 'backend',
      subcategoria: 'baas',
      confianca: 'certo',
      catalogado: true,
      sinais: [
        { tipo: 'dependencia', valor: '@supabase/supabase-js@2.45.0', arquivo: 'packages/web/package.json' },
        { tipo: 'variavel', valor: 'NEXT_PUBLIC_SUPABASE_URL', arquivo: '.env.example' },
        { tipo: 'configuracao', valor: 'supabase/config.toml', arquivo: 'supabase/config.toml' },
      ],
    },
    {
      id: 'turso',
      nome: 'Turso',
      categoria: 'bancos',
      subcategoria: 'sql',
      confianca: 'certo',
      catalogado: true,
      sinais: [
        { tipo: 'dependencia', valor: '@libsql/client@0.14.0', arquivo: 'packages/core/package.json' },
        { tipo: 'variavel', valor: 'TURSO_DATABASE_URL', arquivo: '.env.example' },
      ],
    },
    {
      id: 'anthropic',
      nome: 'Anthropic',
      categoria: 'ia',
      subcategoria: 'llm',
      confianca: 'certo',
      catalogado: true,
      sinais: [
        { tipo: 'dependencia', valor: '@anthropic-ai/sdk@0.27.0', arquivo: 'packages/core/package.json' },
        { tipo: 'variavel', valor: 'ANTHROPIC_API_KEY', arquivo: '.env.example' },
      ],
    },
    {
      id: 'amazon-ses',
      nome: 'Amazon SES',
      categoria: 'email',
      subcategoria: 'transacional',
      confianca: 'certo',
      catalogado: true,
      sinais: [
        { tipo: 'dependencia', valor: 'aws-sdk@2.1692.0 (obsoleto)', arquivo: 'packages/core/package.json' },
        { tipo: 'variavel', valor: 'AWS_ACCESS_KEY_ID', arquivo: '.env.example' },
        { tipo: 'variavel', valor: 'AWS_SECRET_ACCESS_KEY', arquivo: '.env.example' },
      ],
    },
    {
      id: 'openai',
      nome: 'OpenAI',
      categoria: 'ia',
      subcategoria: 'llm',
      confianca: 'certo',
      catalogado: true,
      sinais: [
        { tipo: 'dependencia', valor: 'openai@4.60.0', arquivo: 'packages/core/package.json' },
        { tipo: 'variavel', valor: 'OPENAI_API_KEY', arquivo: '.env.example' },
      ],
    },
    {
      id: 'resend',
      nome: 'Resend',
      categoria: 'email',
      subcategoria: 'transacional',
      confianca: 'certo',
      catalogado: true,
      sinais: [
        { tipo: 'dependencia', valor: 'resend@4.0.0', arquivo: 'packages/web/package.json' },
        { tipo: 'variavel', valor: 'RESEND_API_KEY', arquivo: '.env.example' },
      ],
    },
    {
      id: 'gemini',
      nome: 'Google Gemini',
      categoria: 'ia',
      subcategoria: 'llm',
      confianca: 'provavel',
      catalogado: true,
      sinais: [
        { tipo: 'dependencia', valor: '@google/generative-ai@0.1.0 (obsoleto)', arquivo: 'packages/core/package.json' },
      ],
    },
    {
      id: 'mongodb',
      nome: 'MongoDB',
      categoria: 'bancos',
      subcategoria: 'nosql-documento',
      confianca: 'provavel',
      catalogado: true,
      sinais: [
        { tipo: 'dependencia', valor: 'mongodb@6.8.0', arquivo: 'packages/core/package.json' },
      ],
    },
    {
      id: 'upstash',
      nome: 'Upstash',
      categoria: 'bancos',
      subcategoria: 'serverless-cache',
      confianca: 'provavel',
      catalogado: true,
      sinais: [
        { tipo: 'dependencia', valor: '@upstash/redis@1.34.0', arquivo: 'packages/core/package.json' },
      ],
    },
  ],
  variaveis: [
    {
      nome: 'NEXT_PUBLIC_SUPABASE_URL',
      idServico: 'supabase',
      arquivo: '.env.example',
      obrigatoria: true,
      descricao: 'URL pública da instância do Supabase',
    },
    {
      nome: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      idServico: 'supabase',
      arquivo: '.env.example',
      obrigatoria: true,
      descricao: 'Chave anônima para requisições frontend',
    },
    {
      nome: 'SUPABASE_SERVICE_ROLE_KEY',
      idServico: 'supabase',
      arquivo: '.env.example',
      obrigatoria: false,
      descricao: 'Chave com privilégios administrativos no backend',
    },
    {
      nome: 'TURSO_DATABASE_URL',
      idServico: 'turso',
      arquivo: '.env.example',
      obrigatoria: true,
      descricao: 'URL do banco de dados Turso LibSQL',
    },
    {
      nome: 'ANTHROPIC_API_KEY',
      idServico: 'anthropic',
      arquivo: '.env.example',
      obrigatoria: true,
      descricao: 'Chave de acesso à API dos modelos Claude',
    },
    {
      nome: 'AWS_ACCESS_KEY_ID',
      idServico: 'amazon-ses',
      arquivo: '.env.example',
      obrigatoria: true,
      descricao: 'Credencial AWS para envio de e-mails via SES',
    },
    {
      nome: 'AWS_SECRET_ACCESS_KEY',
      idServico: 'amazon-ses',
      arquivo: '.env.example',
      obrigatoria: true,
      descricao: 'Segredo de autenticação AWS',
    },
  ],
  conexoes: [
    { de: 'Projeto Principal', para: 'Supabase', rotulo: 'BACKEND' },
    { de: 'Projeto Principal', para: 'Turso', rotulo: 'BANCO' },
    { de: 'Projeto Principal', para: 'Anthropic', rotulo: 'IA' },
    { de: 'Projeto Principal', para: 'Amazon SES', rotulo: 'OBSOLETO' },
  ],
  naoIdentificados: [
    { sinal: 'React 19', arquivo: 'packages/web/package.json', motivo: 'Biblioteca frontend principal' },
    { sinal: 'Vite 6', arquivo: 'packages/web/package.json', motivo: 'Bundler e servidor de desenvolvimento' },
    { sinal: 'TypeScript 5.8', arquivo: 'package.json', motivo: 'Compilador e tipagem estática' },
    { sinal: 'TailwindCSS 3', arquivo: 'packages/web/package.json', motivo: 'Framework utilitário de CSS' },
  ],
  modulosInternos: 4,
  alertas: [
    {
      tipo: 'obsoleto',
      servico: 'amazon-ses',
      mensagem: "Usa pacote descontinuado 'aws-sdk' (descontinuado em 2025-09-08). Migre para '@aws-sdk/client-ses'.",
    },
    {
      tipo: 'obsoleto',
      servico: 'gemini',
      mensagem: "Usa pacote obsoleto '@google/generative-ai'. O novo pacote oficial é '@google/genai'.",
    },
  ],
};

// Validação com Zod Schema
const validado = FichaSchema.parse(fichaDemonstracao);

const fichasDir = path.join(os.homedir(), '.stackatlas', 'fichas');
if (!fs.existsSync(fichasDir)) {
  fs.mkdirSync(fichasDir, { recursive: true });
}

const arquivoAlvo = path.join(fichasDir, 'stackatlas__stackatlas-platform__c9f8e7d.json');
fs.writeFileSync(arquivoAlvo, JSON.stringify(validado, null, 2), 'utf8');

console.log('✓ Ficha rica de demonstração gravada com sucesso em:');
console.log(arquivoAlvo);
console.log(`- Total de serviços: ${validado.servicos.length}`);
console.log(`- Total de alertas de obsolescência: ${validado.alertas.length}`);
console.log(`- Total de variáveis documentadas: ${validado.variaveis.length}`);
