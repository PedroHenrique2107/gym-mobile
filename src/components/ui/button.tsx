import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Botao base.
 *
 * O tamanho padrao respeita o minimo de 44 px de alvo de toque exigido pelo
 * plano de acessibilidade. A variante `sm` existe apenas para uso dentro de
 * areas ja densas e mantem 44 px de altura efetiva pelo `tap`.
 */
const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold',
    'transition-colors select-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    // Cursor de "nao permitido" nao aparece no toque; a opacidade e o sinal real.
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:size-4 [&_svg]:shrink-0',
  ),
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70',
        outline: 'border border-input bg-transparent text-foreground hover:bg-accent',
        ghost: 'bg-transparent text-foreground hover:bg-accent',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80',
      },
      size: {
        sm: 'tap px-3 py-1.5 text-xs',
        md: 'tap px-4 py-2.5',
        lg: 'min-h-12 w-full px-5 py-3 text-base',
        icon: 'tap p-2',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  readonly children?: ReactNode;
}

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      // Sem `type` explicito, um botao dentro de form dispara submit por
      // padrao — causa comum de envio acidental.
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
