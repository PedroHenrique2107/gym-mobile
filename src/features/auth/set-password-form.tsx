'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AFTER_LOGIN_ROUTE, LOGIN_ROUTE } from '@/lib/auth/routes';
import { getSupabaseBrowserClient } from '@/lib/auth/supabase-browser';

import { Field, FormError, FormSuccess, fieldAria } from './auth-layout';
import { MIN_PASSWORD_LENGTH, describeAuthError, validatePassword } from './auth-messages';
import { readOtpLink, verifyOtpOnce, type SetPasswordMode } from './otp-link';

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
  readonly mode: SetPasswordMode;
  readonly submitLabel: string;
}) {
  const router = useRouter();

  const [linkState, setLinkState] = useState<LinkState>('verificando');
  const [accountCreated, setAccountCreated] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();
    const link = readOtpLink(window.location.search, mode);

    /**
     * Caminho do link novo: o e-mail traz apenas o hash do token, e a troca por
     * sessão acontece aqui, numa chamada feita por este código.
     *
     * O formato anterior era o `ConfirmationURL` padrão do Supabase — um `GET`
     * em `/auth/v1/verify` que **consumia** o token de uso único. Qualquer
     * prefetch do provedor de e-mail abria esse link antes da pessoa: o endereço
     * era confirmado, a sessão ia para o robô, e quem recebeu o convite via
     * "link expirado". Foi o que aconteceu em produção — a confirmação chegou
     * nove segundos depois do envio, tempo que nenhum humano leva para receber,
     * abrir e clicar.
     *
     * Buscar esta página não consome mais nada, porque agora o consumo exige que
     * o JavaScript rode.
     */
    if (link) {
      void (async () => {
        try {
          const verified = await verifyOtpOnce(link, async ({ tokenHash, type }) => {
            const { data, error } = await supabase.auth.verifyOtp({
              type,
              token_hash: tokenHash,
            });

            return !error && Boolean(data.session);
          });

          if (!active) return;

          if (verified) {
            setLinkState('valido');
            return;
          }

          // Segundo clique no mesmo link do e-mail: o token já foi trocado, mas
          // a sessão criada na primeira vez continua valendo. Recusar aqui
          // mandaria a pessoa pedir outro convite sem precisar.
          const { data } = await supabase.auth.getSession();
          if (active) setLinkState(data.session ? 'valido' : 'invalido');
        } catch {
          // Falha de rede na verificação. Tratar como link inválido é o
          // comportamento seguro: sem sessão, o formulário não teria como salvar
          // a senha, e oferecê-lo daria uma esperança que terminaria em erro.
          if (active) setLinkState('invalido');
        } finally {
          // O token é de uso único e não deve ficar na barra de endereços, no
          // histórico ou num compartilhamento acidental da URL.
          window.history.replaceState(null, '', window.location.pathname);
        }
      })();

      return () => {
        active = false;
      };
    }

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
  }, [mode]);

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

      /**
       * Convite concluído não entra direto no aplicativo.
       *
       * A conta nasce `PENDING_INVITE` e só o administrador a ativa; até lá a API
       * responde `403` em tudo. Empurrar a pessoa para `/inicio` encerraria o
       * convite numa tela de erro, por causa de um passo que não é dela.
       */
      if (mode === 'convite') {
        setAccountCreated(true);
        return;
      }

      router.replace(AFTER_LOGIN_ROUTE);
      router.refresh();
    } catch {
      setFormError('Não foi possível conectar. Verifique sua internet.');
    } finally {
      setSubmitting(false);
    }
  }

  if (accountCreated) {
    return (
      <div className="flex flex-col gap-4">
        <FormSuccess>Senha criada. Sua conta já existe no GymFlow.</FormSuccess>

        <p className="text-sm leading-relaxed text-muted-foreground">
          Falta o administrador liberar seu acesso. Quando ele fizer isso, você entra com o e-mail
          do convite e a senha que acabou de criar.
        </p>

        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            router.replace(AFTER_LOGIN_ROUTE);
            router.refresh();
          }}
        >
          Ir para o aplicativo
        </Button>
      </div>
    );
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
            ? 'Este convite expirou ou já foi utilizado. Peça ao administrador para reenviar.'
            : 'Este link de recuperação expirou ou já foi utilizado. Solicite um novo.'}
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
