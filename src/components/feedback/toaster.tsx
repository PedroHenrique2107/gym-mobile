'use client';

import { Toaster as SonnerToaster } from 'sonner';

/**
 * Container de toasts.
 *
 * Posicionado no topo de proposito: a navegacao inferior fixa ocuparia o rodape,
 * e um toast sobre ela esconderia justamente o alvo de toque que o usuario
 * costuma buscar em seguida.
 *
 * `offset` empurra o toast para baixo do topo: colado na borda, ele ficava sob
 * a barra de status/notch em alguns aparelhos e lia como cortado.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      offset={{ top: '4.5rem' }}
      mobileOffset={{ top: '4.5rem' }}
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
