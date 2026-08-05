# Gym Mobile
### Melhor, o GymFlow

Aplicação web mobile-first para organizar rotinas de academia. O usuário cria uma conta, configura o perfil, consulta ou cadastra exercícios, monta treinos por dia da semana e acompanha a agenda em uma interface pensada para celular.

> **Estado atual:** este repositório contém a fundação e o núcleo de planejamento do produto. O registro de séries durante o treino, histórico, gráficos reais, cronômetro, notificações e funcionamento offline ainda não foram implementados. Consulte [Funcionalidades e limitações](#funcionalidades-e-limitações).

## Sumário

- [O que a aplicação faz](#o-que-a-aplicação-faz)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Rotas e fluxos](#rotas-e-fluxos)
- [Modelo de dados e segurança](#modelo-de-dados-e-segurança)
- [Pré-requisitos](#pré-requisitos)
- [Configuração rápida com um projeto Supabase remoto](#configuração-rápida-com-um-projeto-supabase-remoto)
- [Configuração com Supabase local](#configuração-com-supabase-local)
- [Autenticação](#autenticação)
- [Como executar](#como-executar)
- [Como validar e testar](#como-validar-e-testar)
- [Scripts](#scripts)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Funcionalidades e limitações](#funcionalidades-e-limitações)
- [Solução de problemas](#solução-de-problemas)
- [Lovable](#lovable)

## O que a aplicação faz

O Gym Progress Tracker centraliza o planejamento semanal de treinos:

1. O visitante acessa a landing page e cria uma conta ou entra com uma conta existente.
2. O Supabase Auth mantém a sessão no navegador.
3. As páginas autenticadas consultam o Supabase diretamente, com isolamento por usuário garantido por Row Level Security (RLS).
4. O usuário configura dados físicos, objetivo, experiência e preferências de treino.
5. Na biblioteca, ele consulta exercícios globais e cria exercícios próprios.
6. Em **Treinar**, cria e duplica fichas, associa um dia da semana e adiciona exercícios com séries, faixa de repetições e descanso.
7. **Início** mostra o treino associado ao dia atual e **Agenda** apresenta a distribuição semanal.
8. Em **Perfil**, o usuário pode exportar seus dados em JSON ou excluir definitivamente a conta.

## Tecnologias

| Área                     | Tecnologia            | Uso no projeto                                                      |
| ------------------------ | --------------------- | ------------------------------------------------------------------- |
| Interface                | React 19 + TypeScript | Componentes e regras da UI                                          |
| Aplicação fullstack      | TanStack Start        | Rotas, SSR, server functions e middlewares                          |
| Roteamento               | TanStack Router       | Rotas baseadas em arquivos e rotas protegidas                       |
| Dados remotos            | TanStack Query        | Cache, carregamento e invalidação de consultas                      |
| Build e desenvolvimento  | Vite 8                | Servidor local e build de produção                                  |
| Estilos                  | Tailwind CSS 4        | Tema e layout mobile-first                                          |
| Componentes              | shadcn/ui + Radix UI  | Componentes acessíveis reutilizáveis                                |
| Backend                  | Supabase              | PostgreSQL, autenticação e RLS                                      |
| Validação de formulários | React Hook Form + Zod | Dependências disponíveis para formulários tipados                   |
| Gráficos                 | Recharts              | Preparado para a futura área de progresso                           |
| Ícones                   | Lucide React          | Iconografia da interface                                            |
| Deploy server-side       | Nitro                 | Saída do build, com alvo Cloudflare configurado pelo preset Lovable |

## Arquitetura

A aplicação usa TanStack Start. O navegador renderiza a interface React, enquanto o servidor trata SSR, middlewares e funções que precisam permanecer fora do bundle cliente.

```text
Navegador
  ├─ TanStack Router (páginas e proteção de rotas)
  ├─ TanStack Query (cache de consultas)
  └─ Supabase Client
       ├─ Auth (sessão persistida em localStorage)
       └─ PostgreSQL (acesso limitado por RLS)

TanStack Start / Nitro
  ├─ middleware de erros e proteção CSRF
  ├─ anexa o token do usuário às server functions
  ├─ exportação LGPD usando a sessão autenticada
  └─ exclusão de conta usando a service role apenas no servidor
```

### Decisões principais

- **Rotas por arquivo:** cada arquivo em `src/routes` representa uma rota. `src/routeTree.gen.ts` é gerado automaticamente e não deve ser editado.
- **Área autenticada:** `src/routes/_authenticated/route.tsx` valida o usuário antes de renderizar as páginas internas e aplica a navegação inferior.
- **Acesso ao banco:** operações comuns usam a chave pública e dependem de RLS. A service role é usada somente no servidor para excluir usuários.
- **SSR resiliente:** `src/server.ts`, `src/start.ts` e os componentes de erro tratam falhas inesperadas e retornam uma página HTML de erro em vez de JSON interno.
- **Mobile-first:** o conteúdo autenticado usa largura máxima de celular e uma barra fixa com Início, Treinar, Agenda, Progresso e Perfil.

## Rotas e fluxos

| URL               | Acesso              | Responsabilidade                                                             |
| ----------------- | ------------------- | ---------------------------------------------------------------------------- |
| `/`               | Público             | Landing page; redireciona usuários autenticados para `/inicio`               |
| `/auth`           | Público             | Login, cadastro, recuperação de senha e entrada com Google                   |
| `/reset-password` | Link de recuperação | Definição de uma nova senha                                                  |
| `/inicio`         | Autenticado         | Saudação, treino do dia e indicadores ainda estáticos                        |
| `/treinar`        | Autenticado         | Listar, criar, duplicar e excluir treinos                                    |
| `/treino/:id`     | Autenticado         | Editar treino, ordenar exercícios e configurar séries, repetições e descanso |
| `/biblioteca`     | Autenticado         | Pesquisar/filtrar biblioteca e criar ou excluir exercícios próprios          |
| `/agenda`         | Autenticado         | Visualizar o treino associado a cada dia da semana                           |
| `/progresso`      | Autenticado         | Placeholder dos futuros indicadores e gráficos                               |
| `/perfil`         | Autenticado         | Dados pessoais, preferências, logout, exportação e exclusão da conta         |

## Modelo de dados e segurança

As migrations ficam em `supabase/migrations` e criam quatro tabelas principais:

| Tabela              | Finalidade                                  | Propriedade                                                  |
| ------------------- | ------------------------------------------- | ------------------------------------------------------------ |
| `profiles`          | Dados físicos, objetivo e preferências      | Um registro por usuário (`id = auth.users.id`)               |
| `exercises`         | Biblioteca global e exercícios customizados | `user_id = NULL` para globais; UUID do usuário para próprios |
| `workouts`          | Fichas de treino e dia da semana            | Sempre vinculada ao usuário                                  |
| `workout_exercises` | Exercícios, ordem e metas de cada treino    | Vinculada ao treino e ao usuário                             |

O banco também cria os enums `experience_level`, `training_goal` e `difficulty`, uma função para atualizar `updated_at`, um gatilho que cria o perfil após o cadastro e uma biblioteca inicial de exercícios.

### Row Level Security

O RLS está habilitado em todas as tabelas:

- cada usuário só lê e altera seu próprio perfil e seus próprios treinos;
- exercícios globais são somente leitura para usuários autenticados;
- exercícios personalizados só podem ser alterados pelo proprietário;
- a chave `SUPABASE_SERVICE_ROLE_KEY` ignora RLS e, por isso, deve existir **somente no ambiente do servidor**.

Nunca adicione a service role a uma variável com prefixo `VITE_`, ao código-fonte ou ao controle de versão. Variáveis `VITE_*` são incorporadas ao bundle enviado ao navegador.

## Pré-requisitos

Para usar um projeto Supabase hospedado:

- Node.js 22 ou versão LTS compatível;
- npm 10 ou superior;
- uma conta e um projeto no Supabase;
- Git, apenas para clonar e versionar o projeto.

Para executar também o Supabase localmente:

- Docker Desktop (ou outro runtime Docker compatível) em execução;
- Supabase CLI. É possível usá-la sem instalação global por meio de `npx supabase`.

O repositório contém `package-lock.json` e `bun.lock`. Este guia usa **npm** para garantir uma instalação reproduzível com `npm ci`. Use apenas um gerenciador por instalação para evitar divergência entre lockfiles.

## Configuração rápida com um projeto Supabase remoto

Esta é a opção mais simples para executar toda a aplicação, inclusive exclusão de conta.

### 1. Clone e instale as dependências

```bash
git clone <URL_DO_REPOSITORIO>
cd gym-mobile
npm ci
```

### 2. Crie ou selecione um projeto Supabase

No painel do Supabase, copie:

- **Project URL**;
- **Publishable key** (ou a chave `anon` legada, se o projeto ainda usar o formato antigo);
- **Secret key/service role key**, usada exclusivamente no servidor.

### 3. Aplique o schema

Faça login na CLI, vincule a pasta ao projeto e envie as migrations:

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push
```

O `PROJECT_REF` é o identificador do projeto exibido no painel e também aparece na URL do projeto. O arquivo `supabase/config.toml` já contém a referência usada pela instância original; altere-a ou informe a referência correta durante o vínculo se estiver usando outro projeto.

> Não execute as migrations repetidamente pelo SQL Editor: elas contêm criação de tipos e tabelas e foram feitas para serem controladas pela CLI.

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz. Esse nome corresponde à regra `*.local` do `.gitignore`. Nunca faça commit de arquivos de ambiente ou segredos. Se já existir um `.env` fornecido pelo Lovable, preserve-o e confirme no Git que ele não está sendo rastreado antes de adicionar credenciais.

```dotenv
# Servidor TanStack Start / Nitro
SUPABASE_PROJECT_ID="seu-project-ref"
SUPABASE_URL="https://seu-project-ref.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."

# Bundle do navegador (somente valores públicos)
VITE_SUPABASE_PROJECT_ID="seu-project-ref"
VITE_SUPABASE_URL="https://seu-project-ref.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
```

As versões sem `VITE_` são lidas pelo SSR e pelos middlewares. As versões com `VITE_` são lidas no navegador. A chave pública pode aparecer nos dois contextos; a service role, nunca.

### 5. Configure as URLs de autenticação

No painel do Supabase, em **Authentication > URL Configuration**:

- defina a URL local como `http://localhost:3000` (ou a porta exibida pelo Vite);
- adicione `http://localhost:3000/**` à lista de Redirect URLs;
- em produção, adicione também o domínio final e sua rota `/reset-password`.

Se o servidor escolher outra porta, use exatamente a origem mostrada no terminal.

### 6. Execute

```bash
npm run dev
```

Abra a URL exibida no terminal, crie uma conta e siga o roteiro em [Teste manual funcional](#teste-manual-funcional).

## Configuração com Supabase local

Esta opção cria banco e autenticação em containers Docker.

### 1. Instale dependências e inicie os serviços

```bash
npm ci
npx supabase start
```

Ao iniciar, a CLI aplica as migrations e imprime a API URL, a publishable/anon key e a secret/service role key. Para reaplicar todo o banco desde o zero:

```bash
npx supabase db reset
```

> `db reset` apaga os dados do banco Supabase local. Não use esse comando contra um ambiente remoto ou com dados que precisem ser preservados.

### 2. Monte `.env.local`

Consulte novamente as credenciais locais quando necessário:

```bash
npx supabase status
```

Copie os valores para `.env.local`:

```dotenv
SUPABASE_PROJECT_ID="local"
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_PUBLISHABLE_KEY="<PUBLISHABLE_OU_ANON_KEY_LOCAL>"
SUPABASE_SERVICE_ROLE_KEY="<SECRET_OU_SERVICE_ROLE_KEY_LOCAL>"

VITE_SUPABASE_PROJECT_ID="local"
VITE_SUPABASE_URL="http://127.0.0.1:54321"
VITE_SUPABASE_PUBLISHABLE_KEY="<MESMA_CHAVE_PUBLICA_LOCAL>"
```

Os nomes exatos exibidos pela CLI podem variar entre o formato atual (`publishable`/`secret`) e o legado (`anon`/`service_role`). O cliente deste projeto aceita ambos.

### 3. Inicie a aplicação

```bash
npm run dev
```

E-mails de confirmação e recuperação enviados pelo Supabase local podem ser abertos no Mailpit, cuja URL aparece em `npx supabase status` (normalmente `http://127.0.0.1:54324`).

Para encerrar os containers:

```bash
npx supabase stop
```

## Autenticação

### E-mail e senha

Login, cadastro, confirmação de e-mail e recuperação usam Supabase Auth. Em um ambiente de desenvolvimento, escolha uma destas estratégias:

- desative temporariamente a confirmação de e-mail no projeto de teste; ou
- mantenha a confirmação ativa e use o e-mail recebido (em ambiente local, abra-o no Mailpit).

O link de recuperação deve voltar para `/reset-password` na mesma origem da aplicação.

### Google

O botão **Continuar com Google** usa `@lovable.dev/cloud-auth-js`, integrado ao ambiente Lovable. Para funcionar fora do projeto Lovable original, o provedor OAuth precisa estar habilitado e corretamente configurado no ambiente de autenticação usado. O fluxo de e-mail e senha não depende do botão Google e é o caminho recomendado para validar uma instalação local nova.

## Como executar

### Desenvolvimento

```bash
npm run dev
```

O Vite inicia o servidor TanStack Start com recarregamento automático.

### Build de produção

```bash
npm run build
```

A saída server-side é criada em `.output`. O preset Lovable configura Nitro com alvo Cloudflare por padrão, portanto o deploy precisa fornecer no ambiente de execução todas as variáveis sem `VITE_`; as variáveis `VITE_*` devem existir no momento do build.

### Pré-visualização

```bash
npm run preview
```

Use a URL indicada pelo comando. O preview só é confiável depois de um build bem-sucedido e não substitui a validação no ambiente final de deploy.

## Como validar e testar

O projeto ainda não possui Vitest, Playwright ou outra suíte automatizada configurada. Atualmente, a validação técnica é feita com lint, build e teste manual.

### Validação estática e de produção

```bash
npm run lint
npm run build
```

O lint inclui ESLint, regras de hooks React e verificação de formatação pelo Prettier. O TypeScript é verificado durante o fluxo de build; não há um script `test` ou `typecheck` separado no momento.

### Teste manual funcional

Use um projeto Supabase de desenvolvimento, sem dados importantes:

1. Abra `/` e confirme que a landing page carrega.
2. Acesse `/auth`, crie uma conta com e-mail e senha e conclua a confirmação, se habilitada.
3. Confirme o redirecionamento para `/inicio` e a criação automática do perfil.
4. Em **Perfil**, preencha nome, altura, peso, objetivo, nível e frequência; salve e recarregue a página.
5. Em **Biblioteca**, confirme que os exercícios globais da migration aparecem.
6. Crie um exercício personalizado, pesquise por ele e confirme que é possível excluí-lo.
7. Em **Treinar**, crie um treino, associe um dia e abra a edição.
8. Adicione exercícios, altere séries/repetições/descanso e teste a ordenação.
9. Duplique o treino e confirme que os exercícios e configurações também foram copiados.
10. Confira o treino na **Agenda** e, se ele estiver associado ao dia atual, em **Início**.
11. Saia e entre novamente para confirmar a persistência da sessão e dos dados.
12. Solicite recuperação de senha e valide o link em `/reset-password`.
13. Em **Perfil**, exporte os dados e confira o arquivo `meus-dados-treino.json`.
14. Com uma conta descartável e `SUPABASE_SERVICE_ROLE_KEY` configurada, teste **Excluir minha conta** e confirme que o login deixa de funcionar.
15. Abra uma rota autenticada sem sessão e confirme o redirecionamento para `/auth`.

### Verificações de segurança recomendadas

- crie dois usuários e confirme que um não vê nem altera treinos/exercícios privados do outro;
- procure por `SUPABASE_SERVICE_ROLE_KEY` nos arquivos gerados do cliente e confirme que o valor não foi incorporado;
- não execute o teste de exclusão em uma conta real;
- teste exportação e exclusão apenas em HTTPS no ambiente de produção.

## Scripts

| Comando             | Descrição                                   |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Inicia o ambiente de desenvolvimento        |
| `npm run build`     | Gera o build de produção                    |
| `npm run build:dev` | Gera build usando o modo Vite `development` |
| `npm run preview`   | Pré-visualiza o build localmente            |
| `npm run lint`      | Executa ESLint e a validação do Prettier    |
| `npm run format`    | Formata os arquivos com Prettier            |

## Estrutura de pastas

```text
gym-mobile/
├─ public/
│  ├─ icons/                  # Ícone da aplicação
│  ├─ manifest.webmanifest    # Metadados da PWA
│  └─ robots.txt
├─ src/
│  ├─ components/
│  │  ├─ ui/                  # Componentes shadcn/ui e Radix
│  │  └─ app-shell.tsx        # Layout e navegação da área autenticada
│  ├─ integrations/
│  │  ├─ lovable/             # Integração OAuth do Lovable
│  │  └─ supabase/            # Clientes, tipos e middlewares de autenticação
│  ├─ lib/                    # Sessão, banco, LGPD e tratamento de erros
│  ├─ routes/                 # Rotas baseadas em arquivos
│  ├─ routeTree.gen.ts        # Arquivo gerado; não editar manualmente
│  ├─ router.tsx              # Configuração do TanStack Router/Query
│  ├─ server.ts               # Entrada SSR protegida contra erros catastróficos
│  ├─ start.ts                # Middlewares globais, autenticação e CSRF
│  └─ styles.css              # Tema global Tailwind
├─ supabase/
│  ├─ migrations/             # Schema, RLS, gatilhos e seed da biblioteca
│  └─ config.toml             # Configuração da Supabase CLI
├─ eslint.config.js
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

## Funcionalidades e limitações

### Implementado

- landing page responsiva;
- cadastro, login, logout e recuperação de senha;
- botão de OAuth Google via Lovable Cloud Auth;
- proteção de rotas e sessão persistida;
- perfil com dados físicos, objetivo e preferências;
- biblioteca inicial e exercícios personalizados;
- criação, edição, duplicação e exclusão de treinos;
- associação de exercícios, séries-alvo, faixa de repetições, descanso e ordenação;
- agenda semanal e treino do dia;
- exportação de dados e exclusão de conta;
- RLS, middleware de autenticação, CSRF para server functions e páginas de erro;
- manifesto e ícone para experiência instalável/mobile.

### Ainda não implementado

- execução de uma sessão e registro das séries realizadas;
- histórico de treinos, cargas e volume;
- cálculo de progressão e recordes pessoais;
- estatísticas e gráficos reais na página Progresso;
- cronômetro de descanso;
- fotos e medidas corporais históricas;
- notificações push;
- Service Worker, cache offline, IndexedDB e sincronização;
- testes unitários, de integração e end-to-end automatizados.

Embora exista um `manifest.webmanifest`, a aplicação ainda não oferece suporte offline. Não trate o estado atual como uma PWA offline completa.

## Solução de problemas

### `Missing Supabase environment variable(s)`

Confirme que `.env.local` está na raiz, reinicie `npm run dev` após qualquer alteração e verifique se os pares servidor/cliente foram preenchidos:

- `SUPABASE_URL` e `VITE_SUPABASE_URL`;
- `SUPABASE_PUBLISHABLE_KEY` e `VITE_SUPABASE_PUBLISHABLE_KEY`.

Para excluir conta, também é obrigatória `SUPABASE_SERVICE_ROLE_KEY` no servidor.

### Login funciona, mas consultas retornam vazio ou erro

Execute `npx supabase db push` no projeto remoto ou `npx supabase db reset` no ambiente local. Sem as migrations, tabelas, políticas e o perfil automático não existem.

### Cadastro não entra imediatamente

Provavelmente a confirmação por e-mail está ativa. Confirme o endereço antes de entrar. No Supabase local, abra o Mailpit informado por `npx supabase status`.

### Link de recuperação abre uma URL inválida

Inclua a origem local e de produção em **Authentication > URL Configuration > Redirect URLs** no Supabase. Depois solicite um novo e-mail; links antigos podem continuar apontando para a configuração anterior.

### Exclusão de conta falha

Verifique `SUPABASE_SERVICE_ROLE_KEY`, reinicie o servidor e confirme que a chave pertence ao mesmo projeto indicado por `SUPABASE_URL`. Nunca use a chave pública no lugar da service role.

### Google OAuth não redireciona corretamente

O botão depende do Lovable Cloud Auth e das URLs autorizadas do provedor. Para uma instalação independente, valide primeiro e-mail/senha ou configure o provedor Google no ambiente conectado ao projeto.

### Porta diferente de `3000`

Use a porta exibida pelo Vite e atualize as URLs de redirecionamento no Supabase. Não presuma uma porta fixa se ela já estiver ocupada.

## Lovable

Este projeto está conectado ao [Lovable](https://lovable.dev). Alterações enviadas para a branch conectada são sincronizadas com o editor. Não reescreva o histórico já publicado com force push, rebase, amend ou squash.

O projeto original pode ser aberto no [editor Lovable](https://lovable.dev/projects/134567a1-887d-420c-b098-943bd37e0be1).
