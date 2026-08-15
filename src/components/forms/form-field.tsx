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
    // `min-w-0`: como item de grid, o padrão é não encolher abaixo do conteúdo.
    // Um controle nativo com largura mínima grande — data no iOS é o caso —
    // estouraria a coluna e apareceria por cima do campo ao lado.
    <div className="flex min-w-0 flex-col gap-1.5">
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
