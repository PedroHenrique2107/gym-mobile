'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AFTER_LOGIN_ROUTE, LOGIN_ROUTE } from '@/lib/auth/routes';
import { getSupabaseBrowserClient } from '@/lib/auth/supabase-browser';

import { Field, FormError, fieldAria } from './auth-layout';
import { MIN_PASSWORD_LENGTH, describeAuthError, validatePassword } from './auth-messages';

type LinkState = 'verificando' | 'valido' | 'invalido';

/**
 * Define a senha a partir de um link de convite ou de recuperação.
 *
 * As duas telas compartilham este componente porque o mecanismo é idêntico: o
 * link cria uma sessão temporária, e a senha é definida com `updateUser`. Só a
 * redação muda.
 *
 * O ponto delicado é o estado do link. O cliente do Supabase processa o token da
 * URL de forma assíncrona, então na primeira renderização ainda não existe
 * sessão. Mostrar "link inválido" nesse instante seria errado e assustaria quem
 * acabou de clicar num link legítimo — daí o estado `verificando`.
 */
export function SetPasswordForm({
  mode,
  submitLabel,
}: {
  readonly mode: 'convite' | 'recuperacao';
  readonly submitLabel: string;
}) {
  const router = useRouter();

  const [linkState, setLinkState] = useState<LinkState>('verificando');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();

    // A sessão pode já existir (o cliente processou o token antes deste efeito)
    // ou chegar pelo evento. Cobrir os dois evita uma corrida em que o link
    // válido é declarado inválido por milissegundos de diferença.
    void supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) {
        setLinkState('valido');
      }
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (session) {
        setLinkState('valido');
        return;
      }

      if (event === 'INITIAL_SESSION') {
        // Sem sessão depois do processamento inicial: o link expirou, já foi
        // usado, ou a pessoa abriu a página direto.
        setLinkState('invalido');
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const problem = validatePassword(password, confirmation);
    setPasswordError(problem);
    setFormError(null);

    if (problem) return;

    setSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setFormError(describeAuthError(error));
        return;
      }

      router.replace(AFTER_LOGIN_ROUTE);
      router.refresh();
    } catch {
      setFormError('Nao foi possivel conectar. Verifique sua internet.');
    } finally {
      setSubmitting(false);
    }
  }

  if (linkState === 'verificando') {
    return (
      <div aria-busy="true" className="flex flex-col gap-3">
        <span className="sr-only">Verificando o link...</span>
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (linkState === 'invalido') {
    return (
      <div className="flex flex-col gap-4">
        <FormError>
          {mode === 'convite'
            ? 'Este convite expirou ou ja foi utilizado. Peca ao administrador para reenviar.'
            : 'Este link de recuperacao expirou ou ja foi utilizado. Solicite um novo.'}
        </FormError>

        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            router.push(mode === 'convite' ? LOGIN_ROUTE : '/recuperar-senha');
          }}
        >
          {mode === 'convite' ? 'Ir para o login' : 'Solicitar novo link'}
        </Button>
      </div>
    );
  }

  return (
    <form
      // `void` explicito: o handler e assincrono, mas `onSubmit` espera retorno
      // sincrono. Sem isto a Promise ficaria sem tratamento e uma rejeicao
      // inesperada passaria despercebida.
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      noValidate
      className="flex flex-col gap-4"
    >
      <FormError>{formError}</FormError>

      <Field
        id="senha"
        label="Nova senha"
        error={passwordError}
        hint={`Ao menos ${MIN_PASSWORD_LENGTH} caracteres.`}
      >
        <Input
          {...fieldAria('senha', passwordError, `Ao menos ${MIN_PASSWORD_LENGTH} caracteres.`)}
          type="password"
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          // `new-password` faz o gerenciador oferecer geração de senha, em vez
          // de preencher a antiga.
          autoComplete="new-password"
          disabled={submitting}
          required
        />
      </Field>

      <Field id="confirmacao" label="Repita a senha">
        <Input
          {...fieldAria('confirmacao')}
          type="password"
          name="password-confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="new-password"
          disabled={submitting}
          required
        />
      </Field>

      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? 'Salvando...' : submitLabel}
      </Button>
    </form>
  );
}
