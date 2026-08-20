'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, LogIn, Radio, ShieldCheck, UserRoundCheck, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { AuthLayout, FormError } from '@/features/auth/auth-layout';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { describeApiError } from '@/lib/api/result';
import { REDIRECT_PARAM } from '@/lib/auth/routes';
import { getSupabaseBrowserClient } from '@/lib/auth/supabase-browser';
import { cn } from '@/lib/utils';

import {
  acceptWorkoutJamInvite,
  declineWorkoutJamInvite,
  loadActiveSessionOnline,
  loadWorkoutsOnline,
  previewWorkoutJamInvite,
  startSessionOnline,
} from './api';
import { JAM_INVITE_STORAGE_KEY, normalizeInviteCode, readInviteCodeFromHash } from './invite-code';
import { prepareForWorkoutJam } from './readiness';
import { markKnownJam } from './known-jam';
import { workoutJamKeys } from './use-workout-jam';

interface AuthState {
  readonly loading: boolean;
  readonly ownerId: string | null;
}

export function WorkoutJamInvite() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [auth, setAuth] = useState<AuthState>({ loading: true, ownerId: null });
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState('');
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fromHash = readInviteCodeFromHash(window.location.hash);
    const stored = sessionStorage.getItem(JAM_INVITE_STORAGE_KEY);
    const initialCode = fromHash ?? normalizeInviteCode(stored ?? '');
    if (fromHash) sessionStorage.setItem(JAM_INVITE_STORAGE_KEY, fromHash);
    if (window.location.hash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
    queueMicrotask(() => {
      if (!mounted) return;
      setInviteCode(initialCode);
      setManualCode(initialCode ?? '');
      setOnline(navigator.onLine);
    });

    const refreshOnline = (): void => setOnline(navigator.onLine);
    window.addEventListener('online', refreshOnline);
    window.addEventListener('offline', refreshOnline);

    void getSupabaseBrowserClient()
      .auth.getSession()
      .then(({ data }) => setAuth({ loading: false, ownerId: data.session?.user.id ?? null }))
      .catch(() => setAuth({ loading: false, ownerId: null }));

    return () => {
      mounted = false;
      window.removeEventListener('online', refreshOnline);
      window.removeEventListener('offline', refreshOnline);
    };
  }, []);

  const preview = useQuery({
    queryKey: ['workout-jams', 'invite-preview', inviteCode],
    enabled: Boolean(auth.ownerId && inviteCode && online),
    queryFn: () => previewWorkoutJamInvite(inviteCode!),
    retry: false,
  });
  const activeSession = useQuery({
    queryKey: ['sessions', 'active', 'online-for-jam'],
    enabled: Boolean(auth.ownerId && preview.data && online),
    queryFn: loadActiveSessionOnline,
    retry: false,
  });
  const workouts = useQuery({
    queryKey: ['workouts', 'online-for-jam'],
    enabled: Boolean(auth.ownerId && preview.data && activeSession.data === null && online),
    queryFn: loadWorkoutsOnline,
    retry: false,
  });

  const accept = useMutation({
    mutationFn: async () => {
      if (!auth.ownerId || !inviteCode) throw new Error('Convite ou sessão ausente.');
      await prepareForWorkoutJam(auth.ownerId);
      // A sincronização acima pode ter criado no servidor uma sessão que ainda
      // não existia no snapshot da query. Reconsultar evita tentar iniciar uma
      // segunda sessão e receber conflito.
      const freshActiveSession = await loadActiveSessionOnline();
      const session =
        freshActiveSession ??
        (selectedWorkoutId ? await startSessionOnline(selectedWorkoutId) : null);
      if (!session) throw new Error('Selecione uma ficha para iniciar o seu treino.');
      return acceptWorkoutJamInvite(inviteCode, session.id);
    },
    onSuccess: (snapshot) => {
      sessionStorage.removeItem(JAM_INVITE_STORAGE_KEY);
      if (auth.ownerId) markKnownJam(auth.ownerId, snapshot.id);
      queryClient.setQueryData(workoutJamKeys.active, snapshot);
      toast.success('Convite aceito. Os dois treinos estão vinculados.');
      router.replace('/treinar');
      router.refresh();
    },
    onError: (error) => toast.error(describeApiError(error, 'Não foi possível aceitar a Jam.')),
  });
  const decline = useMutation({
    mutationFn: async () => {
      if (!inviteCode || !online) throw new Error('A Jam funciona somente com internet.');
      await declineWorkoutJamInvite(inviteCode);
    },
    onSuccess: () => {
      sessionStorage.removeItem(JAM_INVITE_STORAGE_KEY);
      setInviteCode(null);
      setManualCode('');
      toast.success('Convite recusado.');
    },
    onError: (error) => toast.error(describeApiError(error, 'Não foi possível recusar o convite.')),
  });

  function handleCode(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const normalized = normalizeInviteCode(manualCode);
    if (!normalized) {
      setCodeError('Informe um código válido com 16 a 64 caracteres.');
      return;
    }
    setCodeError(null);
    setInviteCode(normalized);
    sessionStorage.setItem(JAM_INVITE_STORAGE_KEY, normalized);
  }

  const loginHref = `/entrar?${new URLSearchParams({ [REDIRECT_PARAM]: '/jam/entrar' }).toString()}`;

  return (
    <AuthLayout
      title="Participar de uma Workout Jam"
      description="Confirme o convite antes de vincular o seu treino ao do anfitrião."
      footer={
        <Link href="/" className="text-primary hover:underline">
          Voltar para a página inicial
        </Link>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-5 text-primary" /> Convite temporário e de uso único
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Carga, repetições e alterações continuam protegidas pela sua conta. Nada é vinculado sem
            o seu aceite.
          </p>
        </div>

        <form onSubmit={handleCode} className="flex flex-col gap-2">
          <label htmlFor="jam-code" className="text-sm font-medium">
            Código da Jam
          </label>
          <Input
            id="jam-code"
            value={manualCode}
            onChange={(event) => {
              const next = event.target.value;
              setManualCode(next);
              if (inviteCode && next.trim() !== inviteCode) {
                setInviteCode(null);
                sessionStorage.removeItem(JAM_INVITE_STORAGE_KEY);
              }
            }}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={Boolean(codeError)}
            aria-describedby={codeError ? 'jam-code-error' : undefined}
            placeholder="Cole o código recebido"
          />
          {codeError ? (
            <p id="jam-code-error" role="alert" className="text-xs text-destructive">
              {codeError}
            </p>
          ) : null}
          <Button type="submit" variant="outline" disabled={!manualCode.trim()}>
            <Radio /> Consultar convite
          </Button>
        </form>

        {!online ? (
          <p
            role="alert"
            className="flex items-center gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning"
          >
            <WifiOff className="size-4" /> Conecte-se à internet para consultar ou aceitar a Jam.
          </p>
        ) : null}

        {auth.loading ? <p aria-busy="true">Verificando sua conta...</p> : null}

        {!auth.loading && !auth.ownerId ? (
          <div className="rounded-2xl border border-border p-4">
            <p className="font-semibold">Entre para continuar</p>
            <p className="mt-1 text-sm text-muted-foreground">
              O código fica guardado somente nesta guia e volta depois do login.
            </p>
            <Link href={loginHref} className={cn(buttonVariants({ size: 'lg' }), 'mt-3')}>
              <LogIn className="size-4" /> Entrar e revisar convite
            </Link>
          </div>
        ) : null}

        {auth.ownerId && inviteCode && preview.isPending ? (
          <p aria-busy="true">Consultando convite...</p>
        ) : null}
        {auth.ownerId && inviteCode && preview.isError ? (
          <FormError>
            {describeApiError(preview.error, 'Este convite não está mais disponível.')}
          </FormError>
        ) : null}

        {preview.data ? (
          <div className="rounded-2xl border border-primary/40 p-4" aria-live="polite">
            <p className="flex items-center gap-2 font-semibold">
              <UserRoundCheck className="size-5 text-primary" /> Convite de{' '}
              {preview.data.hostName ?? 'Administrador GymFlow'}
            </p>
            <dl className="mt-3 grid gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Treino do anfitrião</dt>
                <dd className="font-medium">{preview.data.workoutName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Validade</dt>
                <dd className="font-medium">{formatDateTime(preview.data.expiresAt)}</dd>
              </div>
            </dl>

            {activeSession.isPending ? <p className="mt-3">Verificando seu treino...</p> : null}
            {activeSession.isError ? (
              <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <p role="alert">
                  {describeApiError(activeSession.error, 'Não foi possível verificar seu treino.')}
                </p>
                <Button
                  className="mt-2"
                  size="sm"
                  variant="outline"
                  onClick={() => void activeSession.refetch()}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : null}
            {activeSession.data ? (
              <p className="mt-3 rounded-lg bg-secondary/50 p-3 text-sm">
                Seu treino vinculado: <strong>{activeSession.data.templateName}</strong>
              </p>
            ) : null}
            {activeSession.data === null ? (
              <div className="mt-3">
                <label className="block text-sm font-medium">
                  Ficha para iniciar online
                  <Select
                    className="mt-1"
                    aria-label="Ficha que será iniciada para a Jam"
                    value={selectedWorkoutId}
                    onChange={(event) => setSelectedWorkoutId(event.target.value)}
                    disabled={workouts.isPending || workouts.isError}
                  >
                    <option value="">
                      {workouts.isPending ? 'Carregando fichas...' : 'Selecione uma ficha'}
                    </option>
                    {workouts.data?.data.map((workout) => (
                      <option key={workout.id} value={workout.id}>
                        {workout.name} · {workout.exerciseCount} exercícios
                      </option>
                    ))}
                  </Select>
                </label>
                {workouts.isError ? (
                  <div className="mt-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    <p role="alert">
                      {describeApiError(workouts.error, 'Não foi possível carregar suas fichas.')}
                    </p>
                    <Button
                      className="mt-2"
                      size="sm"
                      variant="outline"
                      onClick={() => void workouts.refetch()}
                    >
                      Tentar novamente
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 grid gap-2">
              <Button
                size="lg"
                disabled={
                  !online ||
                  activeSession.isPending ||
                  activeSession.isError ||
                  workouts.isError ||
                  accept.isPending ||
                  (activeSession.data === null && !selectedWorkoutId)
                }
                onClick={() => accept.mutate()}
              >
                <ArrowRight />
                {accept.isPending
                  ? 'Vinculando...'
                  : activeSession.data
                    ? 'Aceitar e entrar na Jam'
                    : 'Iniciar ficha e aceitar Jam'}
              </Button>
              <Button
                variant="outline"
                disabled={!online || decline.isPending || accept.isPending}
                onClick={() => {
                  if (
                    window.confirm('Recusar este convite? O código não poderá ser usado novamente.')
                  ) {
                    decline.mutate();
                  }
                }}
              >
                {decline.isPending ? 'Recusando...' : 'Recusar convite'}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </AuthLayout>
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
