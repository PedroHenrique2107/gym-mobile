# Onboarding técnico — gym-mobile

Este documento é o mapa rápido para entender, executar e manter o frontend do GymFlow. Ele
descreve o código que existe neste checkout. O [PLANO_IMPLEMENTACAO.md](PLANO_IMPLEMENTACAO.md)
continua útil como histórico e roadmap, mas não deve ser usado como prova de funcionalidade.

## 1. Resumo em um minuto

O `gym-mobile` é uma PWA mobile-first em Next.js. Ele:

- renderiza a interface e protege as páginas privadas;
- autentica o usuário com Supabase Auth;
- envia o access token para a API do `gym-service`;
- mantém leituras remotas no TanStack Query;
- mantém o treino ativo, fichas preparadas e uma outbox no IndexedDB;
- instala e atualiza o Service Worker, oferece fallback offline e Web Push;
- nunca acessa as tabelas de negócio diretamente.

O backend irmão, `../gym-service`, é a fonte de verdade para autorização, regras de negócio,
banco, Storage, auditoria e contrato OpenAPI.

```text
Usuário
  |
  v
Next.js App Router + React
  |-- Proxy valida a sessão no Supabase Auth
  |-- TanStack Query guarda leituras da API
  |-- Dexie guarda treino, fichas e outbox por usuário
  |-- Service Worker cuida do shell, fallback e Push
  |
  | Authorization: Bearer <token>
  v
gym-service /api/v1
  |-- PostgreSQL/Supabase
  |-- Storage privado
  `-- scheduler de notificações
```

## 2. Estado funcional atual

Já existem fluxos reais para:

- convite, login, recuperação de senha, renovação de sessão e logout;
- perfil e onboarding;
- administração de contas por usuário `ADMIN`;
- biblioteca de exercícios próprios e globais;
- fichas, ordenação e agenda recorrente ou por data;
- execução de treino online e offline, séries, descanso e encerramento;
- histórico, recordes, evolução, medidas corporais e fotos privadas;
- exportação dos dados da conta;
- instalação PWA, atualização do worker e configuração de notificações.

Ainda dependem de decisão ou ambiente externo:

- exclusão definitiva, retenção e textos jurídicos de consentimento;
- mídia licenciada para exercícios;
- chaves VAPID e validação de Push em dispositivos reais;
- validação final da instalação e do treino offline em Android/iPhone reais;
- publicação final na Vercel e uma CSP estrita baseada em medição.

## 3. Como executar os dois repositórios

Requisitos: Node.js 22, npm 10+, um projeto Supabase configurado e um usuário convidado.

No `gym-service`:

```bash
cd ../gym-service
npm ci
npm run start:dev
```

Neste repositório:

```bash
npm ci
copy .env.example .env.local
npm run dev
```

Preencha o `.env.local` antes de iniciar. As variáveis usadas pelo navegador são:

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_APP_ENV` | `development`, `preview` ou `production` |
| `NEXT_PUBLIC_API_URL` | origem do `gym-service`, sem `/api/v1` |
| `NEXT_PUBLIC_SUPABASE_URL` | projeto usado pelo Supabase Auth |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | chave pública do Auth |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | chave pública opcional do Web Push |

Abra `http://localhost:3000/status`. Essa página consulta `/health` e `/ready` da API real.

> Tudo que começa com `NEXT_PUBLIC_` vai para o bundle do navegador. Nunca coloque neste
> repositório `DATABASE_URL`, chave secreta do Supabase ou chave VAPID privada.

## 4. Arquitetura por camada

| Camada | Responsabilidade | Onde fica |
| --- | --- | --- |
| Rotas | compor a tela e definir metadata | `src/app/` |
| Features | regra de apresentação, formulários, queries e mutations | `src/features/` |
| Componentes | UI reutilizável, navegação, feedback e formulários | `src/components/` |
| API | cliente tipado, token, erros e health | `src/lib/api/` |
| Auth | Supabase browser/server, sessão e regras de rota | `src/lib/auth/` |
| Estado remoto | configuração global do TanStack Query | `src/lib/query/` |
| Offline | Dexie, snapshots, outbox, estado local e replay | `src/lib/offline/` |
| PWA | instalação, atualização, Push e Service Worker | `src/features/pwa/`, `src/app/sw.ts` |
| Configuração | leitura e validação das variáveis públicas | `src/lib/config/env.ts` |
| Visual | tokens, tema, safe areas e acessibilidade global | `src/styles/globals.css` |

Regra prática: uma página em `src/app` deve ser pequena. A implementação de uma área fica em
`src/features/<dominio>`. Código reutilizável sem regra de produto fica em `components` ou `lib`.

## 5. Rotas e onde fazer manutenção

| Rota | O que entrega | Principal ponto de manutenção |
| --- | --- | --- |
| `/` | landing pública | `src/app/(public)/page.tsx` |
| `/status` | diagnóstico da API | `src/features/system/` e `src/lib/api/health.ts` |
| `/offline` | fallback sem rede | `src/app/(public)/offline/page.tsx` |
| `/entrar` | login | `src/features/auth/login-form.tsx` |
| `/convite` | criação da senha do convidado | `src/features/auth/set-password-form.tsx` |
| `/recuperar-senha` | solicitação de recuperação | `src/features/auth/recover-password-form.tsx` |
| `/redefinir-senha` | nova senha | `src/features/auth/set-password-form.tsx` |
| `/inicio` | resumo do perfil | `src/features/profile/profile-summary.tsx` |
| `/treinar` | sessão, fichas e biblioteca | `src/features/sessions/`, `workouts/` e `exercises/` |
| `/agenda` | semana e exceções por data | `src/features/schedule/schedule-manager.tsx` |
| `/progresso` | indicadores, medidas e fotos | `src/features/progress/` |
| `/perfil` | perfil, admin, PWA, Push, exportação e logout | `src/features/profile/`, `admin/` e `pwa/` |

`src/proxy.ts` protege tudo por padrão. Somente as rotas listadas em
`src/lib/auth/routes.ts` são públicas. Uma rota nova nasce privada; só a torne pública quando não
houver dado de usuário e existir motivo claro.

## 6. Como uma requisição autenticada funciona

1. `src/proxy.ts` chama `supabase.auth.getClaims()` antes de renderizar uma rota privada. Com JWT
   assimétrico, a assinatura é validada localmente com a JWKS em cache, sem abrir mão da validação.
2. `SessionProvider` liga a sessão do Supabase ao cliente HTTP.
3. `src/lib/api/client.ts` obtém o token atual e adiciona `Authorization` e `x-request-id`.
4. `openapi-fetch` valida o caminho e o payload em TypeScript contra os tipos gerados.
5. O `gym-service` responde com dados ou `application/problem+json`.
6. `src/lib/api/problem.ts` converte qualquer falha em `ApiError`.
7. A feature atualiza/invalida as query keys necessárias.

Em `401`, o cliente renova a sessão e repete uma vez. Um segundo `401` limpa sessão, cache e
dados offline. `403` não encerra a sessão: ele representa falta de permissão, não token vencido.

O campo estável dos erros é `code`. Nunca condicione a interface ao texto de `detail`.

## 7. Estados da aplicação

Existem quatro tipos diferentes de estado; não misture suas responsabilidades:

| Estado | Ferramenta | Exemplos |
| --- | --- | --- |
| Local da tela | React | formulário aberto, input, timer visual |
| Remoto | TanStack Query | perfil, fichas, agenda, progresso |
| Sessão | Supabase Auth | usuário, access token e renovação |
| Offline persistido | Dexie | treino ativo, snapshots de fichas e outbox |

As query keys ficam perto de cada feature. Após uma mutation, atualize o cache diretamente quando
a resposta já traz o recurso novo; invalide somente as leituras realmente afetadas.

No logout, `src/lib/auth/session.ts` encerra a sessão local, limpa o `QueryClient`, cancela o replay
e apaga o IndexedDB daquele usuário. Preserve essa ordem para não reintroduzir dados privados por
um refetch tardio.

## 8. Fluxos principais ponta a ponta

### Convite e ativação

1. Um administrador convida alguém pelo painel em `/perfil`.
2. O backend cria/reaproveita a identidade no Supabase Auth e cria `Profile` como
   `PENDING_INVITE`.
3. O link abre `/convite`; `set-password-form.tsx` define a senha com o Supabase.
4. O convidado preenche o perfil; `profile-form.tsx` envia `PATCH /api/v1/me` com `If-Match`.
5. O administrador ativa a conta. Só então as demais rotas de negócio ficam disponíveis.

### Cadastro e manutenção de treino

As telas de exercícios, fichas e agenda chamam a API diretamente por `apiClient`. A ordem de
dependência é exercício → ficha → agenda → sessão. Ao alterar uma ficha, verifique também agenda,
snapshot offline e execução; arquivamento pode ser mais seguro que exclusão quando já há uso.

### Execução online e offline

1. `src/lib/offline/training.ts` busca a sessão ativa e as fichas; respostas válidas viram
   snapshots por `ownerId`.
2. Ao iniciar, o navegador cria o UUID da sessão e grava primeiro o estado local e a operação.
3. Séries e estado dos exercícios também entram na outbox antes do envio.
4. `src/lib/offline/sync.ts` envia em ordem usando o token atual. Nenhum token é persistido.
5. Falhas transitórias usam backoff; falhas definitivas viram `BLOCKED` para decisão do usuário.
6. Concluir/abandonar usa `Idempotency-Key`, evitando duplicação após perda de rede.

O banco Dexie `gymflow-offline` possui `activeSessions`, `workoutSnapshots` e `outbox`. Toda chave é
escopada por usuário. Uma nova operação offline deve atualizar, no mínimo:

- `src/lib/offline/types.ts`;
- `src/lib/offline/session-state.ts` se houver efeito otimista;
- `src/lib/offline/training.ts` para enfileirar;
- `src/lib/offline/sync.ts` para executar;
- testes de repository, estado e sincronização.

### Fotos privadas

1. A feature reserva a foto na API.
2. O navegador envia o arquivo diretamente para uma URL temporária do Storage.
3. A API confirma tamanho, tipo e existência do objeto.
4. Abrir a foto pede uma URL de leitura curta; a URL nunca é persistida localmente.

Manutenção: `src/features/progress/photos-panel.tsx` no frontend e módulo `photos` no backend.

### Notificações

`notification-settings.tsx` pede permissão ao navegador, cria a `PushSubscription`, registra o
dispositivo e salva a preferência. A entrega não acontece no frontend: o backend planeja e envia
os jobs. `src/app/sw.ts` recebe o Push e trata o clique.

## 9. Contrato com o gym-service

O backend é o proprietário de `../gym-service/openapi/openapi.json`. Nunca edite
`src/lib/api/generated/types.ts` manualmente.

Depois de alterar DTO, endpoint ou resposta no backend:

```bash
cd ../gym-service
npm run openapi:emit

cd ../gym-mobile
npm run api:types
npm run api:types:check
npm run typecheck
```

Revise os dois diffs. Remover campo, trocar tipo ou tornar opcional algo obrigatório pode exigir
migração em etapas ou `/api/v2`. O frontend sempre usa caminhos completos em `/api/v1`.

Contratos que merecem atenção especial:

- datas civis usam `YYYY-MM-DD`; use `src/lib/dates/civil-date.ts` para evitar deslocamento UTC;
- decimais de carga, peso e medidas chegam como string;
- recursos versionados enviam `If-Match` e tratam `RESOURCE_VERSION_CONFLICT`;
- operações offline usam UUID escolhido pelo cliente e, quando exigido, `Idempotency-Key`;
- o frontend não envia `ownerId` para decidir propriedade.

## 10. Onde mexer para cada manutenção

| Necessidade | Arquivos iniciais |
| --- | --- |
| Adicionar página | `src/app/<grupo>/.../page.tsx` e `src/features/<dominio>/` |
| Alterar navegação inferior | `src/components/navigation/bottom-nav.tsx` |
| Alterar regra de rota pública/privada | `src/lib/auth/routes.ts` e `src/proxy.ts` |
| Alterar login/renovação/logout | `src/features/auth/` e `src/lib/auth/` |
| Consumir novo endpoint | contrato no backend, `api:types`, depois a feature |
| Alterar retry/cache | `src/lib/query/query-client.ts` e query da feature |
| Alterar mensagens de API | `src/lib/api/problem.ts` e `src/lib/api/result.ts` |
| Alterar treino em andamento | `src/features/sessions/training-session.tsx` e `src/lib/offline/` |
| Alterar fichas/exercícios/agenda | pasta homônima em `src/features/` |
| Alterar medidas/fotos/gráficos | `src/features/progress/` |
| Alterar instalação/update/Push | `src/features/pwa/`, `src/app/sw.ts`, `serwist.config.js` |
| Alterar tema, contraste ou safe area | `src/styles/globals.css` |
| Alterar variável pública | `.env.example` e `src/lib/config/env.ts` |
| Alterar headers/build | `next.config.ts` |
| Alterar tipos da API | nunca direto; rode `npm run api:types` |
| Alterar deploy/smoke | `docs/PRODUCTION_RUNBOOK.md` e `scripts/smoke.mjs` |

## 11. Checklist para criar ou refinar uma feature

1. Confirme se a regra pertence ao frontend ou ao backend.
2. Se o contrato mudar, implemente primeiro DTO, regra e OpenAPI no `gym-service`.
3. Regenere os tipos e só então escreva a integração.
4. Crie a feature por domínio; deixe a página apenas compor componentes.
5. Defina query key, estados de loading/vazio/erro e invalidações.
6. Trate permissão, conflito, rede e acessibilidade.
7. Se funcionar offline, defina efeito local, persistência, replay e resolução de erro.
8. Escreva teste no nível mais barato que cobre o risco.
9. Rode os gates antes de considerar pronto.

## 12. Testes e gates

Durante a manutenção:

```bash
npm run typecheck
npm test
npm run lint
```

Antes de entregar:

```bash
npm run api:types:check
npm run verify
npm run test:e2e
```

O E2E usa build de produção e cobre Pixel 7, iPhone 13 e 360 px. Na primeira execução, instale os
navegadores com `npx playwright install chromium webkit`.

Para mudanças apenas em Markdown, `npx prettier --check ONBOARDING.md` é suficiente como gate
específico; ainda revise os caminhos citados.

## 13. Diagnóstico de conexão

Em desenvolvimento, o console do navegador registra automaticamente os eventos seguros de
`proxy`, `auth`, `api`, `infra` e `offline`. Preview e produção registram avisos/erros; para ativar
temporariamente o fluxo completo no navegador:

```js
localStorage.setItem('gymflow:diagnostics', 'enabled');
location.reload();
```

Para desligar:

```js
localStorage.removeItem('gymflow:diagnostics');
location.reload();
```

Eventos mais úteis:

- `infra request.failed`: navegador não alcançou `/health` ou `/ready`;
- `infra readiness.result`: informa cada dependência como `up`, `down` ou `unconfigured`;
- `api request.network_failed`: falha antes de existir resposta HTTP;
- `api request.finished`: status, duração e `requestId` para correlacionar com a API;
- `api session_refresh.*`: tentativa de recuperar um `401`;
- `proxy auth.validation_failed`: Next.js não conseguiu validar a sessão no Supabase;
- `offline operation.failed`: replay bloqueado ou aguardando nova tentativa.

Os logs nunca incluem corpo, token, e-mail, query string, URL assinada ou UUID de recurso. Não
adicione `console.log` paralelo com payload para “ajudar”: amplie o logger central e seus testes.

## 14. Pontos de atenção para refinamento

- `training-session.tsx`, `workout-manager.tsx`, `profile-form.tsx` e
  `exercise-library.tsx` concentram muita UI e coordenação. Ao fazer mudanças grandes, prefira
  extrair hooks de dados, subcomponentes e funções puras junto com testes, sem criar abstrações
  genéricas antes de haver repetição real.
- O Proxy usa `getClaims()`: mantém validação criptográfica do JWT e evita uma chamada externa em
  cada navegação quando a chave pública já está em cache. Não troque por `getSession()`, que apenas
  lê o cookie sem validar sua assinatura.
- A CSP estrita ainda não está ativa. Não compense com `unsafe-inline`; siga o gate registrado no
  runbook de produção.
- IndexedDB contém dados pessoais e de treino, embora não contenha tokens. Toda saída de conta,
  troca de usuário e fluxo de exclusão futuro deve continuar apagando esses dados.
- Nunca copie arquitetura ou variáveis do `gym-mobile-lovable`; ele é somente referência visual.

## 15. Fontes de verdade

- [README.md](README.md): execução, estado atual, scripts e decisões já entregues;
- [PLANO_IMPLEMENTACAO.md](PLANO_IMPLEMENTACAO.md): escopo, fases e decisões pendentes;
- [docs/PRODUCTION_RUNBOOK.md](docs/PRODUCTION_RUNBOOK.md): preview, produção e rollback;
- `src/lib/api/generated/types.ts`: contrato tipado gerado, nunca editado à mão;
- `../gym-service/openapi/openapi.json`: fonte original do contrato HTTP.

Quando documento e código divergirem, confirme pelo código e corrija o documento no mesmo trabalho.
