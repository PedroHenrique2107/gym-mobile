import { apiClient } from '@/lib/api/client';
import type { components } from '@/lib/api/generated/types';
import { ApiError } from '@/lib/api/problem';
import { requireApiData, requireApiSuccess } from '@/lib/api/result';
import { todayCivil } from '@/lib/dates/civil-date';

export type WorkoutJamSnapshot = components['schemas']['WorkoutJamSnapshotResponse'];
export type WorkoutJamParticipant = components['schemas']['WorkoutJamParticipantResponse'];
export type WorkoutJamEvent = components['schemas']['WorkoutJamEventResponse'];
export type WorkoutJamInvitePreview = components['schemas']['WorkoutJamInvitePreviewResponse'];
export type SessionDetail = components['schemas']['SessionDetailResponse'];
export type SessionExercise = components['schemas']['SessionExerciseResponse'];
export type ExerciseSetInput = components['schemas']['ExerciseSetInput'];
export type UpsertSetRequest = components['schemas']['UpsertSetRequest'];
export type WorkoutList = components['schemas']['WorkoutListResponse'];

export async function loadActiveWorkoutJam(): Promise<WorkoutJamSnapshot | null> {
  try {
    const { data, error } = await apiClient.GET('/api/v1/workout-jams/active');
    return requireApiData(data, error, 'carregar a Jam atual');
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function loadWorkoutJam(jamId: string): Promise<WorkoutJamSnapshot> {
  const { data, error } = await apiClient.GET('/api/v1/workout-jams/{jamId}', {
    params: { path: { jamId } },
  });
  return requireApiData(data, error, 'atualizar a Jam');
}

export async function createWorkoutJam(
  sessionId: string,
): Promise<components['schemas']['CreateWorkoutJamResponse']> {
  const { data, error } = await apiClient.POST('/api/v1/workout-jams', {
    body: { sessionId },
  });
  return requireApiData(data, error, 'iniciar a Jam');
}

export async function previewWorkoutJamInvite(
  inviteCode: string,
): Promise<WorkoutJamInvitePreview> {
  const { data, error } = await apiClient.POST('/api/v1/workout-jams/invitations/preview', {
    body: { inviteCode },
  });
  return requireApiData(data, error, 'consultar o convite da Jam');
}

export async function acceptWorkoutJamInvite(
  inviteCode: string,
  sessionId: string,
): Promise<WorkoutJamSnapshot> {
  const { data, error } = await apiClient.POST('/api/v1/workout-jams/invitations/accept', {
    body: { inviteCode, sessionId },
  });
  return requireApiData(data, error, 'aceitar o convite da Jam');
}

export async function declineWorkoutJamInvite(inviteCode: string): Promise<void> {
  const { error } = await apiClient.POST('/api/v1/workout-jams/invitations/decline', {
    body: { inviteCode },
  });
  requireApiSuccess(error, 'recusar o convite da Jam');
}

export async function leaveWorkoutJam(jamId: string): Promise<void> {
  const { error } = await apiClient.POST('/api/v1/workout-jams/{jamId}/leave', {
    params: { path: { jamId } },
  });
  requireApiSuccess(error, 'sair da Jam');
}

export async function heartbeatWorkoutJam(jamId: string): Promise<void> {
  const { data, error } = await apiClient.POST('/api/v1/workout-jams/{jamId}/presence', {
    params: { path: { jamId } },
  });
  requireApiData(data, error, 'atualizar a presença na Jam');
}

export async function loadWorkoutJamEvents(
  jamId: string,
  afterSequence = '0',
): Promise<components['schemas']['WorkoutJamEventListResponse']> {
  const { data, error } = await apiClient.GET('/api/v1/workout-jams/{jamId}/events', {
    params: { path: { jamId }, query: { afterSequence } },
  });
  return requireApiData(data, error, 'carregar a atividade da Jam');
}

export async function loadActiveSessionOnline(): Promise<SessionDetail | null> {
  try {
    const { data, error } = await apiClient.GET('/api/v1/sessions/active');
    return requireApiData(data, error, 'procurar o treino ativo');
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function loadWorkoutsOnline(): Promise<WorkoutList> {
  const { data, error } = await apiClient.GET('/api/v1/workouts');
  return requireApiData(data, error, 'carregar as fichas');
}

export async function startSessionOnline(templateId: string): Promise<SessionDetail> {
  const sessionId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const { data, error } = await apiClient.PUT('/api/v1/sessions/{sessionId}', {
    params: { path: { sessionId } },
    body: {
      templateId,
      plannedDate: todayCivil(),
      clientStartedAt: startedAt,
    },
  });
  return requireApiData(data, error, 'iniciar o treino online');
}

export async function replaceJamExerciseSets(
  sessionId: string,
  sessionExerciseId: string,
  sets: ExerciseSetInput[],
  expectedVersion: number,
): Promise<SessionDetail> {
  const { data, error } = await apiClient.PUT(
    '/api/v1/sessions/{sessionId}/exercises/{sessionExerciseId}/sets',
    {
      params: {
        path: { sessionId, sessionExerciseId },
        header: { 'If-Match': `"${expectedVersion}"` },
      },
      body: { sets },
    },
  );
  return requireApiData(data, error, 'salvar as séries da Jam');
}

export async function upsertJamSet(
  sessionId: string,
  setId: string,
  body: UpsertSetRequest,
  expectedVersion: number,
): Promise<SessionDetail> {
  const { data, error } = await apiClient.PUT('/api/v1/sessions/{sessionId}/sets/{setId}', {
    params: {
      path: { sessionId, setId },
      header: { 'If-Match': `"${expectedVersion}"` },
    },
    body,
  });
  return requireApiData(data, error, 'salvar a série da Jam');
}

export async function finishJamSession(
  sessionId: string,
  action: 'complete' | 'abandon',
  notes: string | null,
): Promise<SessionDetail> {
  const options = {
    params: {
      path: { sessionId },
      header: { 'Idempotency-Key': crypto.randomUUID() },
    },
    body: { clientEndedAt: new Date().toISOString(), notes },
  };

  const result =
    action === 'complete'
      ? await apiClient.POST('/api/v1/sessions/{sessionId}/complete', options)
      : await apiClient.POST('/api/v1/sessions/{sessionId}/abandon', options);
  return requireApiData(result.data, result.error, 'encerrar o treino da Jam');
}
