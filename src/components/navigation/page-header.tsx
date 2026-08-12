import type { ReactNode } from 'react';

interface PageHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="mb-5 flex min-w-0 items-start justify-between gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Um `h1` por pagina: e por ele que o leitor de tela anuncia onde esta. */}
        <h1 className="break-words text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
