import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

import { env, isAuthConfigured } from '@/lib/config/env';

/**
 * Cliente do Supabase Auth em Server Components e Route Handlers.
 *
 * Criado por requisição, nunca guardado em módulo: em SSR um cliente de módulo
 * seria compartilhado entre requisições de usuários diferentes, e a sessão de um
 * apareceria para outro.
 *
 * A escrita de cookies falha silenciosamente em Server Components, e isso é
 * esperado — o Next não permite alterar cabeçalhos depois que a renderização
 * começou. Quem renova a sessão e grava o cookie é o middleware, que roda antes.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  if (!isAuthConfigured || !env.supabaseUrl || !env.supabasePublishableKey) {
    throw new Error(
      'Supabase Auth nao esta configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }

  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: { flowType: 'pkce' },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component: o Next bloqueia escrita de cookie aqui. Ignorar é
          // correto porque o middleware já renovou a sessão nesta requisição —
          // lançar quebraria a renderização por um efeito colateral opcional.
        }
      },
    },
  });
}

/**
 * Sessão do usuário no servidor, ou `null`.
 *
 * Usa `getUser()` e não `getSession()`. A diferença é de segurança e não de
 * estilo: `getSession()` lê o cookie e confia nele, enquanto `getUser()` valida
 * o token contra o Supabase. Como o cookie chega do navegador, confiar nele sem
 * validar permitiria a qualquer pessoa forjar uma sessão editando o próprio
 * cookie.
 */
export async function getServerUser(): Promise<{ id: string; email: string | null } | null> {
  if (!isAuthConfigured) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return { id: data.user.id, email: data.user.email ?? null };
}

/** Access token atual, para chamadas ao `gym-service` feitas no servidor. */
export async function getServerAccessToken(): Promise<string | null> {
  if (!isAuthConfigured) {
    return null;
  }

  const supabase = await getSupabaseServerClient();

  // Aqui `getSession` é adequado: o objetivo é obter o token para repassar, e
  // quem o valida de verdade é o gym-service, contra o JWKS.
  const { data } = await supabase.auth.getSession();

  return data.session?.access_token ?? null;
}
