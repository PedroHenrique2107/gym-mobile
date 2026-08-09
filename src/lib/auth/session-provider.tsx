'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { isAuthConfigured } from '@/lib/config/env';

import { LOGIN_ROUTE } from './routes';
import { connectSessionToApi, disconnectSessionFromApi, signOutAndClear } from './session';
import { getSupabaseBrowserClient } from './supabase-browser';

/**
 * Liga a sessão do Supabase ao cliente de API e reage ao fim dela.
 *
 * Precisa ser um componente, e não uma chamada solta em módulo, por dois
 * motivos: depende do `QueryClient` da árvore para limpar o cache, e precisa do
 * router para navegar quando a sessão morre.
 */
export function SessionProvider({ children }: { readonly children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthConfigured) {
      return;
    }

    const handleExpired = () => {
      // A sessão acabou de forma irrecuperável. Limpar e voltar ao login é
      // melhor que deixar a interface repetindo chamadas que nunca funcionarão.
      void signOutAndClear(queryClient).then(() => {
        router.replace(LOGIN_ROUTE);
      });
    };

    connectSessionToApi(handleExpired);

    /**
     * Reage a mudanças de sessão vindas de fora desta aba.
     *
     * O Supabase sincroniza a sessão entre abas. Sem escutar, sair em uma aba
     * deixaria as outras exibindo dados de alguém que já saiu — e um refetch
     * naquelas abas repovoaria o cache.
     */
    const supabase = getSupabaseBrowserClient();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        queryClient.clear();
        router.replace(LOGIN_ROUTE);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // O middleware já atualizou o cookie; recarregar os dados do servidor
        // garante que a página reflita a sessão nova.
        router.refresh();
      }
    });

    return () => {
      data.subscription.unsubscribe();
      disconnectSessionFromApi();
    };
  }, [queryClient, router]);

  return <>{children}</>;
}
