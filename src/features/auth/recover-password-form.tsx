'use client';

import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSupabaseBrowserClient } from '@/lib/auth/supabase-browser';

import { Field, FormError, FormSuccess, fieldAria } from './auth-layout';
import { describeAuthError, validateEmail } from './auth-messages';

export function RecoverPasswordForm() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const problem = validateEmail(email);
    setEmailError(problem);
    setFormError(null);

    if (problem) return;

    setSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      /**
       * Confirma o envio mesmo quando o e-mail não existe.
       *
       * O Supabase já responde sucesso nesse caso de propósito, e a interface
       * mantém a mesma postura: dizer "este e-mail não está cadastrado"
       * transformaria a tela num verificador de quem tem conta no aplicativo.
       *
       * A exceção é limite de envio — aí a pessoa precisa saber que deve
       * aguardar, senão ficaria esperando um e-mail que não vem.
       */
      if (error && error.code === 'over_email_send_rate_limit') {
        setFormError(describeAuthError(error));
        return;
      }

      setSent(true);
    } catch {
      setFormError('Não foi possível conectar. Verifique sua internet.');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <FormSuccess>
          Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha.
        </FormSuccess>

        <p className="text-sm leading-relaxed text-muted-foreground">
          O link vale por pouco tempo. Confira também a caixa de spam. Se não chegar em alguns
          minutos, tente novamente.
        </p>

        <Button variant="outline" size="lg" onClick={() => setSent(false)}>
          Usar outro e-mail
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

      <Field id="email" label="E-mail da conta" error={emailError}>
        <Input
          {...fieldAria('email', emailError)}
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          inputMode="email"
          placeholder="voce@exemplo.com"
          disabled={submitting}
          required
        />
      </Field>

      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? 'Enviando...' : 'Enviar link de recuperação'}
      </Button>
    </form>
  );
}
