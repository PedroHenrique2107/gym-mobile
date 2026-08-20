'use client';

import { useMutation } from '@tanstack/react-query';
import { Copy, LogOut, Radio, Share2, UserPlus, UsersRound, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import type { Profile } from '@/features/profile/use-profile';
import { describeApiError } from '@/lib/api/result';
import type { OfflineQueueStatus } from '@/lib/offline/types';
import { cn } from '@/lib/utils';

import { createWorkoutJam, leaveWorkoutJam, loadWorkoutJam, type SessionDetail } from './api';
import {
  buildInvitePath,
  clearHostInvite,
  participantInitials,
  readHostInvite,
  storeHostInvite,
  subscribeHostInvite,
} from './invite-code';
import { describeJamBlock, prepareForWorkoutJam } from './readiness';
import type { useWorkoutJam } from './use-workout-jam';

type WorkoutJamController = ReturnType<typeof useWorkoutJam>;

export function WorkoutJamPanel({
  ownerId,
  profile,
  session,
  queueStatus,
  jam,
}: {
  readonly ownerId: string;
  readonly profile: Profile | undefined;
  readonly session: SessionDetail | null;
  readonly queueStatus: OfflineQueueStatus;
  readonly jam: WorkoutJamController;
}) {
  const snapshot = jam.active.data;
  const pendingJamId = snapshot?.status === 'PENDING' ? snapshot.id : null;
  const inviteCode = useSyncExternalStore(
    subscribeHostInvite,
    () => (pendingJamId ? (readHostInvite(pendingJamId)?.inviteCode ?? null) : null),
    () => null,
  );
  const canShare = useSyncExternalStore(subscribeShareSupport, readShareSupport, () => false);
  const createBlock = describeJamBlock({
    online: jam.online,
    pending: queueStatus.pending,
    blocked: queueStatus.blocked,
  });
  const invitePath = useMemo(() => (inviteCode ? buildInvitePath(inviteCode) : null), [inviteCode]);
  const inviteUrl =
    invitePath && typeof window !== 'undefined'
      ? new URL(invitePath, window.location.origin).toString()
      : null;

  useEffect(() => {
    if (snapshot?.status === 'ACTIVE' || (jam.active.isFetched && !snapshot)) {
      clearHostInvite();
    }
  }, [jam.active.isFetched, snapshot]);

  useEffect(() => {
    if (!pendingJamId) return;
    const storedInvite = readHostInvite(pendingJamId);
    if (!storedInvite) {
      clearHostInvite();
      return;
    }
    const remainingMs = new Date(storedInvite.expiresAt).getTime() - Date.now();
    const timeout = window.setTimeout(clearHostInvite, Math.max(0, remainingMs));
    return () => window.clearTimeout(timeout);
  }, [pendingJamId]);

  const create = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('Inicie um treino antes de criar a Jam.');
      await prepareForWorkoutJam(ownerId);
      return createWorkoutJam(session.id);
    },
    onSuccess: async (result) => {
      storeHostInvite({
        jamId: result.jam.id,
        inviteCode: result.inviteCode,
        expiresAt: result.jam.inviteExpiresAt,
      });
      try {
        jam.setSnapshot(await loadWorkoutJam(result.jam.id));
        void jam.refresh();
        toast.success('Jam criada. Envie o convite para uma pessoa.');
      } catch (error) {
        void jam.active.refetch();
        toast.error(
          describeApiError(
            error,
            'A Jam foi criada, mas não foi possível carregar o convite. Tente novamente.',
          ),
        );
      }
    },
    onError: (error) => toast.error(describeApiError(error, 'Não foi possível iniciar a Jam.')),
  });

  const leave = useMutation({
    mutationFn: () => leaveWorkoutJam(snapshot!.id),
    onSuccess: () => {
      clearHostInvite();
      jam.setSnapshot(null);
      toast.success('Você saiu da Jam. Os treinos individuais foram preservados.');
    },
    onError: (error) => toast.error(describeApiError(error, 'Não foi possível sair da Jam.')),
  });

  async function copyInvite(): Promise<void> {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success('Link da Jam copiado.');
    } catch {
      toast.error('Não foi possível copiar. Selecione o código exibido abaixo.');
    }
  }

  async function shareInvite(): Promise<void> {
    if (!inviteUrl || !canShare) return;
    try {
      await navigator.share({
        title: 'Treinar comigo no GymFlow',
        text: 'Aceite meu convite para registrarmos este treino juntos.',
        url: inviteUrl,
      });
    } catch {
      // Fechar o compartilhamento nativo não é uma falha da Jam.
    }
  }

  return (
    <Card className="border-primary/40 bg-primary/5" aria-labelledby="workout-jam-title">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Radio className="size-5 text-primary" aria-hidden="true" />
            <CardTitle id="workout-jam-title">Workout Jam</CardTitle>
          </div>
          <CardDescription className="mt-1">
            Vincule dois treinos e registrem as séries um do outro em tempo real.
          </CardDescription>
        </div>
        {snapshot ? (
          <Badge variant={snapshot.status === 'ACTIVE' ? 'primary' : 'neutral'}>
            {snapshot.status === 'ACTIVE' ? 'Ao vivo' : 'Aguardando'}
          </Badge>
        ) : null}
      </div>

      {jam.active.isError && !snapshot ? (
        <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <p role="alert">
            {describeApiError(jam.active.error, 'Não foi possível verificar sua Jam atual.')}
          </p>
          <Button
            className="mt-2"
            size="sm"
            variant="outline"
            disabled={!jam.online}
            onClick={() => void jam.active.refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {!snapshot && !jam.active.isError ? (
        <div className="mt-4 grid gap-2">
          {profile?.role === 'ADMIN' && session ? (
            <Button
              size="lg"
              disabled={Boolean(createBlock) || create.isPending}
              onClick={() => create.mutate()}
            >
              <UsersRound /> {create.isPending ? 'Criando Jam...' : 'Iniciar Jam deste treino'}
            </Button>
          ) : profile?.role === 'ADMIN' ? (
            <p className="rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
              Inicie uma ficha abaixo para liberar a criação da Jam.
            </p>
          ) : (
            <p className="rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
              Somente um administrador pode iniciar. Qualquer usuário convidado pode participar.
            </p>
          )}
          <Link href="/jam/entrar" className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
            <UserPlus className="size-4" /> Participar com link ou código
          </Link>
          {createBlock ? (
            <p role="status" className="flex items-center gap-2 text-xs text-warning">
              <WifiOff className="size-4" /> {createBlock}
            </p>
          ) : null}
        </div>
      ) : null}

      {snapshot?.status === 'PENDING' ? (
        <div className="mt-4 rounded-2xl border border-primary/30 bg-background/60 p-4">
          {inviteCode && inviteUrl ? (
            <>
              <p className="font-semibold">Convite pronto</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Válido até {formatDateTime(snapshot.inviteExpiresAt)} e consumido no primeiro
                aceite.
              </p>
              <code className="mt-3 block select-all overflow-x-auto rounded-lg bg-secondary p-3 text-center text-sm font-bold tracking-wide">
                {inviteCode}
              </code>
              <div className="mt-3 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                <Button variant="outline" onClick={() => void copyInvite()}>
                  <Copy /> Copiar link
                </Button>
                {canShare ? (
                  <Button variant="outline" onClick={() => void shareInvite()}>
                    <Share2 /> Compartilhar
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    disabled
                    title="Compartilhamento nativo indisponível neste navegador"
                  >
                    <Share2 /> Use “Copiar link”
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div role="status">
              <p className="font-semibold">O convite secreto não está mais nesta tela</p>
              <p className="mt-1 text-sm text-muted-foreground">
                O servidor não consegue recuperar o código bruto. Ele permanece somente nesta guia
                até expirar; se foi perdido, encerre esta Jam e crie outro convite.
              </p>
            </div>
          )}
          <Button
            className="mt-3 w-full"
            variant="destructive"
            disabled={!jam.online || leave.isPending}
            onClick={() => {
              if (window.confirm('Encerrar este convite? O seu treino continuará normalmente.')) {
                leave.mutate();
              }
            }}
          >
            <LogOut /> {leave.isPending ? 'Encerrando...' : 'Encerrar Jam'}
          </Button>
        </div>
      ) : null}

      {snapshot?.status === 'ACTIVE' ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold">Quem está treinando</p>
          <ul className="grid gap-2" aria-label="Participantes da Jam">
            {snapshot.participants.map((participant) => (
              <li
                key={participant.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary font-bold">
                  {participantInitials(participant.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {participant.name ?? `Participante ${participant.profileId.slice(0, 6)}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {participant.isHost ? 'Anfitrião administrador' : 'Convidado'} ·{' '}
                    {participant.profileId === ownerId ? 'Você' : 'Outro participante'}
                  </p>
                </div>
                <span
                  className="text-xs font-medium"
                  aria-label={participant.isOnline ? 'Online agora' : 'Offline agora'}
                >
                  {participant.isOnline ? 'Online' : 'Offline'}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
            Canal em tempo real: {channelStatusLabel(jam.channelStatus)}. A API confirma todas as
            alterações antes de atualizar os treinos.
          </p>
          <Button
            className="mt-3 w-full"
            variant="outline"
            disabled={!jam.online || leave.isPending}
            onClick={() => {
              const message =
                snapshot.hostId === ownerId
                  ? 'Sair encerrará a Jam para os dois. Os treinos individuais continuarão salvos.'
                  : 'Sair encerrará a Jam, mas os dois treinos continuarão salvos.';
              if (window.confirm(message)) leave.mutate();
            }}
          >
            <LogOut /> Sair da Jam
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function channelStatusLabel(status: WorkoutJamController['channelStatus']): string {
  return {
    idle: 'inativo',
    connecting: 'conectando',
    connected: 'conectado',
    disconnected: 'desconectado',
  }[status];
}

function subscribeShareSupport(): () => void {
  return () => undefined;
}

function readShareSupport(): boolean {
  return typeof navigator.share === 'function';
}
