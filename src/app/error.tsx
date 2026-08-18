'use client';

import { useEffect } from 'react';

import { ErrorState } from '@/components/feedback/state-message';
import { ApiError } from '@/lib/api/problem';

/**
 * Fronteira de erro das rotas.
 *
 * Recebe qualquer excecao nao tratada durante a renderizacao. Duas regras
 * valem aqui: a mensagem tecnica nunca e exibida, e o identificador da
 * requisicao e — sem ele, um relato do usuario nao pode ser correlacionado com
 * o log do servidor.
 */
export default function RouteError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    // `console.error` e permitido para falha; o que nao pode e registrar JWT,
    // e-mail, fotos, medidas ou conteudo de treino. `ApiError` nao carrega
    // nenhum desses — apenas status, codigo e id da requisicao.
    if (error instanceof ApiError) {
      console.error(
        `[gym-mobile] falha de API: status=${error.status} code=${error.code} requestId=${error.requestId ?? '-'}`,
      );
      return;
    }

    console.error(`[gym-mobile] erro de renderizacao: digest=${error.digest ?? '-'}`);
  }, [error]);

  const description = error instanceof ApiError ? error.message : undefined;
  const reference = error instanceof ApiError ? error.requestId : error.digest;

  return (
    <main id="conteudo" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center">
      <ErrorState
        // Conteudo principal da tela de erro: o titulo precisa ser o `h1`.
        titleAs="h1"
        title="Algo deu errado"
        description={description ?? 'Não conseguimos carregar esta tela. Tente novamente.'}
        onRetry={reset}
      />

      {reference ? (
        <p className="px-6 pb-8 text-center text-xs text-muted-foreground">
          Se o problema continuar, informe este codigo ao suporte:{' '}
          <code className="tabular">{reference}</code>
        </p>
      ) : null}
    </main>
  );
}
