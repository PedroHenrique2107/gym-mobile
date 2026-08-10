import type { TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly invalid?: boolean;
}

export function Textarea({
  className,
  invalid,
  'aria-invalid': ariaInvalid,
  ...props
}: TextareaProps) {
  return (
    <textarea
      aria-invalid={ariaInvalid ?? invalid}
      className={cn(
        'min-h-24 w-full resize-y rounded-lg border border-input bg-secondary/40 px-3 py-2.5 text-base',
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
