# SPEC: StackAtlas (nome provisório)

Especificação para construir a v1. Escrita para ser lida pelo Claude Code, sem depender de outros documentos. Atualizada em 05/11/2026.

## 1. Objetivo

Ferramenta local e de código aberto que lê um repositório do GitHub, identifica os serviços externos que ele usa, gera inventário e guia de instalação, testa conexões (somente leitura) e desenha um mapa visual por camadas. Serve para os projetos do próprio usuário e para qualquer repositório público.

## 2. Decisões fechadas

- **Linguagem:** TypeScript sobre Node.js 20 ou superior.
- **Licença:** MIT, a mesma do detector que será reaproveitado.
- **Execução:** comando de terminal (`npx stackatlas`) que sobe um servidor apenas em `127.0.0.1` e abre a interface no navegador. Nada fica hospedado.
- **Detecção:** reaproveitar o `@specfy/stack-analyser` (MIT, mais de 700 tecnologias) e acrescentar uma camada própria. Confirmado no README dele: a saída traz tecnologias, dependências com versão, ligações e linguagens, mas **não traz variáveis de ambiente**. Essa parte é nossa.
- **Entrada:** URL de repositório público do GitHub ou pasta local.
- **Repositórios privados:** só do dono, com token do próprio usuário. A ficha é marcada como privada e nunca é exportada por padrão.
- **Dados:** tudo numa pasta local (`~/.stackatlas`). Sem servidor, sem conta, sem telemetria. Fichas de terceiros ficam só no computador de cada pessoa.
- **Arquitetura:** núcleo e interface separados. O núcleo gera JSON versionado, que é o contrato público. Um cliente Android futuro consome o mesmo JSON.
- **Ícones:** pacote `simple-icons` embutido localmente, sem CDN. A coletânea é CC0, mas cada ícone tem licença e diretrizes de marca próprias, que o pacote informa.
- **Nome:** provisório. Conferir disponibilidade no GitHub e no npm antes de publicar.

## 3. Estrutura do repositório

- `packages/core`: análise, catálogo, testes de conexão, geração da ficha.
- `packages/web`: interface local (mapa, painel lateral, lista).
- `catalog/<categoria>/<servico>.yaml`: um arquivo por serviço.
- `schemas/`: JSON Schema da ficha, do estado local e da entrada do catálogo.
- `fixtures/`: gabarito de repositórios e respostas esperadas.
- `docs/`: guia de contribuição, política de segurança e aviso de marcas.

Usar npm workspaces. Fixar a versão exata do `@specfy/stack-analyser`, porque as regras de dados dele mudam entre versões menores.

## 4. Fluxo de análise

1. Recebe a URL ou a pasta.
2. Se for URL, baixa o arquivo compactado do repositório numa pasta temporária (uma requisição à API do GitHub) e registra o hash do commit. Limites da API: 60 requisições por hora sem token (por IP) e 5.000 com token. Como a análise usa uma requisição por repositório, o limite sem token já permite cerca de 60 análises por hora.
3. Roda o detector sobre a pasta e coleta tecnologias, dependências e ligações.
4. Camada própria: lê `.env.example`, `.env.sample` e `.env.template` (nunca `.env` de repositório de terceiros), arquivos de configuração (`firebase.json`, `wrangler.toml`, `wrangler.jsonc`, `google-services.json` e os demais listados no catálogo) e procura hosts e URLs conhecidos pelos padrões do catálogo.
5. Cruza tudo com o catálogo e atribui confiança.
6. Grava a ficha, apaga a pasta temporária e nunca guarda código.
7. Entrega o resultado à interface.

Em pasta local do próprio usuário, o `.env` real só é lido em memória, para os testes de existência e de conexão.

## 5. Formatos de arquivo

### 5.1 Ficha (um arquivo por repositório e commit)

Caminho: `~/.stackatlas/fichas/<dono>__<repo>__<commit curto>.json`. Campos:

- `schemaVersion`: número, começa em 1.
- `repo`: url, commit, branch, visibilidade (`publico` ou `privado`).
- `analisadoEm`: data e hora ISO.
- `detector`: nome, versão e versão das regras próprias.
- `servicos`: lista com id do catálogo (ou nulo), nome, categoria, subcategoria, `confianca` (`certo` ou `provavel`), `catalogado` (verdadeiro ou falso) e `sinais` (tipo: `configuracao`, `dependencia`, `variavel` ou `host`; valor; arquivo de origem).
- `variaveis`: nome, id do serviço, arquivo, obrigatória (verdadeiro, falso ou nulo) e descrição curta. **Nunca o valor.**
- `conexoes` (opcional): de, para e rótulo curto.
- `naoIdentificados`: sinal, arquivo e motivo.
- `modulosInternos`: quantidade agrupada.
- `alertas`: tipo (`obsoleto`, `local` ou `duplicado`), serviço e mensagem.

### 5.2 Estado local

Caminho: `~/.stackatlas/estado/<mesma chave da ficha>.json`. Guarda, por serviço: nível do teste (1 a 3), resultado (`ok`, `chave_invalida`, `sem_permissao`, `limite`, `sem_alcance`, `nao_testado` ou `erro`), data do teste e um detalhe curto sem segredos. Nunca copia chaves. Fica separado da ficha porque depende do ambiente de cada pessoa.

### 5.3 Entrada do catálogo

Caminho: `catalog/<categoria>/<servico>.yaml`. Campos:

- `id`, `nome`, `categoria`, `subcategoria`, `site`, `cadastro` (link) e `icone` (slug do simple-icons).
- `sinais`: `configuracao` (arquivos), `dependencias` (pacotes atuais), `dependenciasObsoletas` (nome e data de descontinuação), `variaveis` (nomes ou prefixos), `hosts` (padrões) e `chaves` (prefixos de formato conhecido).
- `teste`: por nível, método, URL, domínios permitidos e regra de sucesso.
- `alternativas`: ids de serviços equivalentes.
- `verificadoEm` (data) e `fontes` (links da documentação oficial).

### 5.4 Meu stack

Caminho: `~/.stackatlas/meu-stack.json`. Contas e preferências da pessoa. Privado, nunca exportado, nunca no catálogo público.

## 6. Detecção e confiança

1. Ordem de força dos sinais: arquivo de configuração, dependência, nome de variável, host.
2. **Certo** exige dois sinais independentes de tipos diferentes. Um só vira **provável**.
3. Dependência sozinha pode estar sem uso, então não basta para “certo”.
4. `file:`, `localhost` e `127.0.0.1` registram banco local, nunca o serviço em nuvem.
5. Um pacote compatível com vários serviços (como `openai` com outro endereço, ou `nodemailer`) não prova o serviço. Decide o endereço base ou o host.
6. Variável genérica (`DATABASE_URL`) só conta junto com host reconhecido. Em `.env.example` o host costuma ser fictício, então o resultado é provável.
7. Sinal desconhecido com padrão genérico (por exemplo `*_DATABASE_URL`) vira serviço não catalogado da categoria correspondente, com confiança provável.
8. Sinal que não pôde ser classificado vai para `naoIdentificados`. Nada é descartado em silêncio.
9. Pacote presente em `dependenciasObsoletas` gera alerta de obsolescência com a data.

## 7. Testes de conexão

### 7.1 Níveis

1. **Existência:** a variável está preenchida (sem enviar nada a ninguém).
2. **Alcance:** o domínio do serviço responde.
3. **Autenticação:** uma chamada de leitura leve confirma que a chave é válida.

O nível 4 (escrita e leitura reais) fica fora da v1.

### 7.2 Regras de segurança dos testes

- Somente leitura. Proibido criar, alterar ou apagar qualquer coisa no serviço.
- Só domínios declarados na entrada do catálogo. Recusar redirecionamento para outro domínio.
- Chaves só em memória. Nunca em log, ficha, estado, URL de consulta ou mensagem de erro.
- Tempo limite de 10 segundos, sem repetição automática.
- Nenhum teste roda sozinho: só quando a pessoa clica.
- Interpretação: 200 é ok; 401 é chave inválida; 403 é sem permissão; 429 é limite; falha de rede ou DNS é sem alcance.

### 7.3 Endpoints de autenticação (nível 3)

Confirmados na documentação oficial (✓):

- **Anthropic ✓:** `GET https://api.anthropic.com/v1/models` com os cabeçalhos `x-api-key` e `anthropic-version: 2023-06-01`. Só lista modelos.
- **OpenRouter ✓:** `GET https://openrouter.ai/api/v1/key` com `Authorization: Bearer`. Devolve o limite e os créditos restantes da chave, que a interface pode mostrar.
- **SendGrid ✓:** `GET https://api.sendgrid.com/v3/scopes` com `Authorization: Bearer` (regiões da UE: `api.eu.sendgrid.com`).

A confirmar na documentação oficial antes de implementar (\~): OpenAI (listagem de modelos), Gemini (listagem de modelos com a chave), Resend (listagem de domínios), Postmark (consulta do servidor com o token), Supabase (requisição de leitura na URL do projeto com a chave), Turso (consulta somente leitura pela API HTTP). Neon e MongoDB precisam de driver, então na v1 ficam só com os níveis 1 e 2.

Regra: cada teste é um dado do catálogo, com teste automatizado que valida o formato. Um endpoint marcado \~ só passa a ✓ depois de conferido na fonte oficial e registrado em `fontes`.

## 8. Segurança e privacidade (promessas que o código deve cumprir)

1. Valores de variáveis nunca são gravados, enviados ou exibidos por inteiro (mascarar na tela).
2. O servidor local escuta só em `127.0.0.1`.
3. Nenhuma telemetria e nenhuma chamada a domínios fora da lista permitida do catálogo e da API do GitHub.
4. Código de repositórios analisados nunca é executado, nem instalado, nem guardado depois da análise.
5. Teste automático de segurança: varrer todos os arquivos gravados e falhar se algum valor de variável aparecer.
6. O token do GitHub é lido de variável de ambiente ou de campo da interface, nunca gravado em arquivo da ficha.
7. Fichas privadas ficam fora de qualquer exportação por padrão.

## 9. Interface

**Camada 1, visão geral:** projeto no centro, serviços externos ao redor com ícone oficial e cor por categoria, setas com rótulo curto. No máximo 6 a 8 nós visíveis; o excedente vira agrupamento. Serviços de confiança provável aparecem com seta tracejada.

**Camada 2, ao clicar em um nó:** painel lateral (gaveta no celular) com o uso do serviço, nomes das variáveis, resultado e data do último teste, alerta de obsolescência e link de cadastro.

**Camada 3, ao expandir um grupo:** quais pastas e pacotes usam cada serviço. Em monorepo, cada pacote vira um subgrupo.

**Camada 4, ao clicar em uma seta:** descrição em uma frase, sem código.

**Regras:** o alerta nunca é escondido pelo agrupamento (seta vermelha continua visível). O rodapé mostra a data da análise e o hash do commit e avisa quando o repositório mudou. Modo claro e escuro. Navegação por teclado.

**Ícones:** vêm do pacote `simple-icons`, servidos localmente. Guardar o link de diretrizes de cada marca e mostrar um aviso de marcas na tela “Sobre”. Quando não houver ícone, usar um ícone genérico da categoria.

## 10. Catálogo e contribuição

- Categorias iniciais: bancos (motores), backend pronto e banco na nuvem, e-mail, IA. Já pesquisadas para entrar depois: hospedagem, autenticação, pagamentos e armazenamento.
- Um YAML por serviço, validado por JSON Schema em teste automático e na integração contínua.
- Cada entrada tem `verificadoEm` e `fontes`.
- **Segurança do catálogo:** como o conteúdo vira referência para IA de programação, as entradas aceitam só campos estruturados, sem texto livre de instrução. Nomes de pacote são validados contra o registro oficial para evitar pacotes com nome parecido. Toda contribuição passa por revisão.
- O catálogo pode devolver regras novas ao `specfy/stack-analyser`.

## 11. Camada para IA de programação (fase posterior)

- Gera um arquivo compacto de instruções (`AGENTS.md` ou `CLAUDE.md`) com índice e carrega cada serviço sob demanda, sem despejar o catálogo inteiro.
- A IA consulta o catálogo antes de escolher a stack, reaproveita os serviços já presentes em `meu-stack.json`, gera `.env.example` com os nomes certos e usa o pacote atual, não o obsoleto.
- Caminho de evolução: arquivos no repositório, depois skill, depois servidor MCP.

## 12. Gabarito e critérios de aceite

**Gabarito:** 15 repositórios com resposta esperada em `fixtures/<repo>/esperado.json`. Composição mínima: os projetos do próprio usuário (Vercel com Turso e PHP; Firebase com MongoDB); pelo menos um monorepo; um sem `.env.example`; um com serviço não catalogado; um com SDK obsoleto; pelo menos dois por categoria da v1.

**Métricas:**

- Cobertura de pelo menos 85% dos serviços esperados.
- Precisão de pelo menos 95% entre os marcados como “certo”.
- Zero casos de banco local classificado como serviço em nuvem.
- Teste de segurança do item 8.5 passando.

**Spike (primeira tarefa):** rodar o detector nos 3 repositórios do usuário e registrar o que ele acha e o que não acha. Se achar pelo menos 70% dos serviços esperados como tecnologias, seguir com ele. Se não, avaliar o `tech-stack-analyzer` (Go, mais de 800 regras) ou ampliar as regras próprias.

## 13. Fases e tarefas

**Fase 0, spike de viabilidade:** o item acima.

**Fase 1, fatia ponta a ponta com 3 serviços (Turso, Supabase e Anthropic):**

1. Esqueleto do repositório, workspaces e JSON Schemas.
2. Download do repositório e registro do commit.
3. Integração com o detector.
4. Leitor de `.env.example` e de arquivos de configuração.
5. Catálogo dos 3 serviços.
6. Cruzamento com o catálogo, confiança e alertas.
7. Gravação da ficha.
8. Comando de terminal e servidor local.
9. Tela com lista de serviços e painel lateral.
10. Testes de nível 1 e 2.
11. Teste de nível 3 da Anthropic.
12. Mapa simples (camada 1).
13. Gabarito mínimo com 3 repositórios.

**Fase 2:** catálogo completo de backend, e-mail e IA, com os sinais já levantados.

**Fase 3:** mapa completo (camadas 2 a 4), agrupamento e alertas de obsolescência.

**Fase 4:** camada para IA de programação.

**Fase 5:** repositórios privados, outras categorias do catálogo, cliente Android e versão web, se fizer sentido.

## 14. Riscos

- O detector não extrai variáveis de ambiente (confirmado). A camada própria cresce o escopo e precisa de gabarito para ser confiável.
- As regras do detector mudam entre versões. Fixar a versão exata e testar antes de atualizar.
- Limite da API do GitHub: documentar o uso de token.
- Marcas e ícones: ler as diretrizes de cada marca e manter o aviso.
- Catálogo aberto como porta de entrada para pacotes falsos: revisão e validação de pacotes são obrigatórias.
- Escopo: terminar a fase 1 antes de qualquer outra.

## 15. Pendências do usuário

1. Nome definitivo do projeto (provisório: StackAtlas).
2. URLs dos seus repositórios para o gabarito.
3. Token de leitura do GitHub, opcional, criado por você e nunca colado em conversa.

## 16. Atualização após a Fase 0 (06/11/2026)

**Esta seção prevalece sobre as anteriores quando houver conflito, em especial sobre as seções 4, 6, 11, 12 e 13.**

### 16.1 O que foi testado

Quatro repositórios reais e públicos, baixados com clone raso (nada foi instalado nem executado). O gabarito foi escrito antes da execução, a partir do README e do `.env.example` de cada um, e salvo em `gabarito-projetos-reais.json`.

- `vercel/nextjs-subscription-payments`: Supabase e Stripe.
- `openstatusHQ/openstatus`: monorepo com Turso, Resend e Tinybird.
- `shadcn-ui/taxonomy`: Postmark, Stripe, Prisma e PlanetScale.
- `mongodb-developer/nextjs-template-mongodb`: MongoDB.

### 16.2 Resultado

- Cobertura geral de **83,3%** (25 de 30 itens esperados), acima da meta de 70%. Por projeto: 57,1%, 87,5%, 88,9% e 100%.
- **Decisão:** seguir com o `@specfy/stack-analyser` 1.27.6.
- Recontagem separada: tecnologias gerais (Next.js, React, TypeScript, Node, Tailwind, Docker) 19 de 21; **serviços 6 de 9 (67%)**, ou 7 de 9 (78%) se `libsql` for contado como Turso (Prisma excluído por ser biblioteca). A nota geral é inflada pelas tecnologias fáceis, e o que importa ao produto é a cobertura de serviços.

### 16.3 Achados

1. O detector **ignora `package.json` sem o campo `name`** (comum em projetos privados). No projeto 1 isso fez sumir Stripe, Next.js e React.
2. O Turso apareceu como `libsql`, porque a regra do detector procura só `@tursodatabase/api`, enquanto projetos reais usam `@libsql/client`.
3. O PlanetScale não apareceu: o código usa só uma conexão MySQL genérica via Prisma, sem pacote próprio.
4. O detector continua **não extraindo variáveis de ambiente**.
5. A **precisão não foi medida**: o que o detector achou além do gabarito foi contado como diferença, sem verificar se estava correto.

### 16.4 Mudanças na especificação

- **A. Manifestos próprios.** A camada própria lê diretamente todos os arquivos de dependências (`package.json`, mesmo sem `name`, `requirements.txt`, `composer.json` e equivalentes) e cruza os pacotes com o catálogo. O detector passa a fornecer cobertura ampla de tecnologias, linguagens e infraestrutura. A decisão sobre quais serviços o projeto usa vem do catálogo.
- **B. Métricas separadas.** Serviços e tecnologias gerais são reportados à parte. Metas: cobertura de serviços de pelo menos 85% e precisão de pelo menos 95% entre os marcados “certo”.
- **C. Turso e libsql.** O catálogo mapeia `libsql` para Turso. Sem variável `TURSO_*` ou host `turso.io`, o resultado é **provável**; com um deles, **certo**.
- **D. Serviço sem pacote próprio.** Detectar por host em `.env.example` ou arquivo de configuração. Sem host, registrar “banco MySQL genérico” e **não inventar** o serviço.
- **E. Medir precisão.** Cada detecção registra o arquivo e o sinal que a gerou. Em cada rodada de teste, revisar manualmente uma amostra (por exemplo 10 detecções fora do gabarito) e anotar quantas estavam corretas.
- **F. Gabarito.** Os 4 repositórios acima e o `gabarito-projetos-reais.json` são os 4 primeiros dos 15 itens de `fixtures/`.
- **G. Cuidado com o `flatten`.** A função exige o objeto original em memória. Passar o resultado já convertido em JSON gera o erro `pl.copy is not a function`.

### 16.5 Fase 1, tarefas revisadas

1. Esqueleto do repositório, workspaces, JSON Schemas e controle de versão com `git`.
2. Download do repositório (clone raso ou arquivo compactado) e registro do commit.
3. Integração com o detector **e** leitor próprio de manifestos (mudança A).
4. Leitor de `.env.example` e de arquivos de configuração.
5. Catálogo dos 3 serviços (Turso, Supabase, Anthropic), incluindo o mapeamento `libsql` para Turso.
6. Cruzamento com o catálogo, confiança e alertas.
7. Gravação da ficha.
8. Comando de terminal e servidor local.
9. Tela com lista de serviços e painel lateral.
10. Testes de nível 1 e 2.
11. Teste de nível 3 da Anthropic.
12. Mapa simples (camada 1).
13. Gabarito: rodar os 4 repositórios reais e medir cobertura de serviços e precisão (mudanças B e E).
