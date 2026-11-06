# Relatório da Fase 0 (Teste de Viabilidade com Repositórios Reais)

Data: 06/11/2026  
Detector avaliado: `@specfy/stack-analyser` (v1.27.6)  
Critério de aprovação do SPEC.md: pelo menos 70% de cobertura das tecnologias esperadas.

---

## 1. Repositórios Reais Selecionados e Motivos

1. **`vercel/nextjs-subscription-payments`**
   - **Tipo:** Projeto único (Next.js)
   - **Por que foi escolhido:** É o projeto oficial e mais popular da Vercel (+10k stars) para integração de Supabase (Auth e Banco de Dados Postgres) com Stripe.
2. **`openstatusHQ/openstatus`**
   - **Tipo:** Monorepo (Turborepo com vários pacotes e apps: `apps/web`, `apps/dashboard`, `packages/db`, etc.)
   - **Por que foi escolhido:** Atende à exigência de testar um monorepo real. Utiliza Turso (banco libSQL), Resend (e-mails), Tinybird e Next.js.
3. **`shadcn-ui/taxonomy`**
   - **Tipo:** Projeto único (Next.js App Router)
   - **Por que foi escolhido:** Aplicação de referência open-source (+18k stars) do criador do shadcn/ui. Usa Postmark (e-mails), Stripe, Prisma e PlanetScale.
4. **`mongodb-developer/nextjs-template-mongodb`**
   - **Tipo:** Projeto único (Next.js)
   - **Por que foi escolhido:** Template oficial da equipe de desenvolvedores da MongoDB para Next.js com o driver nativo oficial e MongoDB Atlas.

---

## 2. Tabelas de Resultados por Projeto

### Projeto 1: Next.js Subscription Payments (Vercel)
- **Esperado pelo gabarito (7):** `supabase`, `stripe`, `nextjs`, `react`, `tailwindcss`, `typescript`, `nodejs`
- **Taxa de acerto:** 57,1% (4 de 7)

| O que acertou | O que não apareceu | O que errou / Outras detectadas |
| :--- | :--- | :--- |
| `supabase`, `tailwindcss`, `typescript`, `nodejs` | `stripe`, `nextjs`, `react` | `shadcn`, `prettier`, `pnpm`, `javascript`, `jsx`, `css` |

> **Descoberta técnica importante:** O `package.json` deste projeto oficial da Vercel tem `"private": true`, mas **não tem o campo `"name"`**. A regra interna do `@specfy/stack-analyser` (`detectNodeComponent`) exige `if (!json.name) continue;`. Por isso, o analisador ignorou completamente a leitura das dependências do `package.json`! Essa é uma limitação do detector externo que nós teremos que contornar na nossa camada própria na Fase 1.

---

### Projeto 2: OpenStatus (Monorepo)
- **Esperado pelo gabarito (8):** `turso`, `resend`, `tinybird`, `nextjs`, `react`, `docker`, `typescript`, `nodejs`
- **Taxa de acerto:** 87,5% (7 de 8)

| O que acertou | O que não apareceu | O que errou / Outras detectadas |
| :--- | :--- | :--- |
| `resend`, `tinybird`, `nextjs`, `react`, `docker`, `typescript`, `nodejs` | `turso` *(detectou como `libsql`)* | `libsql`, `turborepo`, `drizzleorm`, `upstash`, `redis`, `stripe`, `anthropic`, `aws`, `gcp`, `sentry`, `slack`, `zod`, `radixui`, etc. |

> **Descoberta sobre o Turso:** O detector tem uma regra para `tursodb` que só procura pelo pacote `@tursodatabase/api`. No entanto, projetos reais modernos com Turso (como o OpenStatus) usam o cliente `@libsql/client`. O detector achou o `@libsql/client` e o classificou como tecnologia `libsql`. Na nossa camada de catálogo, vamos mapear `libsql` e `tursodb` como equivalentes/sinônimos.

---

### Projeto 3: Taxonomy (shadcn)
- **Esperado pelo gabarito (9):** `postmark`, `stripe`, `prisma`, `planetscale`, `nextjs`, `react`, `tailwindcss`, `typescript`, `nodejs`
- **Taxa de acerto:** 88,9% (8 de 9)

| O que acertou | O que não apareceu | O que errou / Outras detectadas |
| :--- | :--- | :--- |
| `postmark`, `stripe`, `prisma`, `nextjs`, `react`, `tailwindcss`, `typescript`, `nodejs` | `planetscale` | `vercel`, `vercel.analytics`, `vercel.functions`, `radixui`, `lucideicons`, `zod`, `eslint`, `prettier` |

> **Descoberta sobre o PlanetScale:** O repositório cita PlanetScale na documentação, mas no código usa apenas Prisma com driver genérico de MySQL (`mysql://`). Como o pacote `@planetscale/database` não foi instalado, o detector não tinha como adivinhar que o MySQL rodava no PlanetScale sem ler texto livre.

---

### Projeto 4: Next.js with MongoDB (MongoDB Developer)
- **Esperado pelo gabarito (6):** `mongodb`, `nextjs`, `react`, `tailwindcss`, `typescript`, `nodejs`
- **Taxa de acerto:** 100,0% (6 de 6)

| O que acertou | O que não apareceu | O que errou / Outras detectadas |
| :--- | :--- | :--- |
| `mongodb`, `nextjs`, `react`, `tailwindcss`, `typescript`, `nodejs` | *(nenhum)* | `radixui`, `lucideicons`, `playwright`, `github`, `eslint`, `npm` |

---

## 3. Comportamento com Variáveis de Ambiente (`.env`)

Conforme exigido pelo SPEC.md e confirmado no teste:
- O `@specfy/stack-analyser` **NÃO extrai variáveis de ambiente** no seu resultado JSON.
- Nenhuma chave ou valor de `.env` foi exibido ou exposto.
- Isso confirma que a extração segura de variáveis a partir do `.env.example` precisa ser implementada pela nossa própria ferramenta na Fase 1.

---

## 4. Resumo Geral de Viabilidade

- **Total de tecnologias esperadas no gabarito:** 30
- **Total de acertos do detector:** 25
- **Taxa geral de cobertura:** **83,3%**
- **Meta do SPEC.md:** 70%
- **Resultado:** **APROVADO (Viável para a Fase 1)**
