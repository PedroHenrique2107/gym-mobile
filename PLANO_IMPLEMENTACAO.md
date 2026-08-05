# Plano de implementação — `gym-mobile`

## 1. Finalidade deste documento

Este documento define o que será construído no repositório `gym-mobile`, como o frontend será organizado e como ele se comunicará com o `gym-service`.

O repositório será responsável pela experiência web mobile-first, pela Progressive Web App (PWA), pela autenticação no navegador, pelo consumo da API, pelo funcionamento offline controlado e pelo deploy do frontend na Vercel.

> Estado atual: a branch `refactor/gym-mobile` contém apenas documentação. A aplicação será criada do zero. O repositório `gym-mobile-lovable` será usado exclusivamente como referência visual, editorial e de fluxo; ele não será editado nem adotado como base arquitetural.

## 2. Responsabilidades do `gym-mobile`

O frontend será responsável por:

- renderizar toda a interface do aplicativo;
- oferecer navegação mobile-first e acessível;
- conduzir login, aceite de convite, recuperação de senha e logout;
- manter e renovar a sessão fornecida pelo Supabase Auth;
- enviar o access token em todas as chamadas privadas ao `gym-service`;
- validar formulários antes do envio, sem substituir a validação do backend;
- consumir exclusivamente a API versionada para dados de negócio;
- administrar cache de leitura, estados de carregamento, erros e invalidações;
- manter o treino ativo disponível durante instabilidade de conexão;
- enfileirar alterações offline e sincronizá-las com segurança;
- disponibilizar manifesto, Service Worker, instalação e atualização da PWA;
- oferecer exportação e exclusão de conta por meio da API;
- coletar métricas técnicas permitidas, sem registrar dados físicos sensíveis.

O frontend não será responsável por:

- acessar diretamente tabelas de negócio do PostgreSQL/Supabase;
- executar regras críticas de autorização;
- decidir se um usuário pode acessar dados de outro usuário;
- possuir `DATABASE_URL`, credenciais do Prisma ou chaves administrativas;
- utilizar `SUPABASE_SECRET_KEY`/`SERVICE_ROLE_KEY`;
- executar migrations;
- gerar URLs administrativas de Storage sem autorização da API;
- calcular resultados definitivos que precisem ser persistidos como regra de negócio.

## 3. Stack definida

|       Área        |                         Tecnologia                       |
| ----------------- | -------------------------------------------------------- |
| Runtime e pacotes | Node.js 22 LTS e npm                                     |
| Framework         | Next.js com App Router                                   |
| Interface         | React e TypeScript em modo estrito                       |
| Estilos           | Tailwind CSS 4                                           |
| Componentes       | shadcn/ui e Radix UI                                     |
| Ícones            | Lucide React                                             |
| Formulários       | React Hook Form e Zod                                    |
| Estado remoto     | TanStack Query                                           |
| Gráficos          | Recharts                                                 |
| Cliente de API    | `openapi-typescript` e `openapi-fetch`                   |
| Autenticação      | Supabase Auth, `@supabase/supabase-js` e `@supabase/ssr` |
| PWA               | Serwist e Service Worker                                 |
| Dados offline     | IndexedDB por meio de Dexie                              |
| Testes            | Vitest, Testing Library e Playwright                     |
| Qualidade         | ESLint, Prettier e TypeScript strict                     |
| Deploy            | Vercel                                                   |

As versões exatas serão fixadas no `package-lock.json` durante a fundação do projeto. Não serão mantidos dois gerenciadores de pacotes ou dois lockfiles.

## 4. Arquitetura prevista

O frontend será organizado por domínio, evitando componentes de página que concentrem consulta, mutação, validação e apresentação no mesmo arquivo.

```text
gym-mobile/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   ├── (auth)/
│   │   ├── (protected)/
│   │   ├── layout.tsx
│   │   └── manifest.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── navigation/
│   │   └── feedback/
│   ├── features/
│   │   ├── auth/
│   │   ├── profile/
│   │   ├── exercises/
│   │   ├── workouts/
│   │   ├── sessions/
│   │   ├── schedule/
│   │   ├── progress/
│   │   └── settings/
│   ├── lib/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── offline/
│   │   ├── pwa/
│   │   └── validation/
│   └── styles/
├── public/
│   └── icons/
├── tests/
│   └── e2e/
└── package.json
```

Regras estruturais:

- `src/app` conterá composição de rotas e layouts, não regras de negócio extensas;
- `src/features` concentrará componentes, hooks, schemas e adaptadores de cada domínio;
- `src/lib/api` conterá o cliente HTTP compartilhado e os tipos gerados do OpenAPI;
- dados recebidos da API não serão duplicados em um store global sem necessidade;
- TanStack Query será a fonte de verdade dos dados remotos;
- estado efêmero será mantido com React; uma biblioteca global adicional só será adotada se surgir necessidade comprovada;
- dados offline persistentes ficarão em stores Dexie separados por usuário autenticado.

## 5. Rotas e experiência planejadas

### Área pública e autenticação

- `/`: apresentação realista do produto, sem anunciar funcionalidades ainda indisponíveis;
- `/entrar`: login por e-mail e senha;
- `/convite`: aceite de convite e definição de senha;
- `/recuperar-senha`: solicitação de recuperação;
- `/redefinir-senha`: definição de uma nova senha;
- páginas de erro, indisponibilidade e offline.

### Área autenticada

- `/inicio`: treino do dia, resumo semanal e último desempenho;
- `/treinar`: seleção e início de um treino;
- `/treinos`: gerenciamento de fichas;
- `/treinos/[id]`: edição dos exercícios, metas e ordem da ficha;
- `/treino-ativo/[id]`: execução com uma mão, séries, cargas e cronômetro;
- `/biblioteca`: busca, filtros e exercícios personalizados;
- `/agenda`: recorrência semanal e reagendamentos;
- `/progresso`: histórico, gráficos, recordes e medidas;
- `/perfil`: dados pessoais, objetivo e preferências;
- `/configuracoes`: PWA, notificações, privacidade, exportação e exclusão.

A navegação principal terá cinco áreas: Início, Treinar, Agenda, Progresso e Perfil. A Biblioteca e o gerenciamento de fichas serão acessados a partir de Treinar.

## 6. Direção visual e acessibilidade

O `gym-mobile-lovable` servirá de referência para:

- tema escuro em grafite com cor de ação verde-limão;
- cards arredondados, sheets inferiores e hierarquia visual curta;
- navegação inferior fixa;
- skeletons, estados vazios e feedback por toast;
- linguagem direta e motivacional;
- experiência otimizada para uso com uma mão.

A nova implementação corrigirá as limitações do protótipo:

- documento em `pt-BR`;
- zoom do navegador permitido;
- safe areas inferior e superior;
- alvos de toque de no mínimo 44 px;
- contraste verificável e foco visível;
- suporte primário a 360, 390 e 430 px, com adaptação funcional para tablet e desktop;
- redução de movimento quando solicitada pelo sistema;
- copy ligada ao estado real das funcionalidades.

O nome `GymFlow` e a identidade dark/verde-limão são nomes e direção de trabalho até a aprovação definitiva de marca e assets.

## 7. Comunicação com o `gym-service`

### Fluxo principal

```text
Usuário
  → Next.js PWA
  → Supabase Auth em fluxo PKCE
  → access token JWT
  → Authorization: Bearer <token>
  → gym-service /api/v1
  → validação de identidade, status, papel e propriedade
  → Prisma
  → PostgreSQL no Supabase
```

O frontend não confiará em dados do token para autorizar ações sensíveis. Claims poderão orientar a interface, mas o `gym-service` sempre tomará a decisão final.

### Contrato HTTP

- URL base configurada por `NEXT_PUBLIC_API_URL`;
- prefixo obrigatório `/api/v1`;
- JSON como formato principal;
- `Authorization: Bearer <access-token>` em rotas privadas;
- `Content-Type: application/json` nas operações JSON;
- `Idempotency-Key` em criações e operações que possam ser reenviadas offline;
- `X-Request-Id` gerado pelo cliente quando útil e propagado pelo backend;
- `If-Match`/versão do recurso em alterações sujeitas a concorrência;
- instantes em ISO 8601 UTC;
- datas civis em `YYYY-MM-DD` acompanhadas do fuso IANA quando necessário;
- identificadores UUID gerados no cliente para entidades criadas offline;
- paginação por cursor em históricos e catálogos extensos.

Erros seguirão `application/problem+json` com uma estrutura equivalente a:

```json
{
  "type": "https://api.exemplo.com/problems/validation-error",
  "title": "Dados inválidos",
  "status": 422,
  "detail": "Revise os campos informados.",
  "instance": "/api/v1/workouts",
  "code": "VALIDATION_ERROR",
  "requestId": "uuid",
  "errors": {
    "name": ["Informe um nome válido."]
  }
}
```

### Tipos e compatibilidade

O `gym-service` será a fonte de verdade do OpenAPI. O `gym-mobile` terá um script que:

1. obtém o `openapi.json` publicado ou gerado pelo backend;
2. gera tipos TypeScript com `openapi-typescript`;
3. instancia o cliente com `openapi-fetch`;
4. executa typecheck para detectar divergências.

Alterações compatíveis serão aditivas dentro de `/api/v1`. Mudanças incompatíveis exigirão uma nova versão da API e um período de convivência entre versões.

### Sessão e falhas de autenticação

- a sessão será mantida pelo Supabase Auth usando PKCE e cookies compatíveis com SSR;
- em `401`, o cliente tentará atualizar a sessão uma única vez e repetirá a requisição uma única vez;
- se a renovação falhar, cache privado e dados offline daquele usuário serão bloqueados e a aplicação voltará ao login;
- `403` não acionará logout: a interface exibirá ausência de permissão;
- logout e exclusão de conta limparão TanStack Query, IndexedDB e dados temporários do usuário.

## 8. Funcionamento offline

Offline não será implementado como cache indiscriminado de respostas privadas.

### Dados disponíveis offline

- shell e assets essenciais da aplicação;
- treino planejado e ficha ativa;
- biblioteca básica de exercícios;
- histórico recente previamente sincronizado;
- registros da sessão atual;
- cronômetro de descanso.

Fotos de progresso, operações administrativas e alterações de conta exigirão conexão.

### Estratégia de sincronização

- Dexie armazenará snapshots locais e uma outbox por usuário;
- a outbox armazenará mutações semânticas, nunca o header `Authorization`, JWT ou refresh token;
- no replay, o cliente obterá uma sessão atual e adicionará um access token válido à requisição;
- novas sessões, exercícios executados e séries usarão UUID criado no cliente;
- cada mutação terá `Idempotency-Key` estável;
- a fila manterá ordem, tentativas, timestamp e estado do envio;
- erros de rede e `5xx` serão tentados novamente com backoff;
- erros `4xx` não serão repetidos automaticamente sem correção;
- alterações concorrentes usarão versão do recurso e poderão retornar `409 Conflict`;
- registros de séries serão reconciliados por ID, evitando duplicação;
- templates e perfil não serão sobrescritos silenciosamente quando houver conflito;
- em navegadores sem Background Sync, a fila será processada ao abrir a PWA ou recuperar conexão.

### Cronômetro

O cronômetro armazenará um horário absoluto de término, e não dependerá somente de `setInterval`. Ao retornar do segundo plano, o tempo será recalculado corretamente.

Som, vibração e notificação com o aplicativo minimizado serão tratados como melhoria progressiva, pois dependem do sistema, navegador, instalação da PWA e permissões do usuário.

### Atualizações da PWA

Uma nova versão poderá ser baixada automaticamente, mas não substituirá a versão em execução no meio de um treino. A interface avisará sobre a atualização e ativará a nova versão após o treino ou confirmação explícita.

## 9. Segurança e privacidade no frontend

- nenhum segredo administrativo será exposto em variáveis `NEXT_PUBLIC_*`;
- apenas URL e publishable key do Supabase poderão chegar ao navegador;
- CSP, headers de segurança e política de origem serão configurados;
- conteúdo vindo do usuário não será renderizado como HTML não sanitizado;
- mensagens internas da API não serão exibidas diretamente;
- ações destrutivas exigirão confirmação e, quando necessário, reautenticação;
- fotos privadas nunca terão URL pública permanente;
- logs do navegador não conterão JWT, e-mail, fotos, medidas ou conteúdo de treino;
- dados offline serão separados pelo ID do usuário e removidos no logout;
- termos e política terão versão registrada no backend;
- a interface oferecerá exportação e solicitação de exclusão de conta.

## 10. Variáveis de ambiente previstas

O repositório terá `.env.example` apenas com nomes e exemplos não sensíveis:

```dotenv
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_example
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```

Arquivos `.env`, `.env.local` e equivalentes reais serão ignorados pelo Git. Nenhuma variável do `gym-mobile-lovable` será copiada.

## 11. Fases de implementação

### Fase M1 — Fundação

- criar Next.js, TypeScript strict, Tailwind e estrutura por features;
- criar `.gitignore`, `.env.example` e validação de configuração;
- configurar lint, format, typecheck, testes e build;
- criar tema, primitives essenciais, layout e páginas de erro;
- preparar o cliente OpenAPI vazio e healthcheck da API.

Critério de saída: aplicação inicia e compila, possui navegação básica, não contém segredos e passa nas verificações estáticas.

### Fase M2 — Autenticação e shell

- integrar Supabase Auth em PKCE;
- implementar login, convite, recuperação, redefinição e logout;
- criar proteção de rotas e limpeza de sessão;
- integrar `GET /api/v1/me`;
- construir navegação principal e estados 401/403.

Critério de saída: usuário autorizado entra, mantém a sessão, sai com limpeza local e não acessa rotas protegidas sem autenticação.

### Fase M3 — Perfil, biblioteca, fichas e agenda

- implementar onboarding, perfil e objetivo;
- construir biblioteca, filtros e exercícios personalizados;
- criar CRUD de fichas, ordenação e metas;
- criar agenda semanal, descanso e reagendamento;
- adicionar confirmações e tratamento completo de erros.

Critério de saída: todos os fluxos usam somente a API e ficam isolados por usuário.

### Fase M4 — Execução do treino

- iniciar e retomar uma sessão;
- criar snapshot do treino recebido da API;
- registrar séries, carga, repetições, esforço, dor e observações;
- implementar ações rápidas e cronômetro;
- finalizar treino completo ou parcial;
- mostrar desempenho anterior e sugestão recebida da API.

Critério de saída: uma sessão completa pode ser registrada sem perda de dados, inclusive após recarregar a página.

### Fase M5 — Progresso e privacidade

- histórico detalhado;
- gráficos e recordes;
- peso, medidas e fotos privadas;
- preferências e consentimentos;
- exportação e exclusão de conta.

Critério de saída: indicadores usam dados reais, fotos exigem autorização e os fluxos de privacidade são verificáveis.

### Fase M6 — PWA e offline

- manifest, ícones, Service Worker e tela offline;
- IndexedDB, outbox, replay idempotente e resolução de conflito;
- atualização segura da aplicação;
- instalação e testes reais em Android e iOS;
- push e lembretes quando o núcleo estiver estável.

Critério de saída: treino principal funciona com rede instável, sincroniza sem duplicar séries e não interrompe uma sessão ao atualizar.

### Fase M7 — Produção

- otimizar bundle, imagens, fontes e carregamento por rota;
- validar acessibilidade e Web Vitals;
- configurar Vercel e variáveis por ambiente;
- preparar workflow de CI;
- documentar instalação, atualização e suporte.

Critério de saída: lint, typecheck, testes, build e smoke tests aprovados no ambiente de preview.

## 12. Estratégia de testes

### Unitários e componentes

- schemas e transformações de formulário;
- componentes críticos de treino;
- cálculo visual do cronômetro por timestamp;
- tratamento de `401`, `403`, `409` e validação;
- fila offline, backoff e deduplicação;
- limpeza de dados por usuário.

### Integração

- hooks TanStack Query com API simulada;
- autenticação e renovação de sessão;
- atualização do cache após mutações;
- retomada de treino e sincronização.

### E2E

- aceitar convite, entrar, recuperar senha e sair;
- preencher perfil;
- criar ficha e agenda;
- executar treino e consultar histórico;
- ficar offline, registrar séries e sincronizar;
- exportar e excluir conta;
- impedir acesso entre usuários.

### Dispositivos

- Android/Chrome instalado e no navegador;
- iPhone/Safari instalado na tela inicial;
- telas de 360, 390 e 430 px;
- teclado móvel, safe areas, rotação bloqueada em portrait quando suportada;
- rede lenta, queda de conexão e atualização durante treino.

## 13. Deploy e operação

- Vercel hospedará o frontend;
- previews usarão ambiente e API de desenvolvimento controlados;
- produção usará domínio e variáveis próprios;
- respostas autenticadas não poderão ser compartilhadas por cache de CDN;
- deploy do frontend só ocorrerá após o backend compatível já estar disponível;
- nenhuma mudança incompatível em `/api/v1` será assumida pelo frontend;
- releases e workflows poderão ser preparados, mas nenhum commit será criado pelo Codex enquanto essa restrição estiver ativa.

## 14. Decisões de produto ainda pendentes

Estas decisões deverão ser confirmadas antes da fase correspondente:

- nome e identidade visual definitivos;
- cadastro exclusivamente por convite ou abertura de cadastro público;
- alcance administrativo sobre dados dos membros;
- origem e licença de imagens/vídeos de exercícios;
- regra final de progressão e incremento padrão de carga;
- prioridade de Web Push na primeira versão;
- texto jurídico e política de retenção/exclusão;
- domínio de produção e projetos Supabase/Vercel que serão usados.

Até a decisão, a implementação deverá preservar a opção mais restritiva e segura, sem inventar conteúdo legal, assets ou permissões.

## 15. Definição de pronto do `gym-mobile`

O frontend será considerado pronto para o MVP quando:

- todas as funções descritas como entregues estiverem realmente operacionais;
- nenhuma regra de autorização depender somente da interface;
- não existir acesso direto às tabelas de negócio;
- os contratos forem derivados do OpenAPI do `gym-service`;
- o treino ativo sobreviver a atualização e instabilidade de rede;
- sincronização não duplicar nem perder séries;
- instalação, atualização e offline forem testados em Android e iPhone;
- acessibilidade, lint, typecheck, testes e build estiverem aprovados;
- nenhum segredo estiver presente no código, bundle ou histórico novo;
- o `gym-mobile-lovable` permanecer sem alterações.
