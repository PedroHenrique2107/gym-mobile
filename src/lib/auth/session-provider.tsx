'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { isAuthConfigured } from '@/lib/config/env';
import { describeDiagnosticError, logDiagnostic } from '@/lib/diagnostics/logger';
import { clearOfflineUser } from '@/lib/offline/repository';
import { cancelOutboxSync, syncOutbox } from '@/lib/offline/sync';

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
      logDiagnostic('warn', 'auth', 'provider.unconfigured');
      return;
    }

    logDiagnostic('info', 'auth', 'provider.started');

    const handleExpired = () => {
      // A sessão acabou de forma irrecuperável. Limpar e voltar ao login é
      // melhor que deixar a interface repetindo chamadas que nunca funcionarão.
      logDiagnostic('error', 'auth', 'session.expired');
      void signOutAndClear(queryClient)
        .then(() => {
          logDiagnostic('info', 'auth', 'session.local_data_cleared');
          router.replace(LOGIN_ROUTE);
        })
        .catch((error: unknown) => {
          logDiagnostic('error', 'auth', 'session.cleanup_failed', {
            ...describeDiagnosticError(error),
          });
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
    let ownerId: string | null = null;

    const synchronize = (currentOwnerId: string) => {
      logDiagnostic('info', 'offline', 'sync.requested', { online: navigator.onLine });
      void syncOutbox(currentOwnerId, { force: true })
        .then(async (result) => {
          logDiagnostic(result.blocked ? 'warn' : 'info', 'offline', 'sync.finished', {
            sent: result.sent,
            pending: result.pending,
            blocked: result.blocked,
          });
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['sessions'] }),
            queryClient.invalidateQueries({ queryKey: ['workouts'] }),
          ]);
        })
        .catch((error: unknown) => {
          logDiagnostic('error', 'offline', 'sync.unexpected_failure', {
            ...describeDiagnosticError(error),
          });
        });
    };

    void supabase.auth
      .getSession()
      .then(({ data: current }) => {
        ownerId = current.session?.user.id ?? null;
        logDiagnostic('info', 'auth', 'session.initialized', {
          authenticated: ownerId !== null,
          online: navigator.onLine,
        });
        if (ownerId && navigator.onLine) synchronize(ownerId);
      })
      .catch((error: unknown) => {
        logDiagnostic('error', 'auth', 'session.initialization_failed', {
          ...describeDiagnosticError(error),
        });
      });

    const handleOnline = () => {
      logDiagnostic('info', 'network', 'browser.online');
      if (ownerId) synchronize(ownerId);
    };
    window.addEventListener('gymflow:online', handleOnline);

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      logDiagnostic(event === 'SIGNED_OUT' ? 'warn' : 'info', 'auth', 'session.state_changed', {
        authEvent: event,
        authenticated: Boolean(session?.user),
      });

      if (event === 'SIGNED_OUT') {
        const previousOwnerId = ownerId;
        ownerId = null;
        if (previousOwnerId) {
          cancelOutboxSync(previousOwnerId);
          void clearOfflineUser(previousOwnerId);
        }
        queryClient.clear();
        router.replace(LOGIN_ROUTE);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        ownerId = session?.user.id ?? ownerId;
        if (ownerId && navigator.onLine) synchronize(ownerId);
        // O middleware já atualizou o cookie; recarregar os dados do servidor
        // garante que a página reflita a sessão nova.
        router.refresh();
      }
    });

    return () => {
      logDiagnostic('debug', 'auth', 'provider.stopped');
      window.removeEventListener('gymflow:online', handleOnline);
      data.subscription.unsubscribe();
      disconnectSessionFromApi();
    };
  }, [queryClient, router]);

  return <>{children}</>;
}
