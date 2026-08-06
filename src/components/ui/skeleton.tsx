import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

/**
 * Placeholder de carregamento.
 *
 * `aria-hidden` e `role="presentation"` mantem o esqueleto fora da arvore de
 * acessibilidade: um leitor de tela anunciando "imagem" varias vezes durante o
 * carregamento e ruido, nao informacao. Quem carrega deve anunciar o estado com
 * `aria-busy` no container.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}
