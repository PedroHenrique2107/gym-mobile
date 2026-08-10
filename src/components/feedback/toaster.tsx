'use client';

import { Toaster as SonnerToaster } from 'sonner';

/**
 * Container de toasts.
 *
 * Posicionado no topo de proposito: a navegacao inferior fixa ocuparia o rodape,
 * e um toast sobre ela esconderia justamente o alvo de toque que o usuario
 * costuma buscar em seguida.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      theme="dark"
      richColors
      closeButton
      // Tempo suficiente para ler uma frase sem prender a atencao.
      duration={4_000}
      toastOptions={{
        classNames: {
          toast: 'rounded-xl border border-border bg-card text-card-foreground',
          description: 'text-muted-foreground',
        },
      }}
    />
  );
}
