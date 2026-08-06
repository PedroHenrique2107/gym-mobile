'use client';

import { useEffect } from 'react';

/**
 * Ultima linha de defesa.
 *
 * Dispara quando o proprio layout raiz falha, entao substitui `<html>` e
 * `<body>` e nao pode depender de provider, tema ou componente da aplicacao —
 * qualquer um deles poderia ser a causa da falha. Por isso o estilo e inline e
 * nao ha import de UI.
 */
export default function GlobalError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    console.error(`[gym-mobile] falha critica: digest=${error.digest ?? '-'}`);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1c1f',
          color: '#f5f6f7',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '1.5rem',
        }}
      >
        <main style={{ maxWidth: '24rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
            O aplicativo nao pode ser carregado
          </h1>
          <p
            style={{
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: '#a8adb4',
              margin: '0 0 1.5rem',
            }}
          >
            Feche e abra novamente. Se o problema continuar, verifique sua conexao.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: 44,
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: '#c4f542',
              color: '#1a2410',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tentar novamente
          </button>
          {error.digest ? (
            <p style={{ fontSize: '0.75rem', color: '#a8adb4', marginTop: '1.5rem' }}>
              Codigo: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
