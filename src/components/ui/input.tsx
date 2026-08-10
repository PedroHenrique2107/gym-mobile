import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Marca o campo como invalido para leitores de tela e para o estilo. */
  readonly invalid?: boolean;
}

/**
 * Campo de texto.
 *
 * `text-base` (16 px) e obrigatorio: o Safari no iOS aplica zoom automatico ao
 * focar um input com fonte menor, e o zoom nao e revertido ao sair do campo —
 * o usuario fica com a tela deslocada no meio do formulario.
 */
export function Input({ className, invalid, 'aria-invalid': ariaInvalid, ...props }: InputProps) {
  return (
    <input
      aria-invalid={ariaInvalid ?? invalid}
      className={cn(
        'tap w-full rounded-lg border border-input bg-secondary/40 px-3 py-2.5 text-base',
        'text-foreground placeholder:text-muted-foreground',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:focus-visible:outline-destructive',
        className,
      )}
      {...props}
    />
  );
}
