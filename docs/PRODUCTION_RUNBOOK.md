# Runbook de produção do gym-mobile

Este documento transforma a M7 em uma sequência verificável. Ele não contém
segredos e não autoriza deploy automático: a publicação continua sendo uma
ação deliberada no projeto Vercel.

## 1. Dados externos necessários

Antes do primeiro preview, obtenha:

- URL HTTPS pública do `gym-service` na Railway;
- URL e publishable key do projeto Supabase usado pelo ambiente;
- chave pública VAPID gerada no `gym-service`;
- projeto Vercel conectado a este repositório;
- domínio final, quando estiver definido.

Nunca copie para a Vercel `SUPABASE_SECRET_KEY`, `DATABASE_URL`, `DIRECT_URL` ou
`VAPID_PRIVATE_KEY`. Tudo que começa com `NEXT_PUBLIC_` entra no bundle enviado
ao navegador.

## 2. Variáveis da Vercel

Configure valores diferentes em Preview e Production:

| Variável | Preview | Production |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_ENV` | `preview` | `production` |
| `NEXT_PUBLIC_API_URL` | URL da API de validação | URL da API de produção |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública do Supabase | URL pública do Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key | publishable key |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | chave pública VAPID | chave pública VAPID |

Esses valores são incorporados durante o build. Alterar uma variável exige um
novo deployment; reiniciar uma instância antiga não atualiza o bundle.

## 3. Gate antes do preview

```bash
npm ci
npm run api:types:check
npm run verify
npm run test:e2e
```

O backend compatível deve ser publicado antes do frontend que depende dele.

## 4. Smoke do deployment

Para uma URL pública:

```bash
npm run smoke -- https://preview.example.com
```

O smoke valida landing, login, fallback offline, manifesto, ícones, Service
Worker e headers de segurança. Ele não autentica nem altera dados.

Para um preview protegido, crie na Vercel um Protection Bypass for Automation,
salve o valor como secret `VERCEL_AUTOMATION_BYPASS_SECRET` no GitHub e execute
manualmente o workflow **Smoke do preview**, informando a URL. O secret segue
somente no header recomendado pela Vercel e nunca aparece na URL ou no log.

## 5. Validação em aparelhos reais

Execute no Android/Chrome e no iPhone/Safari:

1. abrir o deployment e instalar/adicionar à tela inicial;
2. entrar, iniciar um treino e registrar ao menos uma série;
3. desligar a rede, recarregar o app instalado e continuar o treino;
4. religar a rede e confirmar que cada operação sincronizou uma única vez;
5. fechar e reabrir durante um treino para validar persistência;
6. permitir notificações e confirmar recebimento no horário configurado;
7. publicar uma nova versão e confirmar que a atualização não interrompe a
   sessão ativa.

Registre aparelho, versão do sistema, navegador, horário e resultado. Uma
captura de tela ajuda a diagnosticar safe area, instalação e permissão de push.

## 6. CSP

A CSP com nonce não será ativada antes da medição do preview. No App Router ela
obriga renderização dinâmica, remove a otimização estática e impede o shell PWA
de aproveitar o mesmo modelo de cache. `script-src 'unsafe-inline'` também não
será usado apenas para aparentar proteção.

Depois do preview, medir Web Vitals e custo de renderização. Se a exigência de
segurança justificar o custo, testar nonce em uma branch; a alternativa SRI do
Next continua experimental e limitada ao webpack.

## 7. Promoção e rollback

Promova para produção somente depois de CI, smoke e aparelhos reais aprovados.
Se o frontend publicado falhar, use o Instant Rollback da Vercel para apontar o
domínio ao deployment anterior e execute novamente `npm run smoke`. Um rollback
restaura um build anterior, inclusive os valores públicos incorporados naquele
build; ele não reverte mudanças no backend ou no banco.

