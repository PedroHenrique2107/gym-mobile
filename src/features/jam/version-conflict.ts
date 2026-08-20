import { ApiError, ErrorCode } from '@/lib/api/problem';

import type { SessionDetail, SessionExercise, WorkoutJamSnapshot } from './api';

interface VersionedJamExerciseWriteOptions<T> {
  readonly sessionId: string;
  readonly sessionExerciseId: string;
  readonly expectedVersion: number;
  readonly baselineFingerprint: string;
  readonly fingerprint: (exercise: SessionExercise) => string;
  readonly loadSnapshot: () => Promise<WorkoutJamSnapshot>;
  readonly onSnapshot: (snapshot: WorkoutJamSnapshot) => void;
  readonly write: (expectedVersion: number) => Promise<T>;
}

/**
 * Evita que uma gravação da Jam sobrescreva silenciosamente uma alteração
 * concorrente. Uma mudança em outro exercício apenas avança a versão usada em
 * uma única nova tentativa; uma mudança no exercício aberto bloqueia o
 * rascunho para revisão.
 */
export async function runVersionedJamExerciseWrite<T>({
  sessionId,
  sessionExerciseId,
  expectedVersion,
  baselineFingerprint,
  fingerprint,
  loadSnapshot,
  onSnapshot,
  write,
}: VersionedJamExerciseWriteOptions<T>): Promise<T> {
  try {
    return await write(expectedVersion);
  } catch (error) {
    if (!isResourceVersionConflict(error)) throw error;
  }

  const fresh = await loadSnapshot();
  onSnapshot(fresh);
  const freshSession = findSession(fresh, sessionId);
  const freshExercise = freshSession?.exercises.find((item) => item.id === sessionExerciseId);

  if (!freshSession || !freshExercise || fingerprint(freshExercise) !== baselineFingerprint) {
    throw new JamExerciseDraftConflictError();
  }

  try {
    return await write(freshSession.version);
  } catch (error) {
    if (!isResourceVersionConflict(error)) throw error;

    // A segunda colisão pode ter acontecido entre o refetch e o retry. Um novo
    // snapshot deixa a tela coerente, mas não fazemos um terceiro write.
    try {
      onSnapshot(await loadSnapshot());
    } catch {
      // O conflito original continua sendo a informação acionável. O botão de
      // recarregar permite tentar o GET novamente quando a rede estabilizar.
    }
    throw new JamExerciseDraftConflictError();
  }
}

export function isResourceVersionConflict(error: unknown): error is ApiError {
  return error instanceof ApiError && error.code === ErrorCode.RESOURCE_VERSION_CONFLICT;
}

export class JamExerciseDraftConflictError extends Error {
  constructor() {
    super('O treino mudou enquanto o formulário estava aberto.');
    this.name = 'JamExerciseDraftConflictError';
  }
}

function findSession(snapshot: WorkoutJamSnapshot, sessionId: string): SessionDetail | undefined {
  return snapshot.sessions.find((session) => session.id === sessionId);
}
