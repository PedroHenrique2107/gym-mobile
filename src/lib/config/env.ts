import { z } from 'zod';

/**
 * Configuracao publica da aplicacao.
 *
 * Somente variaveis `NEXT_PUBLIC_*` aparecem aqui, e isso e uma restricao de
 * seguranca, nao uma limitacao tecnica: tudo neste arquivo e incorporado ao
 * bundle e fica visivel para qualquer usuario. Segredo administrativo,
 * `DATABASE_URL` e chave privada de VAPID pertencem exclusivamente ao
 * `gym-service`.
 *
 * As referencias a `process.env` sao escritas de forma literal de proposito. O
 * Next substitui `process.env.NEXT_PUBLIC_X` em tempo de build por analise
 * estatica; acesso dinamico como `process.env[nome]` resultaria em `undefined`
 * no navegador.
 */

const httpUrl = z
  .string()
  .min(1)
  .refine((value) => /^https?:\/\//.test(value), {
    message: 'deve ser uma URL http:// ou https://',
  })
  // Barra final duplicaria a barra ao concatenar o prefixo da API.
  .transform((value) => value.replace(/\/+$/, ''));

const envSchema = z.object({
  appEnv: z.enum(['development', 'preview', 'production']).default('development'),

  /** Origem do `gym-service`, sem `/api/v1` — o cliente HTTP adiciona. */
  apiUrl: httpUrl,

  /**
   * Credenciais do Supabase Auth. Opcionais nesta fase porque a autenticacao
   * entra em M2; `isAuthConfigured` diz se o fluxo pode ser oferecido.
   */
  supabaseUrl: httpUrl.optional().or(z.literal('').transform(() => undefined)),
  supabasePublishableKey: z
    .string()
    .optional()
    .transform((value) => (value ? value : undefined)),

  /** Chave publica de Web Push. Entra em M6. */
  vapidPublicKey: z
    .string()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type Env = z.infer<typeof envSchema>;

function readEnv(): Env {
  const result = envSchema.safeParse({
    appEnv: process.env.NEXT_PUBLIC_APP_ENV || undefined,
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  });

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(raiz)'}: ${issue.message}`)
      .join('\n');

    // Falha no import, e nao no primeiro uso: um erro de configuracao deve
    // aparecer no build ou no start, nao quando o usuario clica em algo. A
    // mensagem cita nome e motivo, nunca o valor recebido.
    throw new Error(
      `Configuracao invalida do gym-mobile.\n${issues}\n\nConsulte .env.example e reinicie apos alterar.`,
    );
  }

  return result.data;
}

export const env = readEnv();

/** A autenticacao so pode ser oferecida quando as duas variaveis existem. */
export const isAuthConfigured = Boolean(env.supabaseUrl && env.supabasePublishableKey);

/** Web Push depende da chave publica chegar ao navegador. */
export const isPushConfigured = Boolean(env.vapidPublicKey);

export const isProduction = env.appEnv === 'production';

/** Service Worker somente no build/start; em `next dev` ele causaria cache obsoleto. */
export const isProductionBuild = process.env.NODE_ENV === 'production';
