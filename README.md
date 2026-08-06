# gym-mobile

PWA mobile-first do GymFlow. Cuida da interface, da sessão do usuário, do consumo da API do `gym-service` e do deploy do frontend na Vercel.

> **Estado atual: fase M1 concluída (fundação).**
> Existem tema, navegação, páginas de erro, cliente de API tipado pelo contrato do backend e uma página de diagnóstico de conexão.
> **Não existem** login, treinos, histórico, gráficos, cronômetro nem funcionamento offline. As telas dessas áreas são navegáveis e declaram explicitamente que a funcionalidade não foi construída — elas não exibem nenhum dado de exemplo. Consulte [PLANO_IMPLEMENTACAO.md](PLANO_IMPLEMENTACAO.md) para o escopo completo.

## Sumário

- [Responsabilidades](#responsabilidades)
- [Stack](#stack)
- [Pré-requisitos](#pré-requisitos)
- [Como executar](#como-executar)
- [Configuração](#configuração)
- [Rotas](#rotas)
- [Como os tipos da API são gerados](#como-os-tipos-da-api-são-gerados)
- [Tratamento de erros](#tratamento-de-erros)
- [Acessibilidade](#acessibilidade)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Decisões de arquitetura](#decisões-de-arquitetura)
- [Scripts](#scripts)
- [Testes](#testes)
- [O que ainda não existe](#o-que-ainda-não-existe)

## Responsabilidades

O frontend renderiza a interface, conduz autenticação no navegador, mantém e renova a sessão do Supabase Auth, envia o access token em toda chamada privada, consome exclusivamente a API versionada, administra cache de leitura e sincronização offline, e oferece a experiência instalável.

O frontend **não** acessa tabelas do PostgreSQL, **não** executa regras críticas de autorização, **não** possui `DATABASE_URL`, chave de service role ou credenciais do Prisma, e **não** decide se um usuário pode acessar dados de outro. Essas decisões são sempre do `gym-service`.

## Stack

| Área | Tecnologia |
| --- | --- |
| Runtime | Node.js 22 LTS, npm |
| Framework | Next.js 15 (App Router) |
| Interface | React 19, TypeScript strict |
| Estilos | Tailwind CSS 4 |
| Ícones | Lucide React |
| Estado remoto | TanStack Query 5 |
| Cliente de API | `openapi-fetch` + `openapi-typescript` |
| Toasts | Sonner |
| Validação | Zod |
| Testes | Vitest + Testing Library, Playwright |
| Qualidade | ESLint, Prettier, TypeScript strict |
| Deploy | Vercel |

Supabase Auth (`@supabase/supabase-js`, `@supabase/ssr`) entra em M2. Recharts entra em M5. Serwist e Dexie entram em M6. React Hook Form entra quando existir o primeiro formulário real, em M2 — adicioná-lo agora seria uma dependência sem uso.

## Pré-requisitos

- Node.js 22 (`node -v` deve mostrar `v22.x`)
- npm 10 ou superior
- O **`gym-service` rodando** para que a página de status mostre algo além de falha de conexão

## Como executar

```bash
npm ci
npm run dev
```

Abra `http://localhost:3000`. Nenhuma credencial é necessária nesta fase.

Para ver a integração com o backend funcionando, suba os dois:

```bash
# terminal 1
cd ../gym-service && npm run start:dev

# terminal 2
cd ../gym-mobile && npm run dev
```

Depois acesse `http://localhost:3000/status`. Ela consulta o `gym-service` de verdade e mostra versão, tempo no ar e o estado de cada dependência. Se a API estiver fora, a página informa a falha — não existe estado "online" de mentira.

## Configuração

Copie `.env.example` para `.env.local` e preencha. Arquivos `.env*` reais são ignorados pelo Git.

### Toda variável `NEXT_PUBLIC_*` é pública

Ela é incorporada ao bundle enviado ao navegador e fica visível para qualquer usuário. Nunca coloque neste repositório:

- `SUPABASE_SECRET_KEY` ou service role key
- `DATABASE_URL` / `DIRECT_URL`
- `VAPID_PRIVATE_KEY`

Esses segredos pertencem exclusivamente ao `gym-service`. Nenhuma variável do `gym-mobile-lovable` deve ser copiada para cá.

### As variáveis são lidas no build, não no runtime

`NEXT_PUBLIC_API_URL` precisa existir **no momento do `npm run build`**. Trocá-la depois, no ambiente de execução, não muda o bundle já gerado — a aplicação continuaria chamando o endereço antigo.

Consequência prática na Vercel: a variável tem de estar configurada no projeto **antes** do deploy, e mudar de ambiente exige novo build. Preview e produção precisam de valores próprios.

### Validação

A configuração é validada no import de `@/lib/config/env`, e não no primeiro uso. Um valor inválido falha no build ou no start, com nome do campo e motivo — nunca o valor recebido.

## Rotas

| Rota | Acesso | Estado |
| --- | --- | --- |
| `/` | Público | Apresentação, declarando o estágio real do projeto |
| `/status` | Público | Diagnóstico de conexão com o `gym-service` |
| `/inicio` | Autenticado¹ | Navegável; painel entra em M2 |
| `/treinar` | Autenticado¹ | Navegável; fichas e execução entram em M3/M4 |
| `/agenda` | Autenticado¹ | Navegável; agenda entra em M3 |
| `/progresso` | Autenticado¹ | Navegável; gráficos entram em M5 |
| `/perfil` | Autenticado¹ | Navegável; perfil entra em M3 |

¹ **Estas rotas ainda não estão protegidas.** A verificação de sessão entra em M2, junto do Supabase Auth — sem mecanismo de sessão, um guardião redirecionaria todo acesso e tornaria a navegação impossível de validar nesta fase.

Isso é aceitável hoje por um motivo verificável: **nenhuma dessas telas lê ou exibe dado de usuário.** Elas existem para validar navegação, alvos de toque e safe areas. No momento em que a primeira consulta à API entrar ali, a proteção de rota precisa existir antes.

`/status` é público de propósito: é usada justamente quando a autenticação não funciona, e exigir login para diagnosticar seria circular. Ela não expõe dado de usuário — apenas versão, tempo no ar e quais dependências estão configuradas.

A navegação principal tem cinco áreas: Início, Treinar, Agenda, Progresso e Perfil. Biblioteca e gerenciamento de fichas serão acessados a partir de Treinar — seis ou mais alvos em 360 px de largura deixariam cada um abaixo do mínimo de 44 px.

## Como os tipos da API são gerados

O `gym-service` é o proprietário do contrato. Nenhum tipo de domínio é escrito à mão neste repositório.

```bash
# no gym-service, primeiro
npm run openapi:emit

# aqui
npm run api:types          # regenera src/lib/api/generated/types.ts
npm run api:types:check    # falha se estiver defasado
```

A origem é resolvida nesta ordem: `--from=<caminho-ou-url>`, `GYM_SERVICE_OPENAPI`, e por fim o repositório irmão `../gym-service/openapi/openapi.json`. O repositório irmão vem antes da rede de propósito: durante o desenvolvimento, o contrato recém-gerado no backend deve valer imediatamente, sem depender de a API estar no ar.

`src/lib/api/generated/` é ignorado pelo ESLint e pelo Prettier. Editá-lo à mão quebraria a única garantia que ele oferece: que os tipos usados aqui são exatamente os que a API publica.

Se `api:types:check` falhar, **revise o diff**. Se um campo existente mudou ou desapareceu, a alteração é incompatível e o backend compatível precisa estar publicado antes deste frontend.

## Tratamento de erros

Toda falha de chamada à API vira um `ApiError`, tratado em um só lugar por middleware do `openapi-fetch`. Erros de rede também passam por ali, para que a interface lide com uma única classe de falha.

### O campo estável é `code`, não `detail`

O backend responde em `application/problem+json` (RFC 9457). O cliente decide comportamento pelo `code`; `detail` é texto livre que pode ser reescrito a qualquer momento. Ramificar em `detail` quebraria o app quando alguém melhorasse uma mensagem.

`title` também não é usado como mensagem ao usuário: pela RFC ele é o rótulo do *tipo* de problema, idêntico em toda ocorrência. "Falha interna" descreve a categoria, mas não diz o que fazer — então o fallback local, escrito como orientação, é preferido.

### `401` e `403` são tratados de forma diferente

`401` significa sessão ausente ou expirada e exige renovar ou voltar ao login. `403` **não** dispara logout: deslogar alguém por tentar uma ação sem permissão faria perder o treino em andamento por um clique indevido.

### O que é repetido automaticamente

Rede, `5xx` e `429` são transitórios e valem repetir, com backoff exponencial até 15 s e no máximo 3 tentativas. `4xx` não melhora sem corrigir o pedido — insistir só gasta bateria e cota.

Mutações **não** são repetidas automaticamente. Sem `Idempotency-Key`, que entra em M6, repetir um POST poderia duplicar uma série registrada.

### Nada interno chega à interface

Mensagens de rede do navegador citam host e porta; elas vão para `cause` e nunca para a mensagem exibida. O corpo de erro do backend já vem em pt-BR e sanitizado.

Uma resposta que não seja JSON válido — HTML de um proxy, corpo truncado — não lança `SyntaxError`: o usuário recebe uma mensagem útil.

### Identificador de requisição

Toda chamada envia `x-request-id`, e o valor aparece nas páginas de erro. É o único elo entre o que o usuário viu e a linha de log do servidor.

## Acessibilidade

O `gym-mobile-lovable` serviu de referência visual, mas várias limitações dele foram corrigidas aqui:

| Correção | Por quê |
| --- | --- |
| `lang="pt-BR"` | Define pronúncia do leitor de tela e hifenização. O protótipo declarava inglês. |
| Zoom liberado (`maximum-scale=5`) | Bloquear zoom impede quem precisa ampliar para ler de usar o app. |
| `viewport-fit=cover` + safe areas | Sem isso a navegação inferior fica sob a barra de gestos do iPhone. |
| Alvos de toque de 44 px | Utilitário `tap`, verificado em teste e2e. |
| Foco visível | `:focus-visible` com anel de 2 px; remover outline sem substituto inutiliza o teclado. |
| `prefers-reduced-motion` | Animações reduzidas a 0.01 ms, sem `animation: none` para não quebrar `transitionend`. |
| `text-base` (16 px) em inputs | Fontes menores fazem o Safari aplicar zoom automático que não é revertido. |
| Link "pular para o conteúdo" | Evita percorrer a navegação em cada página, no teclado. |
| `aria-current` na navegação | Cor sozinha não comunica o item ativo. |
| Cor **e** texto em badges | Cerca de 8% dos homens não distinguem verde de vermelho. |
| `noindex, nofollow` | A aplicação é privada. |

## Estrutura de pastas

```text
gym-mobile/
├─ src/
│  ├─ app/
│  │  ├─ (public)/            # Landing e status
│  │  ├─ (protected)/         # Cinco áreas da navegação principal
│  │  ├─ layout.tsx           # pt-BR, viewport, providers
│  │  ├─ error.tsx            # Fronteira de erro das rotas
│  │  ├─ global-error.tsx     # Falha do próprio layout raiz
│  │  └─ not-found.tsx
│  ├─ components/
│  │  ├─ ui/                  # button, card, input, label, badge, skeleton
│  │  ├─ navigation/          # bottom-nav, page-header
│  │  └─ feedback/            # toaster, estados de vazio/erro/offline
│  ├─ features/
│  │  └─ system/              # Diagnóstico da API
│  ├─ lib/
│  │  ├─ api/                 # Cliente, Problem Details, health, tipos gerados
│  │  ├─ config/              # Validação de ambiente
│  │  ├─ query/               # QueryClient e provider
│  │  └─ utils.ts
│  └─ styles/globals.css      # Tokens do tema em oklch
├─ scripts/
│  └─ generate-api-types.mjs
├─ tests/e2e/
└─ .env.example
```

## Decisões de arquitetura

### O QueryClient é criado em `useState`, não em módulo

Em SSR, um cliente de módulo seria compartilhado entre requisições de usuários diferentes — dado privado de um apareceria para outro. `useState` garante uma instância por árvore de renderização.

### O cliente de API não conhece o Supabase

O token vem de um `TokenProvider` registrado em M2. Assim o cliente HTTP permanece testável sem sessão, e uma troca de provedor de identidade não o alcança.

O token é obtido a cada chamada, e não guardado, porque o Supabase renova a sessão em segundo plano — um valor capturado uma vez começaria a falhar com `401` depois de uma hora.

### `/health` e `/ready` não passam pelo cliente tipado

Eles ficam **fora** de `/api/v1`: são contrato de plataforma, não de negócio, e não devem migrar quando surgir uma `/api/v2`. Também não exigem token.

`/ready` responde `503` quando não está pronto, e esse corpo ainda interessa — ele diz **qual** dependência falhou. Tratá-lo como exceção descartaria o diagnóstico.

### CORS sem credenciais

A API autentica por `Authorization: Bearer`. Os cookies de sessão do Supabase pertencem à origem do Next.js, nunca à origem da API, então `credentials: 'omit'`.

### CSP ficou para M7

O Next injeta scripts inline no bootstrap, então uma CSP útil exige nonce por requisição — o que força renderização dinâmica em toda página e conflita com o shell estático que a PWA precisa. A alternativa preguiçosa, `script-src 'unsafe-inline'`, daria aparência de proteção sem nenhuma. Os outros cabeçalhos de segurança já estão configurados e verificados em teste.

### Tema dark-first em `:root`

Por decisão de produto, não por preferência do sistema: academia costuma ter iluminação ruim e a tela fica em uso durante o treino. Um tema claro pode ser adicionado depois com `.light`, sem reescrever tokens.

Todas as cores usam `oklch` porque ele é perceptualmente uniforme — ajustar o L de um token muda o contraste de forma previsível, o que não acontece com `hsl`.

### ESLint escopado por extensão

O `eslint-config-next` instala o próprio parser, que não repassa `parserOptions.project`. Aplicado a arquivos `.mjs`, fazia as regras que dependem de tipo falharem ao carregar. Restringir cada bloco ao que ele cobre resolve a raiz em vez de desligar as regras.

Como efeito colateral, `next build` emite *"The Next.js plugin was not detected in your ESLint configuration"* — é a heurística de detecção do Next não achar o plugin dentro de um bloco escopado. As regras **rodam**: verificado provocando `@next/next/no-img-element`, que dispara e, como `lint` usa `--max-warnings=0`, falha a verificação.

### `outputFileTracingRoot` fixado

Sem isso o Next sobe a árvore procurando um lockfile e pode escolher um diretório acima do repositório, mudando quais arquivos entram no bundle de deploy.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Executa o build |
| `npm run lint` | ESLint, zero warnings tolerados |
| `npm run format` | Prettier |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Testes unitários e de componente |
| `npm run test:e2e` | Playwright (exige `npx playwright install chromium webkit`) |
| `npm run api:types` | Regenera os tipos a partir do contrato |
| `npm run api:types:check` | Verifica se os tipos estão sincronizados |
| `npm run verify` | Formato + lint + typecheck + testes + build |

## Testes

**Unitários e de componente (Vitest):** 31 testes, executados e passando. Cobrem leitura de Problem Details, classificação de erros, política de retry, cliente de health e acessibilidade da navegação.

**E2E (Playwright):** 36 testes (12 × 3 perfis), executados e passando.

```bash
npx playwright install chromium webkit   # uma vez
npm run test:e2e
```

Eles rodam contra `build` + `start`, não contra o servidor de desenvolvimento: o objetivo é validar o que vai ao ar. Os perfis são Pixel 7, iPhone 13 e uma largura de 360 px, refletindo o suporte primário definido no plano. WebKit importa especificamente porque iPhone/Safari se comporta de forma diferente em zoom e safe areas.

O paralelismo está limitado a 3 workers. O padrão do Playwright derrubava **todos** os testes do WebKit no Windows, enquanto os mesmos passavam com um worker — contenção no lançamento do navegador, não falha da aplicação. Ao aumentar esse número, verifique o WebKit especificamente: ele é o que quebra primeiro.

Estes testes já pagaram por si: encontraram dois defeitos reais que o resto da verificação não pegou. As páginas de erro e 404 não tinham `h1` nenhum, e a página de status levava mais de 7 segundos para informar que a API caiu, porque a política global de retry se aplicava a uma consulta de diagnóstico.

Simular respostas dentro de um teste é legítimo e é o próprio ponto do teste. **Nenhum dado simulado existe no código que vai ao ar.**

## O que ainda não existe

Nada abaixo está implementado.

- Supabase Auth, login, convite, recuperação e redefinição de senha
- Proteção de rotas e renovação de sessão
- Perfil, biblioteca de exercícios, fichas, agenda
- Execução de treino, registro de séries, cronômetro
- Histórico, gráficos, recordes, medidas, fotos
- Manifest, Service Worker, IndexedDB, outbox, sincronização offline
- Notificações push
- Content Security Policy
- CI e configuração de deploy na Vercel

As telas de `/inicio`, `/treinar`, `/agenda`, `/progresso` e `/perfil` declaram isso na própria interface. Elas não exibem dados de exemplo: preencher a tela com valores inventados daria a impressão de funcionalidade pronta e tornaria impossível saber, olhando o app, o que de fato funciona.
