import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/lib/api/problem';

/**
 * Politica de nova tentativa alinhada ao contrato de erro.
 *
 * A regra vem do significado do status, nao de um numero fixo: rede, `5xx` e
 * `429` sao transitorios e valem repetir; `4xx` nao melhora sem corrigir o
 * pedido, e insistir apenas gasta bateria e cota do usuario. Um `401` em
 * particular precisa de renovacao de sessao, tratada em M2 — repetir a mesma
 * requisicao com o mesmo token expirado nunca funcionaria.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 3) return false;
  if (error instanceof ApiError) return error.isRetryable;
  // Erro fora do cliente de API: provavelmente bug de codigo, nao falha
  // transitoria. Repetir esconderia o problema.
  return false;
}

/** Backoff exponencial com teto, para nao castigar uma API ja sobrecarregada. */
function retryDelay(attemptIndex: number): number {
  return Math.min(1_000 * 2 ** attemptIndex, 15_000);
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        retryDelay,

        // 30 s cobre a navegacao entre abas sem refetch a cada toque, e ainda e
        // curto o bastante para nao mostrar dado velho durante um treino.
        staleTime: 30_000,
        gcTime: 5 * 60_000,

        // Voltar do segundo plano durante um treino deve revalidar: o usuario
        // pode ter registrado series em outro dispositivo.
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,

        // O `retry` acima ja cobre falha transitoria; remontar componente nao e
        // motivo para nova requisicao.
        refetchOnMount: false,
      },
      mutations: {
        // Mutacao nao e repetida automaticamente por padrao. Sem
        // `Idempotency-Key` — que entra em M6 — repetir um POST poderia
        // duplicar uma serie registrada.
        retry: false,
      },
    },
  });
}
