import { describe, expect, it } from 'vitest';

import type { WorkoutDetail } from './types';
import {
  applyLocalSet,
  createLocalSession,
  finishLocalSession,
  removeLocalSet,
  setLocalExerciseStatus,
} from './session-state';

const WORKOUT: WorkoutDetail = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Treino A',
  notes: null,
  position: 0,
  isArchived: false,
  exerciseCount: 1,
  version: 3,
  createdAt: '2026-08-09T10:00:00.000Z',
  updatedAt: '2026-08-09T10:00:00.000Z',
  exercises: [
    {
      id: '20000000-0000-4000-8000-000000000001',
      position: 0,
      targetSets: 3,
      repMin: 8,
      repMax: 12,
      restSeconds: 90,
      notes: 'Controle a descida',
      exercise: {
        id: '30000000-0000-4000-8000-000000000001',
        name: 'Supino reto',
        primaryMuscle: 'CHEST',
        secondaryMuscles: ['TRICEPS'],
        equipment: 'BARBELL',
        difficulty: 'MEDIUM',
        isArchived: false,
        isGlobal: true,
      },
    },
  ],
};

function createSession() {
  return createLocalSession(
    WORKOUT,
    '40000000-0000-4000-8000-000000000001',
    '2026-08-09T12:00:00.000Z',
    '2026-08-09',
    () => '50000000-0000-4000-8000-000000000001',
  );
}

describe('offline session state', () => {
  it('preserva o snapshot e os identificadores escolhidos pelo cliente', () => {
    // Evita que uma ficha editada depois altere ou torne impossivel o replay da sessao offline.
    const result = createSession();

    expect(result.session).toMatchObject({
      id: '40000000-0000-4000-8000-000000000001',
      templateName: 'Treino A',
      status: 'ACTIVE',
    });
    expect(result.session.exercises[0]).toMatchObject({
      id: '50000000-0000-4000-8000-000000000001',
      exerciseName: 'Supino reto',
      targetSets: 3,
    });
    expect(result.request.exercises?.[0]?.id).toBe('50000000-0000-4000-8000-000000000001');
  });

  it('reconcilia series pelo UUID e exclui aquecimento do volume', () => {
    // Evita duplicacao no replay e impede que aquecimento infle os indicadores de progresso.
    const { session } = createSession();
    const exerciseId = session.exercises[0]!.id;
    const warmup = applyLocalSet(session, '60000000-0000-4000-8000-000000000001', {
      sessionExerciseId: exerciseId,
      setNumber: 1,
      weightKg: '20.00',
      reps: 10,
      isWarmup: true,
      clientCompletedAt: '2026-08-09T12:05:00.000Z',
    });
    const working = applyLocalSet(warmup, '60000000-0000-4000-8000-000000000002', {
      sessionExerciseId: exerciseId,
      setNumber: 2,
      weightKg: '50.00',
      reps: 8,
      isWarmup: false,
      clientCompletedAt: '2026-08-09T12:08:00.000Z',
    });
    const replayed = applyLocalSet(working, '60000000-0000-4000-8000-000000000002', {
      sessionExerciseId: exerciseId,
      setNumber: 2,
      weightKg: '52.50',
      reps: 8,
      isWarmup: false,
      clientCompletedAt: '2026-08-09T12:09:00.000Z',
    });

    expect(replayed.exercises[0]?.sets).toHaveLength(2);
    expect(replayed.workingSets).toBe(1);
    expect(replayed.totalVolumeKg).toBe('420.00');
    expect(removeLocalSet(replayed, '60000000-0000-4000-8000-000000000002')).toMatchObject({
      workingSets: 0,
      totalVolumeKg: '0.00',
    });
  });

  it('mantem transicoes de exercicio e encerramento coerentes no aparelho', () => {
    // Evita que recarregar a PWA reabra um treino que o usuario ja encerrou offline.
    const { session } = createSession();
    const exerciseId = session.exercises[0]!.id;
    const completedExercise = setLocalExerciseStatus(session, exerciseId, 'DONE');
    const completed = finishLocalSession(
      completedExercise,
      'complete',
      '2026-08-09T12:45:30.000Z',
      'Treino concluido offline',
    );

    expect(completed.exercises[0]?.status).toBe('DONE');
    expect(completed).toMatchObject({
      status: 'COMPLETED',
      durationMinutes: 45,
      notes: 'Treino concluido offline',
    });
  });
});
