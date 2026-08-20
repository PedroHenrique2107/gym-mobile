import { describe, expect, it, vi } from 'vitest';

import { ApiError, ErrorCode } from '@/lib/api/problem';

import type { SessionDetail, SessionExercise, WorkoutJamSnapshot } from './api';
import { JamExerciseDraftConflictError, runVersionedJamExerciseWrite } from './version-conflict';

function exercise(weightKg = '20.00'): SessionExercise {
  return {
    id: 'exercise-a',
    status: 'DONE',
    sets: [{ id: 'set-a', setNumber: 1, weightKg }],
  } as SessionExercise;
}

function snapshot(version: number, target = exercise()): WorkoutJamSnapshot {
  return {
    sessions: [{ id: 'session-a', version, exercises: [target] } as SessionDetail],
  } as WorkoutJamSnapshot;
}

function versionConflict(): ApiError {
  return new ApiError({
    status: 409,
    code: ErrorCode.RESOURCE_VERSION_CONFLICT,
    message: 'Versão divergente.',
  });
}

const fingerprint = (target: SessionExercise): string =>
  JSON.stringify(target.sets.map((set) => [set.id, set.weightKg, set.reps]));

describe('runVersionedJamExerciseWrite', () => {
  it('repete uma vez com a versão fresca quando somente outro exercício mudou', async () => {
    const fresh = snapshot(4);
    const loadSnapshot = vi.fn().mockResolvedValue(fresh);
    const onSnapshot = vi.fn();
    const write = vi.fn().mockRejectedValueOnce(versionConflict()).mockResolvedValueOnce('saved');

    await expect(
      runVersionedJamExerciseWrite({
        sessionId: 'session-a',
        sessionExerciseId: 'exercise-a',
        expectedVersion: 3,
        baselineFingerprint: fingerprint(exercise()),
        fingerprint,
        loadSnapshot,
        onSnapshot,
        write,
      }),
    ).resolves.toBe('saved');

    expect(write).toHaveBeenNthCalledWith(1, 3);
    expect(write).toHaveBeenNthCalledWith(2, 4);
    expect(onSnapshot).toHaveBeenCalledWith(fresh);
  });

  it('bloqueia sem retry quando o exercício aberto mudou', async () => {
    const fresh = snapshot(4, exercise('25.00'));
    const write = vi.fn().mockRejectedValueOnce(versionConflict());

    await expect(
      runVersionedJamExerciseWrite({
        sessionId: 'session-a',
        sessionExerciseId: 'exercise-a',
        expectedVersion: 3,
        baselineFingerprint: fingerprint(exercise()),
        fingerprint,
        loadSnapshot: vi.fn().mockResolvedValue(fresh),
        onSnapshot: vi.fn(),
        write,
      }),
    ).rejects.toBeInstanceOf(JamExerciseDraftConflictError);

    expect(write).toHaveBeenCalledTimes(1);
  });

  it('não faz um terceiro write quando o retry também conflita', async () => {
    const firstFresh = snapshot(4);
    const latest = snapshot(5);
    const loadSnapshot = vi.fn().mockResolvedValueOnce(firstFresh).mockResolvedValueOnce(latest);
    const onSnapshot = vi.fn();
    const write = vi.fn().mockRejectedValue(versionConflict());

    await expect(
      runVersionedJamExerciseWrite({
        sessionId: 'session-a',
        sessionExerciseId: 'exercise-a',
        expectedVersion: 3,
        baselineFingerprint: fingerprint(exercise()),
        fingerprint,
        loadSnapshot,
        onSnapshot,
        write,
      }),
    ).rejects.toBeInstanceOf(JamExerciseDraftConflictError);

    expect(write).toHaveBeenCalledTimes(2);
    expect(onSnapshot).toHaveBeenLastCalledWith(latest);
  });
});
