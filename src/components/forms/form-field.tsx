import type { ReactNode } from 'react';

export function FormField({
  id,
  label,
  hint,
  error,
  children,
}: {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly error?: string | null;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-erro`} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-dica`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function fieldDescription(id: string, error?: string | null, hint?: string) {
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-erro` : hint ? `${id}-dica` : undefined,
  };
}
