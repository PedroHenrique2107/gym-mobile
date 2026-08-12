'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CircleStop, Clock3, CloudOff, Play, SkipForward } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import { toast } from 'sonner';

import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { workoutKeys } from '@/features/workouts/workout-manager';
import type { components } from '@/lib/api/generated/types';
import { describeApiError } from '@/lib/api/result';
import { todayCivil } from '@/lib/dates/civil-date';
import {
  finishTraining,
  loadActiveSession,
  loadWorkouts,
  saveTrainingExerciseSets,
  startTraining,
  updateTrainingExercise,
} from '@/lib/offline/training';
import { discardOfflineChanges, retryBlockedOperations } from '@/lib/offline/repository';
import { syncOutbox } from '@/lib/offline/sync';
import type { OfflineQueueStatus } from '@/lib/offline/types';
import { useOfflineOwnerId, useOfflineQueueStatus } from '@/lib/offline/use-offline-status';

import { ExerciseSetsModal, type ExerciseSetInput } from './exercise-sets-modal';

type SessionDetail = components['schemas']['SessionDetailResponse'];
type SessionExercise = components['schemas']['SessionExerciseResponse'];
type FinishSessionRequest = components['schemas']['FinishSessionRequest'];

export const sessionKeys = {
  all: ['sessions'] as const,
  active: ['sessions', 'active'] as const,
};

export function TrainingSession() {
  const queryClient = useQueryClient();
  const [selectedWorkoutId, setSelectedWorkoutId] = useState('');
  const owner = useOfflineOwnerId();
  const ownerId = owner.data;
  const queueStatus = useOfflineQueueStatus(ownerId);

  const active = useQuery({
    queryKey: sessionKeys.active,
    enabled: Boolean(ownerId),
    queryFn: () => loadActiveSession(ownerId!),
  });

  const workouts = useQuery({
    queryKey: workoutKeys.list,
    enabled: Boolean(ownerId) && active.data === null,
    queryFn: () => loadWorkouts(ownerId!),
  });

  const start = useMutation({
    mutationFn: async (templateId: string) => {
      if (!ownerId) throw new Error('A sessao local ainda nao esta disponivel.');
      return startTraining(ownerId, templateId, todayCivil());
    },
    onSuccess: (result) => {
      queryClient.setQueryData(sessionKeys.active, result.session);
      toast.success(
        result.queued ? 'Treino iniciado offline e salvo neste aparelho.' : 'Treino iniciado.',
      );
    },
    onError: async (error) => {
      await queryClient.invalidateQueries({ queryKey: sessionKeys.active });
      toast.error(describeApiError(error, 'Nao foi possivel iniciar o treino.'));
    },
  });

  if (owner.isPending) {
    return <Card aria-busy="true">Procurando treino em andamento...</Card>;
  }

  if (!ownerId) {
    return (
      <Card className="border-destructive/30">Nao foi possivel identificar a sessao local.</Card>
    );
  }

  if (active.isPending) {
    return <Card aria-busy="true">Procurando treino em andamento...</Card>;
  }

  if (active.isError) {
    return (
      <Card className="border-destructive/30">
        <p role="alert" className="text-sm text-destructive">
          {describeApiError(active.error, 'Nao foi possivel verificar o treino em andamento.')}
        </p>
        <Button className="mt-3" variant="outline" onClick={() => void active.refetch()}>
          Tentar novamente
        </Button>
      </Card>
    );
  }

  if (active.data) {
    return <ActiveSessionView ownerId={ownerId} session={active.data} queueStatus={queueStatus} />;
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <div className="mb-3">
        <CardTitle>Comecar treino</CardTitle>
        <CardDescription className="mt-1">
          A ficha vira um snapshot: alteracoes futuras nao mudam esta sessao.
        </CardDescription>
      </div>
      <OfflineQueueNotice ownerId={ownerId} status={queueStatus} />
      <div className="flex gap-2">
        <Select
          aria-label="Ficha para iniciar"
          value={selectedWorkoutId}
          onChange={(event) => setSelectedWorkoutId(event.target.value)}
          disabled={workouts.isPending}
        >
          <option value="">
            {workouts.isPending ? 'Carregando fichas...' : 'Selecione uma ficha'}
          </option>
          {workouts.data?.data.map((workout) => (
            <option key={workout.id} value={workout.id}>
              {workout.name} · {workout.exerciseCount} exercicios
            </option>
          ))}
        </Select>
        <Button
          size="icon"
          aria-label="Iniciar treino selecionado"
          disabled={!selectedWorkoutId || start.isPending}
          onClick={() => start.mutate(selectedWorkoutId)}
        >
          <Play />
        </Button>
      </div>
    </Card>
  );
}

function ActiveSessionView({
  ownerId,
  session,
  queueStatus,
}: {
  readonly ownerId: string;
  readonly session: SessionDetail;
  readonly queueStatus: OfflineQueueStatus;
}) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(session.notes ?? '');
  const [restUntil, setRestUntil] = useState<number | null>(null);
  const now = useClock();

  const updateSession = (updated: SessionDetail): void => {
    queryClient.setQueryData(sessionKeys.active, updated);
  };

  const setExerciseStatus = useMutation({
    mutationFn: async ({
      exercise,
      status,
    }: {
      exercise: SessionExercise;
      status: 'DONE' | 'SKIPPED';
    }) => {
      if (!exercise.exerciseId) throw new Error('O exercicio de origem nao esta mais disponivel.');
      return updateTrainingExercise(ownerId, session, exercise.id, exercise.exerciseId, status);
    },
    onSuccess: (result) => {
      updateSession(result.session);
      if (result.queued) toast.info('Alteracao salva offline.');
    },
    onError: (error) =>
      toast.error(describeApiError(error, 'Nao foi possivel atualizar o exercicio.')),
  });

  const finish = useMutation({
    mutationFn: async (action: 'complete' | 'abandon') => {
      const body: FinishSessionRequest = {
        clientEndedAt: new Date().toISOString(),
        notes: notes.trim() || null,
      };
      return finishTraining(ownerId, session, action, body);
    },
    onSuccess: (result) => {
      queryClient.setQueryData(sessionKeys.active, null);
      const label =
        result.session.status === 'COMPLETED' ? 'Treino concluido.' : 'Treino abandonado.';
      toast.success(result.queued ? `${label} Sincronizacao pendente.` : label);
    },
    onError: (error) => toast.error(describeApiError(error, 'Nao foi possivel encerrar o treino.')),
  });

  const restSeconds = restUntil === null ? 0 : Math.max(0, Math.ceil((restUntil - now) / 1000));

  return (
    <section aria-labelledby="active-session-title" className="flex flex-col gap-4">
      <Card className="border-primary/40 bg-primary/5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle id="active-session-title">{session.templateName}</CardTitle>
            <CardDescription className="mt-1">Treino em andamento</CardDescription>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-2 text-sm tabular">
            <Clock3 className="size-4" />
            {formatElapsed(session.startedAt, now)}
          </div>
        </div>
        <OfflineQueueNotice ownerId={ownerId} status={queueStatus} />
        {restSeconds > 0 ? (
          <div role="timer" className="mt-3 rounded-lg bg-warning/10 p-3 text-center text-warning">
            Descanso: <strong className="tabular">{formatSeconds(restSeconds)}</strong>
            <Button className="ml-2" size="sm" variant="ghost" onClick={() => setRestUntil(null)}>
              Pular
            </Button>
          </div>
        ) : null}
      </Card>

      {session.exercises.map((exercise) => (
        <ExerciseLogger
          key={exercise.id}
          ownerId={ownerId}
          session={session}
          exercise={exercise}
          disabled={session.status !== 'ACTIVE'}
          onUpdated={updateSession}
          onRest={(seconds) => setRestUntil(Date.now() + seconds * 1000)}
          onStatus={(status) => setExerciseStatus.mutate({ exercise, status })}
        />
      ))}

      <Card>
        <FormField id="session-notes" label="Observacoes finais">
          <Textarea
            id="session-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={1000}
          />
        </FormField>
        <div className="mt-3 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
          <Button
            variant="destructive"
            disabled={finish.isPending}
            onClick={() => {
              if (
                window.confirm(
                  'Abandonar este treino? As series registradas continuam no historico.',
                )
              ) {
                finish.mutate('abandon');
              }
            }}
          >
            <CircleStop /> Abandonar
          </Button>
          <Button disabled={finish.isPending} onClick={() => finish.mutate('complete')}>
            <Check /> {finish.isPending ? 'Encerrando...' : 'Concluir'}
          </Button>
        </div>
      </Card>
    </section>
  );
}

function ExerciseLogger({
  ownerId,
  session,
  exercise,
  disabled,
  onUpdated,
  onRest,
  onStatus,
}: {
  readonly ownerId: string;
  readonly session: SessionDetail;
  readonly exercise: SessionExercise;
  readonly disabled: boolean;
  readonly onUpdated: (session: SessionDetail) => void;
  readonly onRest: (seconds: number) => void;
  readonly onStatus: (status: 'DONE' | 'SKIPPED') => void;
}) {
  const [expanded, setExpanded] = useState(exercise.status === 'PENDING');
  const [setsModalOpen, setSetsModalOpen] = useState(false);

  const saveSets = useMutation({
    mutationFn: async (sets: ExerciseSetInput[]) => {
      return saveTrainingExerciseSets(ownerId, session, exercise.id, { sets });
    },
    onSuccess: (result) => {
      onUpdated(result.session);
      onRest(exercise.restSeconds);
      setSetsModalOpen(false);
      toast.success(
        result.queued
          ? 'Exercício concluído e salvo neste aparelho.'
          : 'Exercício concluído. Sincronizando em segundo plano.',
      );
    },
    onError: (error) => toast.error(describeApiError(error, 'Não foi possível salvar as séries.')),
  });

  return (
    <>
      <Card className={exercise.status === 'SKIPPED' ? 'opacity-70' : undefined}>
        <button
          type="button"
          className="tap flex w-full min-w-0 items-start justify-between gap-3 text-left"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          <div className="min-w-0">
            <CardTitle className="break-words">{exercise.exerciseName}</CardTitle>
            <CardDescription className="mt-1">
              {exercise.targetSets} séries · {exercise.repMin}–{exercise.repMax} repetições ·{' '}
              {exercise.restSeconds}s
            </CardDescription>
          </div>
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            {exercise.status === 'PENDING'
              ? `${exercise.sets.length}/${exercise.targetSets}`
              : exerciseStatusLabel(exercise.status)}
          </span>
        </button>

        {expanded ? (
          <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
            {exercise.sets.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {exercise.sets.map((set) => (
                  <li key={set.id} className="rounded-lg bg-secondary/40 px-3 py-2 text-sm tabular">
                    {set.isWarmup ? 'Aquecimento' : `Série ${set.setNumber}`}: {set.weightKg} kg ×{' '}
                    {set.reps}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma série preenchida.</p>
            )}

            {exercise.status !== 'SKIPPED' ? (
              <Button size="lg" disabled={disabled} onClick={() => setSetsModalOpen(true)}>
                <Check /> {exercise.sets.length > 0 ? 'Editar séries' : 'Preencher séries'}
              </Button>
            ) : null}

            {exercise.status === 'PENDING' ? (
              <Button variant="outline" disabled={disabled} onClick={() => onStatus('SKIPPED')}>
                <SkipForward /> Pular exercício
              </Button>
            ) : null}
          </div>
        ) : null}
      </Card>

      <ExerciseSetsModal
        open={setsModalOpen}
        exercise={exercise}
        pending={saveSets.isPending}
        onClose={() => setSetsModalOpen(false)}
        onSubmit={(sets) => saveSets.mutate(sets)}
      />
    </>
  );
}

function useClock(): number {
  return useSyncExternalStore(subscribeClock, readClock, () => 0);
}

function subscribeClock(onChange: () => void): () => void {
  const timer = window.setInterval(onChange, 1000);
  return () => window.clearInterval(timer);
}

function readClock(): number {
  return Date.now();
}

export function formatElapsed(startedAt: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return [hours, minutes, rest].map((value) => String(value).padStart(2, '0')).join(':');
}

export function formatSeconds(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function exerciseStatusLabel(status: SessionExercise['status']): string {
  return { PENDING: 'Pendente', DONE: 'Concluido', SKIPPED: 'Pulado', REPLACED: 'Substituido' }[
    status
  ];
}

function OfflineQueueNotice({
  ownerId,
  status,
}: {
  readonly ownerId: string;
  readonly status: OfflineQueueStatus;
}) {
  const queryClient = useQueryClient();
  const retry = useMutation({
    mutationFn: async () => {
      await retryBlockedOperations(ownerId);
      const result = await syncOutbox(ownerId, { force: true });
      if (result.blocked) {
        if (result.error instanceof Error) throw result.error;
        throw new Error('A sincronizacao continua bloqueada.');
      }
      return result;
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: sessionKeys.all }),
        queryClient.invalidateQueries({ queryKey: workoutKeys.list }),
      ]);
      toast.success(
        result.pending > 0
          ? 'Sincronizacao agendada para uma nova tentativa.'
          : 'Alteracoes sincronizadas.',
      );
    },
    onError: (error) =>
      toast.error(describeApiError(error, 'A alteracao ainda precisa de atencao.')),
  });
  const discard = useMutation({
    mutationFn: () => discardOfflineChanges(ownerId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      toast.success('Alteracoes locais descartadas. Os dados do servidor foram recarregados.');
    },
    onError: (error) =>
      toast.error(describeApiError(error, 'Nao foi possivel descartar as alteracoes locais.')),
  });

  if (status.blocked > 0) {
    return (
      <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
        <p className="flex items-center gap-2 font-medium">
          <CloudOff className="size-4" />
          {status.blocked}{' '}
          {status.blocked === 1
            ? 'alteracao local precisa de atencao'
            : 'alteracoes locais precisam de atencao'}
        </p>
        <p className="mt-1">
          O servidor recusou a sincronizacao. Nada foi descartado automaticamente.
        </p>
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={retry.isPending}
            onClick={() => retry.mutate()}
          >
            Tentar novamente
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={discard.isPending}
            onClick={() => {
              if (
                window.confirm(
                  'Descartar todas as alteracoes offline que ainda nao chegaram ao servidor?',
                )
              ) {
                discard.mutate();
              }
            }}
          >
            Descartar locais
          </Button>
        </div>
      </div>
    );
  }

  if (status.pending === 0) return null;

  return (
    <p className="mt-3 flex items-center gap-2 rounded-lg bg-warning/10 p-2 text-xs text-warning">
      <CloudOff className="size-4" />
      {status.pending} {status.pending === 1 ? 'alteracao aguarda' : 'alteracoes aguardam'}{' '}
      sincronizacao
    </p>
  );
}
