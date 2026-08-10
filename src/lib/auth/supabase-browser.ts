'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

import { env, isAuthConfigured } from '@/lib/config/env';

/**
 * Cliente do Supabase Auth no navegador.
 *
 * Guardado em módulo, e não recriado a cada chamada. O cliente mantém o
 * temporizador de renovação da sessão e a assinatura de eventos de autenticação;
 * criar uma instância nova a cada render produziria vários temporizadores
 * concorrentes tentando renovar o mesmo token — e renovações simultâneas
 * invalidam umas às outras no Supabase.
 *
 * Diferente do backend, aqui um cliente de módulo é seguro: o navegador atende
 * um único usuário.
 */
let client: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!isAuthConfigured || !env.supabaseUrl || !env.supabasePublishableKey) {
    // Falha alta e explícita. A alternativa — devolver um cliente inerte —
    // faria o login parecer não responder, sem nenhuma pista da causa.
    throw new Error(
      'Supabase Auth nao esta configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }

  client ??= createBrowserClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: {
      /**
       * PKCE, exigido pelo plano.
       *
       * No fluxo implícito o token viaja no fragmento da URL, onde fica
       * exposto ao histórico do navegador, a extensões e a qualquer script da
       * página. O PKCE troca um código de uso único por token em uma chamada
       * de servidor, e o código sozinho não serve para ninguém.
       */
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      // O token de convite e o de recuperação chegam na URL; o cliente precisa
      // detectá-los para completar o fluxo.
      detectSessionInUrl: true,
    },
  });

  return client;
}

/**
 * Descarta a instância guardada.
 *
 * Chamado no logout, junto da limpeza de cache. Sem isso, o temporizador de
 * renovação continuaria vivo tentando renovar uma sessão que já não existe.
 */
export function resetSupabaseBrowserClient(): void {
  client = null;
}
