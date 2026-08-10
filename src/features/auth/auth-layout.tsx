import { Dumbbell } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Moldura comum das telas de autenticação.
 *
 * `min-h-dvh` e não `min-h-screen`: em navegador móvel, `vh` ignora a barra de
 * endereço e o conteúdo fica cortado até o usuário rolar. `dvh` acompanha a
 * altura visível de verdade.
 */
export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}) {
  return (
    <main
      id="conteudo"
      className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10"
    >
      <div className="mb-8 flex flex-col gap-4">
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"
        >
          <Dumbbell className="size-6" />
        </span>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>

      {children}

      {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
    </main>
  );
}

/**
 * Erro do formulário como um todo.
 *
 * `role="alert"` faz o leitor de tela anunciar assim que aparece. Sem isso, quem
 * usa leitor de tela clicaria em "Entrar", nada seria anunciado, e a pessoa não
 * saberia que houve erro — só que nada aconteceu.
 */
export function FormError({ children }: { readonly children?: string | null }) {
  if (!children) return null;

  return (
    <p
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
    >
      {children}
    </p>
  );
}

/** Confirmação de ação concluída. */
export function FormSuccess({ children }: { readonly children?: string | null }) {
  if (!children) return null;

  return (
    <p
      role="status"
      className="rounded-lg border border-success/30 bg-success/10 px-3 py-2.5 text-sm text-success"
    >
      {children}
    </p>
  );
}

/**
 * Campo com rótulo e erro associados.
 *
 * `aria-describedby` liga a mensagem ao campo, e `aria-invalid` marca o estado.
 * Sem os dois, o erro fica visível apenas para quem enxerga: um leitor de tela
 * leria o rótulo e o valor, sem nunca mencionar o problema.
 */
export function Field({
  id,
  label,
  error,
  children,
  hint,
}: {
  readonly id: string;
  readonly label: string;
  readonly error?: string | null;
  readonly children: ReactNode;
  readonly hint?: string;
}) {
  const errorId = `${id}-erro`;
  const hintId = `${id}-dica`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>

      {children}

      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Ids de acessibilidade de um campo, para não montá-los à mão em cada tela. */
export function fieldAria(id: string, error?: string | null, hint?: string) {
  const described = [error ? `${id}-erro` : null, hint && !error ? `${id}-dica` : null]
    .filter(Boolean)
    .join(' ');

  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': described || undefined,
  };
}
