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
import { WorkoutCelebration } from '@/components/feedback/workout-celebration';
import { useProfile } from '@/features/profile/use-profile';
import { workoutKeys } from '@/features/workouts/workout-manager';
import type { components } from '@/lib/api/generated/types';
import { describeApiError } from '@/lib/api/result';
import { todayCivil } from '@/lib/dates/civil-date';
import {
  finishTraining,
  loadActiveSession,
  loadWorkouts,
  saveTrainingExerciseSets,
  saveTrainingSet,
  startTraining,
  updateTrainingExercise,
} from '@/lib/offline/training';
import { discardOfflineChanges, retryBlockedOperations } from '@/lib/offline/repository';
import { syncOutbox } from '@/lib/offline/sync';
import type { OfflineQueueStatus, UpsertSetRequest } from '@/lib/offline/types';
import { useOfflineOwnerId, useOfflineQueueStatus } from '@/lib/offline/use-offline-status';

import { ExerciseSetsForm, type ExerciseSetInput } from './exercise-sets-modal';

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
  const [celebrating, setCelebrating] = useState(false);
  const profile = useProfile();
  const owner = useOfflineOwnerId();
  const ownerId = owner.data;
  const queueStatus = useOfflineQueueStatus(ownerId);
  const firstName = profile.data?.fullName?.trim().split(/\s+/)[0] ?? null;

  const celebration = celebrating ? (
    <WorkoutCelebration name={firstName} onDismiss={() => setCelebrating(false)} />
  ) : null;

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
      if (!ownerId) throw new Error('A sessão local ainda não está disponível.');
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
      toast.error(describeApiError(error, 'Não foi possível iniciar o treino.'));
    },
  });

  if (owner.isPending) {
    return <Card aria-busy="true">Procurando treino em andamento...</Card>;
  }

  if (!ownerId) {
    return (
      <Card className="border-destructive/30">Não foi possível identificar a sessão local.</Card>
    );
  }

  if (active.isPending) {
    return <Card aria-busy="true">Procurando treino em andamento...</Card>;
  }

  if (active.isError) {
    return (
      <Card className="border-destructive/30">
        <p role="alert" className="text-sm text-destructive">
          {describeApiError(active.error, 'Não foi possível verificar o treino em andamento.')}
        </p>
        <Button className="mt-3" variant="outline" onClick={() => void active.refetch()}>
          Tentar novamente
        </Button>
      </Card>
    );
  }

  if (active.data) {
    return (
      <>
        <ActiveSessionView
          ownerId={ownerId}
          session={active.data}
          queueStatus={queueStatus}
          onCompleted={() => setCelebrating(true)}
        />
        {celebration}
      </>
    );
  }

  return (
    <>
      <Card className="border-primary/30 bg-primary/5">
        <div className="mb-3">
          <CardTitle>Começar treino</CardTitle>
          <CardDescription className="mt-1">
            A ficha vira um snapshot: alterações futuras não mudam esta sessão.
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
                {workout.name} · {workout.exerciseCount} exercícios
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
      {celebration}
    </>
  );
}

function ActiveSessionView({
  ownerId,
  session,
  queueStatus,
  onCompleted,
}: {
  readonly ownerId: string;
  readonly session: SessionDetail;
  readonly queueStatus: OfflineQueueStatus;
  readonly onCompleted: () => void;
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
      if (!exercise.exerciseId) throw new Error('O exercício de origem não está mais disponível.');
      return updateTrainingExercise(ownerId, session, exercise.id, exercise.exerciseId, status);
    },
    onSuccess: (result) => {
      updateSession(result.session);
      if (result.queued) toast.info('Alteração salva offline.');
    },
    onError: (error) =>
      toast.error(describeApiError(error, 'Não foi possível atualizar o exercício.')),
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

      if (result.session.status === 'COMPLETED') {
        // A comemoracao (confete + nome) ja comunica a conclusao — o toast
        // aqui so entra quando ha algo mais a dizer, que e a sincronizacao
        // pendente.
        onCompleted();
        if (result.queued) toast.success('Treino concluído. Sincronização pendente.');
        return;
      }

      toast.success(
        result.queued ? 'Treino abandonado. Sincronização pendente.' : 'Treino abandonado.',
      );
    },
    onError: (error) => toast.error(describeApiError(error, 'Não foi possível encerrar o treino.')),
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
                  'Abandonar este treino? As séries registradas continuam no histórico.',
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
  const [editingSets, setEditingSets] = useState(false);

  const saveSets = useMutation({
    mutationFn: async (sets: ExerciseSetInput[]) => {
      return saveTrainingExerciseSets(ownerId, session, exercise.id, { sets });
    },
    onSuccess: (result) => {
      onUpdated(result.session);
      onRest(exercise.restSeconds);
      setEditingSets(false);
      toast.success(
        result.queued
          ? 'Exercício concluído e salvo neste aparelho.'
          : 'Exercício concluído. Sincronizando em segundo plano.',
      );
    },
    onError: (error) => toast.error(describeApiError(error, 'Não foi possível salvar as séries.')),
  });

  const saveSet = useMutation({
    mutationFn: async ({ setId, body }: { setId: string; body: UpsertSetRequest }) => {
      return saveTrainingSet(ownerId, session, setId, body);
    },
    onSuccess: (result) => {
      onUpdated(result.session);
      // A serie sozinha ja marca o fim daquele esforco — e daqui que o
      // descanso deve comecar a contar, sem esperar o exercicio inteiro.
      onRest(exercise.restSeconds);
      if (result.queued) toast.info('Série salva neste aparelho.');
    },
    onError: (error) => toast.error(describeApiError(error, 'Não foi possível salvar esta série.')),
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
            {!editingSets ? (
              <>
                {exercise.sets.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {exercise.sets.map((set) => (
                      <li
                        key={set.id}
                        className="rounded-lg bg-secondary/40 px-3 py-2 text-sm tabular"
                      >
                        {set.isWarmup ? 'Aquecimento' : `Série ${set.setNumber}`}: {set.weightKg} kg
                        × {set.reps}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma série preenchida.</p>
                )}

                {exercise.status !== 'SKIPPED' ? (
                  <Button size="lg" disabled={disabled} onClick={() => setEditingSets(true)}>
                    <Check /> {exercise.sets.length > 0 ? 'Editar séries' : 'Preencher séries'}
                  </Button>
                ) : null}

                {exercise.status === 'PENDING' ? (
                  <Button variant="outline" disabled={disabled} onClick={() => onStatus('SKIPPED')}>
                    <SkipForward /> Pular exercício
                  </Button>
                ) : null}
              </>
            ) : (
              <div className="rounded-2xl border border-border bg-secondary/10 p-3">
                <ExerciseSetsForm
                  exercise={exercise}
                  pending={saveSets.isPending}
                  onSubmit={(sets) => saveSets.mutate(sets)}
                  onCancel={() => setEditingSets(false)}
                  onSetCompleted={(setId, body) => saveSet.mutateAsync({ setId, body })}
                />
              </div>
            )}
          </div>
        ) : null}
      </Card>
    </>
  );
}

let clockSnapshot = Date.now();

function useClock(): number {
  return useSyncExternalStore(subscribeClock, readClock, () => 0);
}

function subscribeClock(onChange: () => void): () => void {
  const timer = window.setInterval(() => {
    clockSnapshot = Date.now();
    onChange();
  }, 1000);
  return () => window.clearInterval(timer);
}

function readClock(): number {
  return clockSnapshot;
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
  return { PENDING: 'Pendente', DONE: 'Concluído', SKIPPED: 'Pulado', REPLACED: 'Substituído' }[
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
        throw new Error('A sincronização continua bloqueada.');
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
          ? 'Sincronização agendada para uma nova tentativa.'
          : 'Alterações sincronizadas.',
      );
    },
    onError: (error) =>
      toast.error(describeApiError(error, 'A alteração ainda precisa de atenção.')),
  });
  const discard = useMutation({
    mutationFn: () => discardOfflineChanges(ownerId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      toast.success('Alterações locais descartadas. Os dados do servidor foram recarregados.');
    },
    onError: (error) =>
      toast.error(describeApiError(error, 'Não foi possível descartar as alterações locais.')),
  });

  if (status.blocked > 0) {
    return (
      <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
        <p className="flex items-center gap-2 font-medium">
          <CloudOff className="size-4" />
          {status.blocked}{' '}
          {status.blocked === 1
            ? 'alteração local precisa de atenção'
            : 'alterações locais precisam de atenção'}
        </p>
        <p className="mt-1">
          O servidor recusou a sincronização. Nada foi descartado automaticamente.
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
                  'Descartar todas as alterações offline que ainda não chegaram ao servidor?',
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
      {status.pending} {status.pending === 1 ? 'alteração aguarda' : 'alterações aguardam'}{' '}
      sincronização
    </p>
  );
}
