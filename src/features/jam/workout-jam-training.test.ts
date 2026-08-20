import { describe, expect, it } from 'vitest';

import type { SessionDetail, WorkoutJamSnapshot } from './api';
import { exerciseSnapshotFingerprint, replaceSnapshotSession } from './workout-jam-training';

describe('replaceSnapshotSession', () => {
  it('atualiza somente o treino e resumo do participante correspondente', () => {
    const first = { id: 'session-a', status: 'ACTIVE', version: 1 } as SessionDetail;
    const second = { id: 'session-b', status: 'ACTIVE', version: 2 } as SessionDetail;
    const snapshot = {
      sessions: [first, second],
      participants: [
        { profileId: 'a', session: { id: 'session-a', status: 'ACTIVE', version: 1 } },
        { profileId: 'b', session: { id: 'session-b', status: 'ACTIVE', version: 2 } },
      ],
    } as WorkoutJamSnapshot;
    const updated = { ...second, status: 'COMPLETED', version: 3 } as SessionDetail;

    const result = replaceSnapshotSession(snapshot, updated);

    expect(result.sessions).toEqual([first, updated]);
    expect(result.participants[0]?.session?.version).toBe(1);
    expect(result.participants[1]?.session).toMatchObject({ status: 'COMPLETED', version: 3 });
  });
});

describe('exerciseSnapshotFingerprint', () => {
  it('detecta alteração concorrente de carga antes do replace total', () => {
    const base = {
      status: 'DONE',
      sets: [
        {
          id: 'set-a',
          setNumber: 1,
          weightKg: '20.00',
          reps: 10,
          isWarmup: false,
          notes: null,
          completedAt: '2026-08-19T12:00:00.000Z',
        },
      ],
    } as SessionDetail['exercises'][number];
    const changed = {
      ...base,
      sets: [{ ...base.sets[0]!, weightKg: '25.00' }],
    };

    expect(exerciseSnapshotFingerprint(base)).not.toBe(exerciseSnapshotFingerprint(changed));
  });
});
