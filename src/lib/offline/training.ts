import { apiClient } from '@/lib/api/client';
import type { components } from '@/lib/api/generated/types';
import { ApiError } from '@/lib/api/problem';
import { requireApiData } from '@/lib/api/result';

import {
  enqueueOperation,
  listWorkouts,
  readActiveSession,
  readWorkout,
  removeActiveSession,
  removeOperation,
  writeActiveSession,
  writeWorkout,
} from './repository';
import {
  applyLocalSet,
  createLocalSession,
  finishLocalSession,
  removeLocalSet,
  replaceLocalExerciseSets,
  setLocalExerciseStatus,
} from './session-state';
import { syncOutbox } from './sync';
import type {
  FinishSessionRequest,
  ReplaceExerciseSetsRequest,
  SessionDetail,
  UpsertSetRequest,
  WorkoutDetail,
} from './types';

type WorkoutList = components['schemas']['WorkoutListResponse'];
type SetLog = components['schemas']['SetLogResponse'];

export interface OfflineMutationResult {
  readonly session: SessionDetail;
  readonly queued: boolean;
}

export async function loadActiveSession(ownerId: string): Promise<SessionDetail | null> {
  try {
    const { data, error } = await apiClient.GET('/api/v1/sessions/active');
    const session = requireApiData(data, error, 'procurar o treino ativo');
    await writeActiveSession(ownerId, session);
    return session;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      await removeActiveSession(ownerId);
      return null;
    }
    if (isRetryable(error)) return readActiveSession(ownerId);
    throw error;
  }
}

export async function loadWorkouts(ownerId: string): Promise<WorkoutList> {
  try {
    const { data, error } = await apiClient.GET('/api/v1/workouts');
    const response = requireApiData(data, error, 'listar as fichas');
    await Promise.all(
      response.data.map(async (summary) => {
        const cached = await readWorkout(ownerId, summary.id);
        if (cached?.version === summary.version) return;
        const detail = await apiClient.GET('/api/v1/workouts/{id}', {
          params: { path: { id: summary.id } },
        });
        await writeWorkout(ownerId, requireApiData(detail.data, detail.error, 'guardar a ficha'));
      }),
    );
    return response;
  } catch (error) {
    if (!isRetryable(error)) throw error;
    const cached = await listWorkouts(ownerId);
    if (cached.length === 0) throw error;
    return { data: cached.map(toSummary), total: cached.length };
  }
}

export async function startTraining(
  ownerId: string,
  workoutId: string,
  plannedDate: string,
): Promise<OfflineMutationResult> {
  const workout = await getWorkout(ownerId, workoutId);
  const sessionId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const local = createLocalSession(workout, sessionId, startedAt, plannedDate);
  const operationId = `start:${sessionId}`;
  await writeActiveSession(ownerId, local.session);
  await enqueueOperation(ownerId, operationId, {
    kind: 'START_SESSION',
    sessionId,
    body: local.request,
  });
  return syncOrLocal(ownerId, operationId, local.session);
}

export async function saveTrainingSet(
  ownerId: string,
  session: SessionDetail,
  setId: string,
  body: UpsertSetRequest,
): Promise<OfflineMutationResult> {
  const local = applyLocalSet(session, setId, body);
  const operationId = `set:${setId}`;
  await writeActiveSession(ownerId, local);
  await enqueueOperation(ownerId, operationId, {
    kind: 'UPSERT_SET',
    sessionId: session.id,
    setId,
    body,
  });
  return syncOrLocal(ownerId, operationId, local);
}

export async function deleteTrainingSet(
  ownerId: string,
  session: SessionDetail,
  set: SetLog,
): Promise<OfflineMutationResult> {
  const local = removeLocalSet(session, set.id);
  const pendingSetId = `set:${set.id}`;
  await writeActiveSession(ownerId, local);
  const wasPending = await removeOperation(pendingSetId, ownerId);
  if (wasPending) return syncOrLocal(ownerId, pendingSetId, local);
  const operationId = `delete-set:${set.id}`;
  await enqueueOperation(ownerId, operationId, {
    kind: 'DELETE_SET',
    sessionId: session.id,
    setId: set.id,
  });
  return syncOrLocal(ownerId, operationId, local);
}

export async function saveTrainingExerciseSets(
  ownerId: string,
  session: SessionDetail,
  sessionExerciseId: string,
  body: ReplaceExerciseSetsRequest,
): Promise<OfflineMutationResult> {
  const local = replaceLocalExerciseSets(session, sessionExerciseId, body);
  const operationId = `exercise-sets:${sessionExerciseId}`;
  await writeActiveSession(ownerId, local);
  await enqueueOperation(ownerId, operationId, {
    kind: 'REPLACE_EXERCISE_SETS',
    sessionId: session.id,
    sessionExerciseId,
    body,
  });
  return syncOrLocal(ownerId, operationId, local);
}

export async function updateTrainingExercise(
  ownerId: string,
  session: SessionDetail,
  sessionExerciseId: string,
  exerciseId: string,
  status: 'DONE' | 'SKIPPED',
): Promise<OfflineMutationResult> {
  const local = setLocalExerciseStatus(session, sessionExerciseId, status);
  const operationId = `exercise:${sessionExerciseId}:${crypto.randomUUID()}`;
  await writeActiveSession(ownerId, local);
  await enqueueOperation(ownerId, operationId, {
    kind: 'SET_EXERCISE_STATUS',
    sessionId: session.id,
    sessionExerciseId,
    body: { exerciseId, status },
  });
  return syncOrLocal(ownerId, operationId, local);
}

export async function finishTraining(
  ownerId: string,
  session: SessionDetail,
  action: 'complete' | 'abandon',
  body: FinishSessionRequest,
): Promise<OfflineMutationResult> {
  const endedAt = body.clientEndedAt ?? new Date().toISOString();
  const local = finishLocalSession(session, action, endedAt, body.notes ?? null);
  const operationId = `finish:${session.id}`;
  await removeActiveSession(ownerId);
  await enqueueOperation(ownerId, operationId, {
    kind: 'FINISH_SESSION',
    sessionId: session.id,
    action,
    idempotencyKey: crypto.randomUUID(),
    body,
  });
  return syncOrLocal(ownerId, operationId, local);
}

async function getWorkout(ownerId: string, workoutId: string): Promise<WorkoutDetail> {
  try {
    const { data, error } = await apiClient.GET('/api/v1/workouts/{id}', {
      params: { path: { id: workoutId } },
    });
    const workout = requireApiData(data, error, 'abrir a ficha');
    await writeWorkout(ownerId, workout);
    return workout;
  } catch (error) {
    if (!isRetryable(error)) throw error;
    const cached = await readWorkout(ownerId, workoutId);
    if (!cached) throw new Error('Esta ficha ainda não foi salva para uso offline.');
    return cached;
  }
}

function syncOrLocal(
  ownerId: string,
  operationId: string,
  local: SessionDetail,
): OfflineMutationResult {
  // A escrita local já é a confirmação visual. A rede sincroniza em segundo
  // plano e mantém a ordem da outbox; esperar o round-trip aqui fazia cada toque
  // parecer travado, sobretudo no 4G. O identificador continua no argumento
  // para deixar explícito que a operação correspondente já foi enfileirada.
  void operationId;
  void syncOutbox(ownerId, { force: true }).then(() => syncOutbox(ownerId, { force: true }));
  return {
    session: local,
    queued: typeof navigator !== 'undefined' ? !navigator.onLine : true,
  };
}

function isRetryable(error: unknown): boolean {
  return error instanceof ApiError && error.isRetryable;
}

function toSummary(workout: WorkoutDetail): components['schemas']['WorkoutSummaryResponse'] {
  return {
    id: workout.id,
    name: workout.name,
    notes: workout.notes ?? null,
    position: workout.position,
    isArchived: workout.isArchived,
    exerciseCount: workout.exerciseCount,
    updatedAt: workout.updatedAt,
    version: workout.version,
  };
}
