'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  CircleStop,
  Clock3,
  CloudOff,
  History,
  Play,
  Plus,
  SkipForward,
  Trash2,
} from 'lucide-react';
import { useState, useSyncExternalStore, type FormEvent } from 'react';
import { toast } from 'sonner';

import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { workoutKeys } from '@/features/workouts/workout-manager';
import { apiClient } from '@/lib/api/client';
import type { components } from '@/lib/api/generated/types';
import { describeApiError, requireApiData } from '@/lib/api/result';
import { todayCivil } from '@/lib/dates/civil-date';
import {
  deleteTrainingSet,
  finishTraining,
  loadActiveSession,
  loadWorkouts,
  saveTrainingSet,
  startTraining,
  updateTrainingExercise,
} from '@/lib/offline/training';
import { discardOfflineChanges, retryBlockedOperations } from '@/lib/offline/repository';
import { syncOutbox } from '@/lib/offline/sync';
import type { OfflineQueueStatus } from '@/lib/offline/types';
import { useOfflineOwnerId, useOfflineQueueStatus } from '@/lib/offline/use-offline-status';

type SessionDetail = components['schemas']['SessionDetailResponse'];
type SessionExercise = components['schemas']['SessionExerciseResponse'];
type SetLog = components['schemas']['SetLogResponse'];
type UpsertSetRequest = components['schemas']['UpsertSetRequest'];
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

  const removeSet = useMutation({
    mutationFn: async (set: SetLog) => {
      return deleteTrainingSet(ownerId, session, set);
    },
    onSuccess: (result) => {
      updateSession(result.session);
      toast.success(result.queued ? 'Serie removida e sincronizacao pendente.' : 'Serie removida.');
    },
    onError: (error) => toast.error(describeApiError(error, 'Nao foi possivel excluir a serie.')),
  });

  const finish = useMutation({
    mutationFn: async (action: 'complete' | 'abandon') => {
      if (action === 'complete') {
        let current = session;
        for (const exercise of current.exercises.filter((item) => item.status === 'PENDING')) {
          if (!exercise.exerciseId) continue;
          const status = exercise.sets.length > 0 ? 'DONE' : 'SKIPPED';
          const result = await updateTrainingExercise(
            ownerId,
            current,
            exercise.id,
            exercise.exerciseId,
            status,
          );
          current = result.session;
        }
        const body: FinishSessionRequest = {
          clientEndedAt: new Date().toISOString(),
          notes: notes.trim() || null,
        };
        return finishTraining(ownerId, current, action, body);
      }

      const body: FinishSessionRequest = {
        clientEndedAt: new Date().toISOString(),
        notes: notes.trim() || null,
      };
      return finishTraining(ownerId, session, action, body);
    },
    onSuccess: async (result) => {
      queryClient.setQueryData(sessionKeys.active, null);
      await queryClient.invalidateQueries({ queryKey: sessionKeys.all });
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
          onRemoveSet={(set) => {
            if (window.confirm(`Remover a serie ${set.setNumber}?`)) removeSet.mutate(set);
          }}
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
        <div className="mt-3 grid grid-cols-2 gap-2">
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
  onRemoveSet,
  onStatus,
}: {
  readonly ownerId: string;
  readonly session: SessionDetail;
  readonly exercise: SessionExercise;
  readonly disabled: boolean;
  readonly onUpdated: (session: SessionDetail) => void;
  readonly onRest: (seconds: number) => void;
  readonly onRemoveSet: (set: SetLog) => void;
  readonly onStatus: (status: 'DONE' | 'SKIPPED') => void;
}) {
  const [expanded, setExpanded] = useState(exercise.status === 'PENDING');
  const [weightKg, setWeightKg] = useState('');
  const [reps, setReps] = useState(exercise.repMin);
  const [rpe, setRpe] = useState('');
  const [painLevel, setPainLevel] = useState('');
  const [isWarmup, setIsWarmup] = useState(false);
  const [notes, setNotes] = useState('');
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [nextSetId, setNextSetId] = useState(() => crypto.randomUUID());

  const saveSet = useMutation({
    mutationFn: async ({ setId, body }: { setId: string; body: UpsertSetRequest }) => {
      return saveTrainingSet(ownerId, session, setId, body);
    },
    onSuccess: (result) => {
      onUpdated(result.session);
      onRest(exercise.restSeconds);
      setNotes('');
      setNextSetId(crypto.randomUUID());
      toast.success(result.queued ? 'Serie salva offline.' : 'Serie registrada.');
    },
    onError: (error) => toast.error(describeApiError(error, 'Nao foi possivel registrar a serie.')),
  });

  async function loadLastSet(): Promise<void> {
    if (!exercise.exerciseId) return;
    setLoadingSuggestion(true);
    try {
      const { data, error } = await apiClient.GET(
        '/api/v1/progress/exercises/{exerciseId}/load-suggestion',
        { params: { path: { exerciseId: exercise.exerciseId } } },
      );
      const suggestion = requireApiData(data, error, 'carregar o ultimo desempenho');
      if (suggestion.lastWeightKg !== null && suggestion.lastWeightKg !== undefined) {
        setWeightKg(suggestion.lastWeightKg);
      }
      if (suggestion.lastReps !== null && suggestion.lastReps !== undefined) {
        setReps(suggestion.lastReps);
      }
      if (suggestion.lastWeightKg === null || suggestion.lastWeightKg === undefined) {
        toast.info('Este exercicio ainda nao tem carga anterior.');
      }
    } catch (error) {
      toast.error(describeApiError(error, 'Nao foi possivel carregar a ultima serie.'));
    } finally {
      setLoadingSuggestion(false);
    }
  }

  function handleSet(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const nextSetNumber = Math.max(0, ...exercise.sets.map((set) => set.setNumber)) + 1;
    saveSet.mutate({
      setId: nextSetId,
      body: {
        sessionExerciseId: exercise.id,
        setNumber: nextSetNumber,
        weightKg: weightKg.replace(',', '.'),
        reps,
        isWarmup,
        ...(rpe ? { rpe: Number(rpe) } : {}),
        ...(painLevel ? { painLevel: Number(painLevel) } : {}),
        clientCompletedAt: new Date().toISOString(),
        notes: notes.trim() || null,
      },
    });
  }

  return (
    <Card className={exercise.status === 'SKIPPED' ? 'opacity-70' : undefined}>
      <button
        type="button"
        className="tap flex w-full items-start justify-between gap-3 text-left"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        <div>
          <CardTitle>{exercise.exerciseName}</CardTitle>
          <CardDescription className="mt-1">
            {exercise.targetSets} series · {exercise.repMin}–{exercise.repMax} repeticoes ·{' '}
            {exercise.restSeconds}s
          </CardDescription>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {exercise.status === 'PENDING'
            ? `${exercise.sets.length}/${exercise.targetSets}`
            : exerciseStatusLabel(exercise.status)}
        </span>
      </button>

      {expanded ? (
        <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
          {exercise.sets.map((set) => (
            <div
              key={set.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-secondary/40 px-3 py-2"
            >
              <p className="text-sm tabular">
                {set.isWarmup ? 'Aq.' : `${set.setNumber}.`} {set.weightKg} kg × {set.reps}
                {set.rpe ? ` · RPE ${set.rpe}` : ''}
                {set.painLevel !== null && set.painLevel !== undefined
                  ? ` · Dor ${set.painLevel}`
                  : ''}
              </p>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Remover serie ${set.setNumber}`}
                onClick={() => onRemoveSet(set)}
              >
                <Trash2 />
              </Button>
            </div>
          ))}

          {exercise.status === 'PENDING' ? (
            <form onSubmit={handleSet} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <FormField id={`weight-${exercise.id}`} label="Carga (kg)">
                  <Input
                    id={`weight-${exercise.id}`}
                    value={weightKg}
                    onChange={(event) => setWeightKg(event.target.value.replace(',', '.'))}
                    inputMode="decimal"
                    pattern="[0-9]+([.,][0-9]{1,2})?"
                    placeholder="0.00"
                    required
                  />
                </FormField>
                <FormField id={`reps-${exercise.id}`} label="Repeticoes">
                  <Input
                    id={`reps-${exercise.id}`}
                    type="number"
                    min={1}
                    max={500}
                    value={reps}
                    onChange={(event) => {
                      if (Number.isFinite(event.currentTarget.valueAsNumber)) {
                        setReps(event.currentTarget.valueAsNumber);
                      }
                    }}
                    required
                  />
                </FormField>
                <FormField id={`rpe-${exercise.id}`} label="Esforco RPE (1–10)">
                  <Input
                    id={`rpe-${exercise.id}`}
                    type="number"
                    min={1}
                    max={10}
                    value={rpe}
                    onChange={(event) => setRpe(event.target.value)}
                  />
                </FormField>
                <FormField id={`pain-${exercise.id}`} label="Dor (0–10)">
                  <Input
                    id={`pain-${exercise.id}`}
                    type="number"
                    min={0}
                    max={10}
                    value={painLevel}
                    onChange={(event) => setPainLevel(event.target.value)}
                  />
                </FormField>
              </div>
              <Input
                aria-label={`Observacao da serie de ${exercise.exerciseName}`}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={300}
                placeholder="Observacao opcional"
              />
              <label className="tap flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isWarmup}
                  onChange={(event) => setIsWarmup(event.target.checked)}
                />
                Serie de aquecimento
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  disabled={loadingSuggestion}
                  onClick={() => void loadLastSet()}
                >
                  <History /> {loadingSuggestion ? 'Buscando...' : 'Usar ultima'}
                </Button>
                <Button type="submit" disabled={disabled || saveSet.isPending || !weightKg}>
                  <Plus /> {saveSet.isPending ? 'Salvando...' : 'Registrar serie'}
                </Button>
              </div>
            </form>
          ) : null}

          {exercise.status === 'PENDING' ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" disabled={disabled} onClick={() => onStatus('SKIPPED')}>
                <SkipForward /> Pular exercicio
              </Button>
              <Button disabled={disabled} onClick={() => onStatus('DONE')}>
                <Check /> Concluir exercicio
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
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
