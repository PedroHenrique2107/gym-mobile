'use client';

import type { QueryClient } from '@tanstack/react-query';

import { setSessionExpiredHandler, setSessionRefresher, setTokenProvider } from '@/lib/api/client';

import { getSupabaseBrowserClient, resetSupabaseBrowserClient } from './supabase-browser';

/**
 * Liga a sessão do Supabase ao cliente de API.
 *
 * O cliente HTTP não conhece o Supabase: ele pede um token a um provedor. Esta
 * função é o único ponto onde os dois se encontram, o que mantém o cliente
 * testável sem sessão e permitiria trocar o provedor de identidade sem tocá-lo.
 */
export function connectSessionToApi(onExpired: () => void): void {
  setTokenProvider(async () => {
    const supabase = getSupabaseBrowserClient();

    // `getSession` já devolve o token renovado quando necessário: o cliente do
    // Supabase mantém um temporizador e troca o refresh token sozinho. Pedir a
    // cada chamada, em vez de guardar, é o que evita usar um token vencido.
    const { data } = await supabase.auth.getSession();

    return data.session?.access_token ?? null;
  });

  setSessionRefresher(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.refreshSession();

    return error ? null : (data.session?.access_token ?? null);
  });

  setSessionExpiredHandler(onExpired);
}

/** Desfaz a ligação, para não deixar callbacks apontando para uma árvore morta. */
export function disconnectSessionFromApi(): void {
  setTokenProvider(null);
  setSessionRefresher(null);
  setSessionExpiredHandler(null);
}

/**
 * Encerra a sessão e apaga todo rastro local do usuário.
 *
 * A ordem importa. O cache do TanStack Query é limpo **depois** do logout no
 * Supabase, porque limpar antes deixaria uma janela em que a interface já não
 * tem dados mas a sessão ainda vale — e um refetch nesse intervalo repovoaria o
 * cache com dados do usuário que está saindo.
 *
 * O plano exige que logout limpe cache, IndexedDB e dados temporários. O
 * IndexedDB entra em M6, quando passar a existir.
 */
export async function signOutAndClear(queryClient: QueryClient): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  try {
    // `scope: 'local'` encerra apenas este dispositivo. Sair de todos seria uma
    // surpresa desagradável: quem clica em "sair" no celular não espera perder
    // a sessão do computador.
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // Falha de rede não pode impedir o logout local. Se a limpeza não
    // acontecesse, o usuário continuaria vendo os próprios dados numa tela que
    // ele acredita ter fechado.
  }

  disconnectSessionFromApi();

  // `clear` e não `invalidateQueries`: invalidar mantém os dados em memória até
  // o próximo refetch, e eles pertencem a quem acabou de sair.
  queryClient.clear();

  resetSupabaseBrowserClient();
}
