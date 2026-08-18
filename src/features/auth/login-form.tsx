'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { REDIRECT_PARAM, safeRedirectTarget } from '@/lib/auth/routes';
import { getSupabaseBrowserClient } from '@/lib/auth/supabase-browser';

import { Field, FormError, fieldAria } from './auth-layout';
import { describeAuthError, validateEmail } from './auth-messages';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const emailProblem = validateEmail(email);
    setEmailError(emailProblem);
    setFormError(null);

    if (emailProblem) return;
    if (!password) {
      setFormError('Informe sua senha.');
      return;
    }

    setSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setFormError(describeAuthError(error));
        return;
      }

      const destino = safeRedirectTarget(searchParams.get(REDIRECT_PARAM));

      // `replace` e não `push`: o botão voltar não deve levar de volta ao login
      // depois de entrar.
      router.replace(destino);
      // O middleware precisa reler o cookie de sessão para liberar a rota.
      router.refresh();
    } catch {
      // Falha antes de o Supabase responder — rede caída ou configuração
      // ausente. A mensagem original citaria a URL do projeto.
      setFormError('Não foi possível conectar. Verifique sua internet.');
    } finally {
      setSubmitting(false);
    }
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

      <Field id="email" label="E-mail" error={emailError}>
        <Input
          {...fieldAria('email', emailError)}
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          // `username` ajuda o gerenciador de senhas a associar a credencial.
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          // `inputMode` traz o teclado com @ no celular.
          inputMode="email"
          placeholder="voce@exemplo.com"
          disabled={submitting}
          required
        />
      </Field>

      <Field id="senha" label="Senha">
        <Input
          {...fieldAria('senha')}
          type="password"
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          disabled={submitting}
          required
        />
      </Field>

      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
}
