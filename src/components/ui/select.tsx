import type { SelectHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly invalid?: boolean;
}

export function Select({ className, invalid, 'aria-invalid': ariaInvalid, ...props }: SelectProps) {
  return (
    <select
      aria-invalid={ariaInvalid ?? invalid}
      className={cn(
        'tap w-full rounded-lg border border-input bg-secondary/40 px-3 py-2.5 text-base',
        'text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:focus-visible:outline-destructive',
        className,
      )}
      {...props}
    />
  );
}
