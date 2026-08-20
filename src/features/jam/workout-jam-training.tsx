'use client';

import { useMutation } from '@tanstack/react-query';
import { Check, CircleStop, History, Radio, UserRound } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ExerciseSetsForm, type ExerciseSetInput } from '@/features/sessions/exercise-sets-modal';
import { describeApiError } from '@/lib/api/result';

import { describeWorkoutJamEvent, participantName } from './activity';
import {
  finishJamSession,
  loadWorkoutJam,
  replaceJamExerciseSets,
  upsertJamSet,
  type SessionDetail,
  type SessionExercise,
  type UpsertSetRequest,
  type WorkoutJamParticipant,
  type WorkoutJamSnapshot,
} from './api';
import { participantInitials } from './invite-code';
import { describeJamBlock } from './readiness';
import type { useWorkoutJam } from './use-workout-jam';
import { JamExerciseDraftConflictError, runVersionedJamExerciseWrite } from './version-conflict';

type WorkoutJamController = ReturnType<typeof useWorkoutJam>;

export function WorkoutJamTraining({
  ownerId,
  jam,
  onOwnSessionUpdated,
  onOwnSessionFinished,
}: {
  readonly ownerId: string;
  readonly jam: WorkoutJamController;
  readonly onOwnSessionUpdated: (session: SessionDetail) => void;
  readonly onOwnSessionFinished: (session: SessionDetail, jamEnded: boolean) => void;
}) {
  const snapshot = jam.active.data;
  if (!snapshot || snapshot.status !== 'ACTIVE') return null;
  const activeSnapshot: WorkoutJamSnapshot = snapshot;

  const writeBlock = describeJamBlock(
    {
      online: jam.online,
      pending: 0,
      blocked: 0,
      channelConnected: jam.channelConnected,
    },
    true,
  );

  function applySession(session: SessionDetail): void {
    jam.setSnapshot((current) => (current ? replaceSnapshotSession(current, session) : null));
    const participant = activeSnapshot.participants.find((item) => item.session?.id === session.id);
    if (participant?.profileId === ownerId) onOwnSessionUpdated(session);
  }

  return (
    <section aria-labelledby="jam-training-title" className="flex flex-col gap-4">
      <Card className="border-primary/50 bg-primary/10">
        <div className="flex items-center gap-2">
          <Radio className="size-5 text-primary" />
          <CardTitle id="jam-training-title">Treino compartilhado ao vivo</CardTitle>
        </div>
        <CardDescription className="mt-1">
          Cada bloco identifica o dono do treino. Antes de salvar, confira para quem você está
          registrando.
        </CardDescription>
        {writeBlock ? (
          <p role="status" className="mt-3 rounded-lg bg-warning/10 p-3 text-sm text-warning">
            {writeBlock}
          </p>
        ) : null}
      </Card>

      {activeSnapshot.participants.map((participant) => {
        const session = activeSnapshot.sessions.find((item) => item.id === participant.session?.id);
        if (!session) return null;
        return (
          <ParticipantTraining
            key={participant.id}
            ownerId={ownerId}
            participant={participant}
            session={session}
            jamId={activeSnapshot.id}
            writeBlock={writeBlock}
            onUpdated={applySession}
            onSnapshot={(fresh) => jam.setSnapshot(fresh)}
            onFinished={(updated) =>
              onOwnSessionFinished(updated, participant.profileId === activeSnapshot.hostId)
            }
            onRefresh={() => void jam.refresh()}
          />
        );
      })}

      <JamActivity snapshot={activeSnapshot} jam={jam} />
    </section>
  );
}

function ParticipantTraining({
  ownerId,
  participant,
  session,
  jamId,
  writeBlock,
  onUpdated,
  onSnapshot,
  onFinished,
  onRefresh,
}: {
  readonly ownerId: string;
  readonly participant: WorkoutJamParticipant;
  readonly session: SessionDetail;
  readonly jamId: string;
  readonly writeBlock: string | null;
  readonly onUpdated: (session: SessionDetail) => void;
  readonly onSnapshot: (snapshot: WorkoutJamSnapshot) => void;
  readonly onFinished: (session: SessionDetail) => void;
  readonly onRefresh: () => void;
}) {
  const isOwn = participant.profileId === ownerId;
  const ownerName = participant.name?.trim() || `Participante ${participant.profileId.slice(0, 6)}`;
  const [notes, setNotes] = useState(session.notes ?? '');

  const finish = useMutation({
    mutationFn: (action: 'complete' | 'abandon') =>
      finishJamSession(session.id, action, notes.trim() || null),
    onSuccess: (updated) => {
      onUpdated(updated);
      onFinished(updated);
      onRefresh();
      toast.success(
        updated.status === 'COMPLETED'
          ? 'Seu treino foi concluído.'
          : 'Seu treino foi encerrado sem concluir.',
      );
    },
    onError: (error) => toast.error(describeApiError(error, 'Não foi possível encerrar o treino.')),
  });

  return (
    <div className="flex flex-col gap-3" aria-labelledby={`jam-participant-${participant.id}`}>
      <Card className="border-2 border-border">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary">
            {participantInitials(ownerName)}
          </span>
          <div className="min-w-0 flex-1">
            <CardTitle id={`jam-participant-${participant.id}`} className="break-words">
              Treino de {ownerName}
            </CardTitle>
            <CardDescription className="mt-1">
              {isOwn ? 'Este é o seu treino' : `Você pode registrar séries para ${ownerName}`} ·{' '}
              {participant.isHost ? 'Anfitrião administrador' : 'Convidado'} ·{' '}
              {participant.isOnline ? 'Online' : 'Offline'}
            </CardDescription>
          </div>
        </div>
        <p className="mt-3 rounded-lg bg-secondary/50 p-3 text-sm">
          Ficha: <strong>{session.templateName}</strong> · Estado:{' '}
          {sessionStatusLabel(session.status)}
        </p>
      </Card>

      {session.exercises.map((exercise) => (
        <JamExerciseLogger
          key={exercise.id}
          session={session}
          jamId={jamId}
          exercise={exercise}
          ownerName={ownerName}
          isOwn={isOwn}
          disabled={Boolean(writeBlock) || session.status !== 'ACTIVE'}
          onUpdated={onUpdated}
          onSnapshot={onSnapshot}
        />
      ))}

      {isOwn ? (
        <Card>
          <label htmlFor={`jam-notes-${session.id}`} className="text-sm font-medium">
            Observações do seu treino
          </label>
          <Textarea
            id={`jam-notes-${session.id}`}
            className="mt-1"
            value={notes}
            maxLength={1000}
            disabled={session.status !== 'ACTIVE'}
            onChange={(event) => setNotes(event.target.value)}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Somente {ownerName} pode encerrar este treino. O outro participante não recebe esse
            controle.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
            <Button
              variant="destructive"
              disabled={Boolean(writeBlock) || finish.isPending || session.status !== 'ACTIVE'}
              onClick={() => {
                if (
                  window.confirm('Encerrar o seu treino sem concluir? As séries serão preservadas.')
                ) {
                  finish.mutate('abandon');
                }
              }}
            >
              <CircleStop /> Abandonar meu treino
            </Button>
            <Button
              disabled={Boolean(writeBlock) || finish.isPending || session.status !== 'ACTIVE'}
              onClick={() => finish.mutate('complete')}
            >
              <Check /> {finish.isPending ? 'Encerrando...' : 'Concluir meu treino'}
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function JamExerciseLogger({
  session,
  jamId,
  exercise,
  ownerName,
  isOwn,
  disabled,
  onUpdated,
  onSnapshot,
}: {
  readonly session: SessionDetail;
  readonly jamId: string;
  readonly exercise: SessionExercise;
  readonly ownerName: string;
  readonly isOwn: boolean;
  readonly disabled: boolean;
  readonly onUpdated: (session: SessionDetail) => void;
  readonly onSnapshot: (snapshot: WorkoutJamSnapshot) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [baselineFingerprint, setBaselineFingerprint] = useState<string | null>(null);
  const [draftConflict, setDraftConflict] = useState(false);
  const baselineFingerprintRef = useRef<string | null>(null);
  const baseVersionRef = useRef<number | null>(null);

  function closeEditor(): void {
    setEditing(false);
    setBaselineFingerprint(null);
    setDraftConflict(false);
    baselineFingerprintRef.current = null;
    baseVersionRef.current = null;
  }

  function requireWriteBaseline(): { fingerprint: string; version: number } {
    const fingerprint = baselineFingerprintRef.current;
    const version = baseVersionRef.current;
    if (fingerprint === null || version === null) throw new JamExerciseDraftConflictError();
    return { fingerprint, version };
  }

  const saveSets = useMutation({
    mutationFn: async (sets: ExerciseSetInput[]) => {
      const baseline = requireWriteBaseline();
      return runVersionedJamExerciseWrite({
        sessionId: session.id,
        sessionExerciseId: exercise.id,
        expectedVersion: baseline.version,
        baselineFingerprint: baseline.fingerprint,
        fingerprint: exerciseSnapshotFingerprint,
        loadSnapshot: () => loadWorkoutJam(jamId),
        onSnapshot,
        write: (expectedVersion) =>
          replaceJamExerciseSets(session.id, exercise.id, sets, expectedVersion),
      });
    },
    onSuccess: (updated) => {
      onUpdated(updated);
      closeEditor();
      toast.success(`Séries registradas para ${ownerName}.`);
    },
    onError: (error) => {
      if (error instanceof JamExerciseDraftConflictError) {
        setDraftConflict(true);
        toast.error(
          `O treino de ${ownerName} mudou enquanto este formulário estava aberto. Recarregue antes de salvar.`,
        );
        return;
      }
      toast.error(describeApiError(error, `Não foi possível salvar as séries de ${ownerName}.`));
    },
  });
  const saveSet = useMutation({
    mutationFn: ({ setId, body }: { setId: string; body: UpsertSetRequest }) => {
      const baseline = requireWriteBaseline();
      return runVersionedJamExerciseWrite({
        sessionId: session.id,
        sessionExerciseId: exercise.id,
        expectedVersion: baseline.version,
        baselineFingerprint: baseline.fingerprint,
        fingerprint: exerciseSnapshotFingerprint,
        loadSnapshot: () => loadWorkoutJam(jamId),
        onSnapshot,
        write: (expectedVersion) => upsertJamSet(session.id, setId, body, expectedVersion),
      });
    },
    onSuccess: (updated) => {
      const updatedExercise = updated.exercises.find((item) => item.id === exercise.id);
      if (updatedExercise) {
        const nextFingerprint = exerciseSnapshotFingerprint(updatedExercise);
        baselineFingerprintRef.current = nextFingerprint;
        baseVersionRef.current = updated.version;
        setBaselineFingerprint(nextFingerprint);
      }
      onUpdated(updated);
      toast.success(`Série registrada para ${ownerName}.`);
    },
    onError: (error) => {
      if (error instanceof JamExerciseDraftConflictError) {
        setDraftConflict(true);
        toast.error(
          `O treino de ${ownerName} mudou enquanto este formulário estava aberto. Recarregue antes de salvar.`,
        );
        return;
      }
      toast.error(describeApiError(error, `Não foi possível salvar a série de ${ownerName}.`));
    },
  });

  const remoteDraftConflict = Boolean(
    editing &&
    baselineFingerprint &&
    exerciseSnapshotFingerprint(exercise) !== baselineFingerprint &&
    !saveSet.isPending &&
    !saveSets.isPending,
  );
  const formConflict = draftConflict || remoteDraftConflict;
  const formBlocked = disabled || formConflict;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="break-words">{exercise.exerciseName}</CardTitle>
          <CardDescription className="mt-1">
            Séries de <strong className="text-foreground">{ownerName}</strong> ·{' '}
            {exercise.targetSets} séries · {exercise.repMin}–{exercise.repMax} repetições
          </CardDescription>
        </div>
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {exercise.sets.length}/{exercise.targetSets}
        </span>
      </div>

      {!editing ? (
        <div className="mt-3 border-t border-border pt-3">
          {exercise.sets.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {exercise.sets.map((set) => (
                <li key={set.id} className="rounded-lg bg-secondary/40 px-3 py-2 text-sm">
                  <span className="block font-medium">
                    Série {set.setNumber} de {ownerName}
                  </span>
                  <span className="tabular text-muted-foreground">
                    {set.weightKg} kg × {set.reps} repetições
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma série registrada para {ownerName}.
            </p>
          )}
          <Button
            className="mt-3 w-full"
            disabled={disabled}
            onClick={() => {
              const fingerprint = exerciseSnapshotFingerprint(exercise);
              baselineFingerprintRef.current = fingerprint;
              baseVersionRef.current = session.version;
              setBaselineFingerprint(fingerprint);
              setDraftConflict(false);
              setEditing(true);
            }}
          >
            <UserRound /> {exercise.sets.length > 0 ? 'Editar' : 'Registrar'} séries para{' '}
            {ownerName}
          </Button>
        </div>
      ) : (
        <div className="mt-3 border-t border-border pt-3">
          <p
            role="status"
            className="mb-3 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm font-semibold"
          >
            Você está registrando para {ownerName}.
          </p>
          {formConflict ? (
            <div className="mb-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <p role="alert">
                O treino de {ownerName} mudou em outro aparelho. Seu rascunho não foi enviado.
              </p>
              <Button className="mt-2" size="sm" variant="outline" onClick={closeEditor}>
                Recarregar séries confirmadas
              </Button>
            </div>
          ) : null}
          <ExerciseSetsForm
            exercise={exercise}
            pending={saveSets.isPending || saveSet.isPending}
            disabled={formBlocked}
            showLoadSuggestion={isOwn}
            onSubmit={(sets) => saveSets.mutate(sets)}
            onCancel={closeEditor}
            onSetCompleted={(setId, body) => saveSet.mutateAsync({ setId, body })}
            submitLabel={`Concluir exercício de ${ownerName}`}
          />
        </div>
      )}
    </Card>
  );
}

function JamActivity({
  snapshot,
  jam,
}: {
  readonly snapshot: WorkoutJamSnapshot;
  readonly jam: WorkoutJamController;
}) {
  const events = jam.events.data?.data ?? [];
  return (
    <Card aria-labelledby="jam-activity-title">
      <div className="flex items-center gap-2">
        <History className="size-5 text-primary" />
        <CardTitle id="jam-activity-title">Atividade da Jam</CardTitle>
      </div>
      <CardDescription className="mt-1">
        Mostra quem alterou e de quem era o treino, sem expor carga ou repetições no canal ao vivo.
      </CardDescription>
      {jam.events.isPending ? (
        <p className="mt-3" aria-busy="true">
          Carregando atividade...
        </p>
      ) : null}
      {jam.events.isError ? (
        <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <p role="alert">
            {describeApiError(jam.events.error, 'Não foi possível carregar a atividade da Jam.')}
          </p>
          <Button
            className="mt-2"
            size="sm"
            variant="outline"
            onClick={() => void jam.events.refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : null}
      {events.length > 0 ? (
        <ol className="mt-3 flex flex-col gap-2" aria-live="polite">
          {[...events]
            .reverse()
            .slice(0, 10)
            .map((event) => (
              <li key={event.id} className="rounded-lg bg-secondary/40 p-3 text-sm">
                <p>{describeWorkoutJamEvent(event, snapshot.participants)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatEventTime(event.occurredAt)} · ator:{' '}
                  {participantName(event.actorId, snapshot.participants)} → dono:{' '}
                  {participantName(event.subjectId, snapshot.participants)}
                </p>
              </li>
            ))}
        </ol>
      ) : !jam.events.isPending && !jam.events.isError ? (
        <p className="mt-3 text-sm text-muted-foreground">A atividade aparecerá aqui.</p>
      ) : null}
    </Card>
  );
}

export function replaceSnapshotSession(
  snapshot: WorkoutJamSnapshot,
  updated: SessionDetail,
): WorkoutJamSnapshot {
  return {
    ...snapshot,
    sessions: snapshot.sessions.map((session) => (session.id === updated.id ? updated : session)),
    participants: snapshot.participants.map((participant) =>
      participant.session?.id === updated.id
        ? {
            ...participant,
            session: {
              ...participant.session,
              status: updated.status,
              version: updated.version,
            },
          }
        : participant,
    ),
  };
}

export function exerciseSnapshotFingerprint(exercise: SessionExercise): string {
  return JSON.stringify({
    status: exercise.status,
    sets: [...exercise.sets]
      .sort((left, right) => left.setNumber - right.setNumber)
      .map((set) => ({
        id: set.id,
        setNumber: set.setNumber,
        weightKg: set.weightKg,
        reps: set.reps,
        isWarmup: set.isWarmup,
        notes: set.notes ?? null,
        completedAt: set.completedAt,
      })),
  });
}

function sessionStatusLabel(status: SessionDetail['status']): string {
  return {
    ACTIVE: 'em andamento',
    COMPLETED: 'concluído',
    ABANDONED: 'abandonado',
  }[status];
}

function formatEventTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(value),
  );
}
