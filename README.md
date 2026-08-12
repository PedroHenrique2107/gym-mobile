# gym-mobile

PWA mobile-first do GymFlow. Cuida da interface, da sessão do usuário, do consumo da API do `gym-service` e do deploy do frontend na Vercel.

> **Estado atual: fases M1–M4, núcleo não bloqueado da M5 e implementação local da M6 concluídos.**
> O app possui autenticação por convite, administração de contas, perfil/onboarding, biblioteca, fichas, agenda, treino online e offline, progresso, medidas, fotos privadas, exportação, instalação PWA e configuração de notificações usando a API real.
> A M6 ainda exige validação em Android/iPhone reais e entrega Web Push com VAPID configurado. A M7 já possui CI, acessibilidade automatizada, HSTS, smoke de preview e [runbook de produção](docs/PRODUCTION_RUNBOOK.md), mas o ambiente externo ainda não foi publicado. Autoexclusão solicitada pelo próprio titular e política de retenção aguardam texto e decisão jurídica; a exclusão administrativa já existe. Nenhuma tela usa dados fictícios. Consulte [PLANO_IMPLEMENTACAO.md](PLANO_IMPLEMENTACAO.md) para o escopo completo.

## Sumário

- [Responsabilidades](#responsabilidades)
- [O que já funciona](#o-que-já-funciona)
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

O frontend renderiza a interface, conduz autenticação no navegador, mantém e renova a sessão do Supabase Auth, envia o access token em toda chamada privada, consome exclusivamente a API versionada, administra o cache de leitura e mantém a outbox offline separada por usuário.

O frontend **não** acessa tabelas do PostgreSQL, **não** executa regras críticas de autorização, **não** possui `DATABASE_URL`, chave de service role ou credenciais do Prisma, e **não** decide se um usuário pode acessar dados de outro. Essas decisões são sempre do `gym-service`.

## O que já funciona

- entrar por convite, recuperar/redefinir senha, renovar sessão e sair apagando o cache local;
- completar e editar dados pessoais, objetivo, rotina, disponibilidade e preferências;
- abrir o catálogo em modal, pesquisar e filtrar exercícios, criar/editar e excluir ou arquivar exercícios próprios;
- criar, editar, duplicar, ordenar, arquivar e excluir fichas, com séries, repetições, pausa e observações por exercício;
- associar fichas aos sete dias, marcar descanso, substituir ou reagendar treinos por data;
- iniciar ou retomar treino, preencher carga e repetições de todas as séries em um único modal, marcar aquecimento, usar a última carga, controlar descanso e concluir ou abandonar a sessão;
- consultar resumo de 90 dias e ofensiva diária, editar ou excluir treinos concluídos, acompanhar recordes pela maior carga de uma série e evolução detalhada por exercício;
- registrar, corrigir com controle de versão e excluir peso e medidas corporais, com gráfico real de peso;
- enviar, validar, corrigir a data, abrir por URL temporária e excluir fotos no Storage privado;
- para administradores, convidar, reenviar ou excluir convite, ativar/desativar contas, alterar papel e excluir contas com seus dados dependentes;
- baixar `gymflow-export.json` com os dados reais que a API já mantém;
- instalar o aplicativo como PWA, abrir uma tela útil sem rede e atualizar o Service Worker sem interromper um treino ativo;
- continuar um treino sem conexão, persistir operações em ordem e sincronizá-las sem duplicação quando a rede voltar;
- visualizar operações offline bloqueadas, tentar novamente ou descartá-las explicitamente;
- solicitar permissão de notificações, configurar horário, listar dispositivos inscritos e remover uma inscrição;
- diagnosticar a conexão e diferenciar erros de autenticação, permissão, validação, conflito e rede.

## Stack

| Área | Tecnologia |
| --- | --- |
| Runtime | Node.js 22 LTS, npm |
| Framework | Next.js 16 (App Router e Proxy) |
| Interface | React 19, TypeScript strict |
| Estilos | Tailwind CSS 4 |
| Ícones | Lucide React |
| Estado remoto | TanStack Query 5 |
| PWA | Serwist 9 e Service Worker próprio |
| Dados offline | IndexedDB por meio do Dexie 4 |
| Cliente de API | `openapi-fetch` + `openapi-typescript` |
| Toasts | Sonner |
| Validação | Zod |
| Testes | Vitest + Testing Library, Playwright + Axe |
| Qualidade | ESLint, Prettier, TypeScript strict |
| Deploy | Vercel |

Supabase Auth usa `@supabase/supabase-js` e `@supabase/ssr`. Os formulários usam estado React e controles nativos. O gráfico de peso é SVG acessível e derivado dos valores reais. Serwist gera o worker depois do build do Next; Dexie mantém snapshots e operações offline sem armazenar JWT, refresh token ou header `Authorization`.

## Pré-requisitos

- Node.js 22 (`node -v` deve mostrar `v22.x`)
- npm 10 ou superior
- Um usuário convidado no Supabase Auth para entrar nas rotas privadas
- O **`gym-service` rodando** e apontando para o mesmo projeto Supabase

## Como executar

```bash
npm ci
npm run dev
```

Abra `http://localhost:3000`. A landing e `/status` são públicas; as demais rotas exigem uma conta convidada.

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
| `/offline` | Público | Fallback precacheado e orientação quando não há rede |
| `/entrar` | Público | Login e acesso à recuperação de senha |
| `/convite` | Público | Conclusão do convite e definição inicial de senha |
| `/recuperar-senha` / `/redefinir-senha` | Público | Fluxo seguro de recuperação |
| `/inicio` | Autenticado | Resumo do perfil real |
| `/treinar` | Autenticado | Execução do treino, biblioteca, exercícios próprios e CRUD/ordenação de fichas |
| `/agenda` | Autenticado | Semana recorrente, descanso, substituição e reagendamento |
| `/progresso` | Autenticado | Indicadores, sessões, recordes, evolução, medidas e fotos privadas |
| `/perfil` | Autenticado | Onboarding, edição completa, administração, exportação e logout |

O Proxy do Next protege por exclusão: qualquer rota que não esteja na lista pública exige claims criptograficamente validadas pelo Supabase antes de renderizar. Com JWT assimétrico, `getClaims()` usa a chave pública em cache e evita a ida ao Auth em cada navegação. Um `401` na API tenta renovar a sessão uma vez; `403` não desloga o usuário.

`/status` é público de propósito: é usada justamente quando a autenticação não funciona, e exigir login para diagnosticar seria circular. Ela não expõe dado de usuário — apenas versão, tempo no ar e quais dependências estão configuradas.

A navegação principal tem cinco áreas: Início, Treinar, Agenda, Progresso e Perfil. Biblioteca e fichas ficam dentro de Treinar — seis ou mais alvos em 360 px de largura deixariam cada um abaixo do mínimo de 44 px.

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

Mutações comuns **não** são repetidas pelo TanStack Query. As operações reenviáveis do treino usam UUID e `Idempotency-Key`, entram numa outbox Dexie ordenada e são repetidas com backoff quando a rede volta. `5xx`, `429` e `IDEMPOTENCY_IN_PROGRESS` permanecem na fila; erros `4xx` definitivos ficam bloqueados para revisão do usuário, sem loop de bateria ou perda silenciosa.

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
│  │  ├─ manifest.ts           # Metadados instaláveis
│  │  ├─ sw.ts                 # Cache, fallback offline e Web Push
│  │  ├─ error.tsx            # Fronteira de erro das rotas
│  │  ├─ global-error.tsx     # Falha do próprio layout raiz
│  │  └─ not-found.tsx
│  ├─ components/
│  │  ├─ ui/                  # button, card, input, select, textarea, badge
│  │  ├─ forms/               # Campo, dica e erro acessíveis
│  │  ├─ navigation/          # bottom-nav, page-header
│  │  └─ feedback/            # toaster, estados de vazio/erro/offline
│  ├─ features/
│  │  ├─ auth/                # Login, convite, recuperação e logout
│  │  ├─ profile/             # Resumo, onboarding, edição e exportação
│  │  ├─ admin/               # Convites, ativação, status, papéis e limite
│  │  ├─ exercises/           # Biblioteca e exercícios personalizados
│  │  ├─ workouts/            # CRUD, ordenação e metas das fichas
│  │  ├─ schedule/            # Semana e exceções por data
│  │  ├─ sessions/            # Execução, séries, descanso e encerramento
│  │  ├─ progress/            # Indicadores, histórico, medidas e fotos
│  │  ├─ pwa/                 # Instalação, atualização e notificações
│  │  └─ system/              # Diagnóstico da API
│  ├─ lib/
│  │  ├─ api/                 # Cliente, Problem Details, health, tipos gerados
│  │  ├─ config/              # Validação de ambiente
│  │  ├─ dates/               # Datas civis sem deslocamento por UTC
│  │  ├─ query/               # QueryClient e provider
│  │  ├─ offline/             # Dexie, snapshots, outbox e sincronização
│  │  └─ utils.ts
│  └─ styles/globals.css      # Tokens do tema em oklch
├─ scripts/
│  ├─ generate-api-types.mjs
│  └─ smoke.mjs                # Preview: páginas, PWA e headers
├─ docs/PRODUCTION_RUNBOOK.md   # Deploy, aparelhos reais e rollback
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

### CSP estrita aguarda a medição do preview

O Next injeta scripts inline no bootstrap, então uma CSP útil exige nonce por requisição — o que força renderização dinâmica em toda página e conflita com o shell estático que a PWA precisa. A alternativa preguiçosa, `script-src 'unsafe-inline'`, daria aparência de proteção sem nenhuma. Os outros cabeçalhos de segurança, incluindo HSTS no build de produção, estão configurados e verificados em teste. O [runbook](docs/PRODUCTION_RUNBOOK.md#6-csp) registra o gate para reavaliar nonce depois de medir o preview.

### Tema dark-first em `:root`

Por decisão de produto, não por preferência do sistema: academia costuma ter iluminação ruim e a tela fica em uso durante o treino. Um tema claro pode ser adicionado depois com `.light`, sem reescrever tokens.

Todas as cores usam `oklch` porque ele é perceptualmente uniforme — ajustar o L de um token muda o contraste de forma previsível, o que não acontece com `hsl`.

### ESLint separado do build do Next 16

O Next 16 removeu a execução implícita de lint durante `next build`. O projeto usa a configuração flat oficial do `eslint-config-next` e mantém `npm run lint` como gate explícito antes de testes e build. Assim uma atualização do bundler não altera silenciosamente a política de qualidade.

### `outputFileTracingRoot` fixado

Sem isso o Next sobe a árvore procurando um lockfile e pode escolher um diretório acima do repositório, mudando quais arquivos entram no bundle de deploy.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Next em desenvolvimento e rebuild contínuo do Service Worker |
| `npm run build` | Build de produção do Next seguido pelo worker do Serwist |
| `npm run pwa:build` | Regenera somente `public/sw.js` |
| `npm start` | Executa o build |
| `npm run lint` | ESLint, zero warnings tolerados |
| `npm run format` | Prettier |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Testes unitários e de componente |
| `npm run test:e2e` | Playwright (exige `npx playwright install chromium webkit`) |
| `npm run smoke -- https://preview.exemplo.com` | Valida páginas públicas, PWA e headers no deployment |
| `npm run api:types` | Regenera os tipos a partir do contrato |
| `npm run api:types:check` | Verifica se os tipos estão sincronizados |
| `npm run verify` | Formato + lint + typecheck + testes + build |

## Testes

**Unitários e de componente (Vitest):** 64 testes, executados e passando. Cobrem Problem Details, conflitos de versão, datas civis, retry, health, autenticação, navegação, cronômetros, snapshots offline, outbox, sincronização e chave VAPID.

**E2E (Playwright):** 78 testes (26 × 3 perfis), executados e passando.

```bash
npx playwright install chromium webkit   # uma vez
npm run test:e2e
```

Eles rodam contra `build` + `start`, não contra o servidor de desenvolvimento: o objetivo é validar o que vai ao ar. Os perfis são Pixel 7, iPhone 13 e uma largura de 360 px, refletindo o suporte primário definido no plano. WebKit importa especificamente porque iPhone/Safari se comporta de forma diferente em zoom e safe areas.

O paralelismo está limitado a 3 workers. O padrão do Playwright derrubava **todos** os testes do WebKit no Windows, enquanto os mesmos passavam com um worker — contenção no lançamento do navegador, não falha da aplicação. Ao aumentar esse número, verifique o WebKit especificamente: ele é o que quebra primeiro.

O E2E verifica manifesto, ícones, registro e controle do Service Worker, precache da tela offline, ausência de cache para respostas da API, headers de produção e violações WCAG A/AA detectáveis pelo Axe. No WebKit para Windows, a navegação artificialmente offline possui um erro interno do navegador de teste; nesse perfil o teste comprova diretamente controle e Cache Storage, enquanto os dois projetos Chromium exercitam a navegação offline completa. A instalação final ainda precisa ser validada em aparelhos reais.

Simular respostas dentro de um teste é legítimo e é o próprio ponto do teste. **Nenhum dado simulado existe no código que vai ao ar.**

## O que ainda não existe

- Exclusão de conta e política automática de retenção, ainda dependentes da decisão jurídica
- Publicação de termos e política de privacidade; o registro de consentimentos permanece vazio até existir conteúdo jurídico aprovado
- validação de instalação, atualização e treino offline em Android e iPhone reais
- entrega Web Push real após configurar as chaves VAPID no `gym-service`
- Mídia dos exercícios, enquanto origem e licença não forem aprovadas
- Content Security Policy estrita, condicionada à medição do custo de renderização no preview
- configuração do projeto Vercel, domínio e variáveis finais; CI e smoke manual já estão preparados, mas ainda não foram executados no GitHub ou contra um deployment real

As áreas pendentes declaram o próprio estado e não exibem dados de exemplo. As telas implementadas leem somente a API real e mantêm o isolamento decidido pelo backend.
