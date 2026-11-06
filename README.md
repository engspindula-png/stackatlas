# StackAtlas

> **Inventário local, privacidade absoluta e mapa de arquitetura interativo para seus projetos.**

[![Licença MIT](https://img.shields.io/badge/licença-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.8-blue.svg)](https://www.typescriptlang.org)

O **StackAtlas** é uma ferramenta de código aberto executada 100% no seu computador (sem nuvem, sem login, sem telemetria). Ele analisa repositórios públicos ou privados, identifica os serviços externos e provedores em nuvem utilizados (bancos, autenticação, pagamentos, e-mails, IA, etc.), gera uma ficha estruturada e projeta um **mapa interativo em 4 camadas**.

Além da visualização humana, o StackAtlas atua como uma **camada de contexto e proteção para IAs de programação** (Claude Code, Cursor, Copilot, etc.), gerando regras estritas (`CLAUDE.md` / `AGENTS.md`) para reaproveitamento de stack homologada e blindagem contra pacotes obsoletos.

---

## 🌟 Principais Recursos

### 1. Mapa de Arquitetura Interativo em 4 Camadas
- **Camada 1 (Visão Geral):** Projeto no centro cercado por serviços externos com ícones oficiais e cores da marca (`simple-icons`). Setas contínuas indicam confiança alta (`certo`), setas tracejadas indicam `provável`. Agrupamento inteligente para no máximo 6 a 8 nós (com nó "Módulos Internos").
- **Regra de Ouro de Obsolescência:** Pacotes descontinuados pelo fornecedor (ex: `aws-sdk v2`, `@google/generative-ai`) geram setas vermelhas de alerta e **nunca** são escondidos pelo agrupamento.
- **Camada 2 (Foco no Serviço):** Ao clicar em um nó, o painel lateral detalha as variáveis de ambiente necessárias (com badges `Obrigatória` e `Opcional`), link oficial de cadastro no dashboard do fornecedor e alertas de depreciação com data de descontinuação.
- **Camada 3 (Módulos Internos):** Ao clicar no nó de agrupamento, detalha pacotes, bibliotecas e tecnologias particionadas por subgrupos em monorepos (ex: `packages/core`, `packages/web`).
- **Camada 4 (Explicação das Conexões):** Ao clicar em qualquer seta conectora, exibe um card flutuante com a finalidade da conexão em uma única frase simples, sem código.

### 2. Camada para IA de Programação (`CLAUDE.md`)
- Gera arquivos ultracompactos de contexto para agentes de IA sem sobrecarregar a janela de tokens.
- **Consulta Sob Demanda:** Instrução rígida para a IA ler apenas o YAML individual de cada serviço (`catalog/<categoria>/<servico>.yaml`) conforme a necessidade de implementação.
- **Stack Homologada (`meu-stack.json`):** Garante que a IA priorize ferramentas já validadas pelo usuário antes de propor novas bibliotecas.
- **Proteção Contra Obsolescência:** Proibição estrita de sugerir dependências presentes na lista `dependenciasObsoletas` do catálogo.
- **Padronização de `.env.example`:** Exige que a IA utilize a nomenclatura exata de variáveis definida no catálogo.

### 3. Privacidade e Zero-Secret Scanning
- **Nenhum valor de variável é salvo:** O detector lê apenas os nomes das chaves em `.env.example`, `.env.sample` e `.env.template`.
- Servidor HTTP local estritamente vinculado a `127.0.0.1`.
- Mascaramento rigoroso de tokens em caso de falha de clone de repositórios privados.
- O código-fonte dos repositórios analisados nunca é instalado ou executado e é apagado imediatamente após a análise.

---

## 📋 Pré-requisitos

- **Node.js:** Versão 20.0.0 ou superior.
- **Git:** Instalado e configurado no PATH do sistema.

---

## 🚀 Instalação e Configuração

Clone o repositório e instale as dependências usando os workspaces do npm:

```bash
git clone https://github.com/stackatlas/stackatlas.git
cd stackatlas

# Instala dependências de todos os pacotes (packages/core e packages/web)
npm install

# Compila o projeto TypeScript
npm run build
```

---

## 💻 Uso da Linha de Comando (CLI)

O executável da CLI pode ser utilizado diretamente através do pacote `@stackatlas/core`:

### 1. Analisar Repositório Público

Você pode analisar pastas locais ou repositórios remotos do GitHub:

```bash
# Analisando uma pasta local
node packages/core/dist/packages/core/src/cli.js analisar fixtures/nextjs-subscription-payments

# Analisando um repositório público remoto
node packages/core/dist/packages/core/src/cli.js analisar https://github.com/vercel/nextjs-subscription-payments
```

A análise gera uma ficha JSON versionada e validada por schema em `~/.stackatlas/fichas/<dono>__<repo>__<commit>.json`.

### 2. Analisar Repositório Privado (com `GITHUB_TOKEN`)

Para analisar repositórios privados dos quais você possui acesso, defina a variável de ambiente `GITHUB_TOKEN`:

```bash
# Linux / macOS
export GITHUB_TOKEN="ghp_seu_token_aqui"
node packages/core/dist/packages/core/src/cli.js analisar https://github.com/seu-usuario/seu-repo-privado

# Windows (PowerShell)
$env:GITHUB_TOKEN="ghp_seu_token_aqui"
node packages/core/dist/packages/core/src/cli.js analisar https://github.com/seu-usuario/seu-repo-privado
```

> **Garantia de Segurança:** Caso o clone falhe ou o repositório não exista, o token é automaticamente substituído por `***` antes de qualquer saída de erro no terminal. O token nunca é salvo na ficha.

### 3. Exportar Contexto e Regras de Sistema para IA (`CLAUDE.md`)

Gera o arquivo de contexto ultracompacto para agentes de IA na raiz do repositório analisado:

```bash
node packages/core/dist/packages/core/src/cli.js exportar-ia fixtures/nextjs-subscription-payments
```

Você também pode especificar um caminho de saída personalizado com `--saida`:

```bash
node packages/core/dist/packages/core/src/cli.js exportar-ia fixtures/nextjs-subscription-payments --saida ./meu-projeto/CLAUDE.md
```

### 4. Iniciar a Interface Web Completa

Para abrir o mapa visual interativo e executar os testes de conexão:

```bash
# Inicia o backend (127.0.0.1:4173) e o frontend Vite (127.0.0.1:5173) em paralelo
npm run dev
```

Abra o seu navegador em: **`http://127.0.0.1:5173`**

---

## 📦 Catálogo de Serviços Suportados (33 Serviços)

O catálogo oficial é estruturado em arquivos YAML individuais na pasta `catalog/`, todos validados por schema Zod:

| Categoria | Serviços Catalogados |
| :--- | :--- |
| **Bancos de Dados** | Supabase, Turso (LibSQL), Neon (Postgres Serverless), MongoDB, Upstash (Redis), Cloudflare D1 |
| **Backend / BaaS** | Convex, Firebase, Appwrite, PocketBase |
| **Inteligência Artificial** | Anthropic (Claude), OpenAI, Google Gemini, OpenRouter, Vercel AI SDK, Hugging Face, Together AI |
| **E-mail Transacional** | Resend, SendGrid, Postmark, Mailgun, Amazon SES, SMTP Genérico |
| **Hospedagem & Edge** | Vercel, Netlify, Cloudflare Pages |
| **Autenticação** | Auth0, Clerk |
| **Pagamentos** | Stripe, Mercado Pago, PayPal |
| **Armazenamento de Arquivos** | Amazon S3, Cloudflare R2 |

Para validar todos os arquivos do catálogo automaticamente:

```bash
npm run test:catalogo
```

---

## 🧪 Estrutura do Monorepo

```text
stackatlas/
├── catalog/                # Catálogo oficial em YAML (33 serviços em 7 categorias)
├── schemas/                # Schemas de validação Zod (ficha, catálogo, estado)
├── packages/
│   ├── core/               # Motor de análise, download, matcher, CLI e API local
│   └── web/                # Interface SPA em React + Vite com renderização SVG
├── fixtures/               # Gabaritos e repositórios de teste
├── scripts/                # Scripts de teste automatizado e pipeline de validação
├── LICENSE                 # Licença MIT
└── README.md               # Esta documentação
```

---

## 🛡️ Licença

Este projeto é distribuído sob a licença **MIT**. Consulte o arquivo [LICENSE](LICENSE) para obter mais informações.
