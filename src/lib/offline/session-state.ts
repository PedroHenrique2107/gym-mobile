import type {
  ReplaceExerciseSetsRequest,
  SessionDetail,
  StartSessionRequest,
  UpsertSetRequest,
  WorkoutDetail,
} from './types';

export function createLocalSession(
  workout: WorkoutDetail,
  sessionId: string,
  startedAt: string,
  plannedDate: string,
  createId: () => string = () => crypto.randomUUID(),
): { session: SessionDetail; request: StartSessionRequest } {
  const exercises = workout.exercises.map((entry) => ({
    equipment: entry.exercise.equipment,
    exerciseId: entry.exercise.id,
    exerciseName: entry.exercise.name,
    id: createId(),
    notes: entry.notes ?? null,
    position: entry.position,
    primaryMuscle: entry.exercise.primaryMuscle,
    replacedByExerciseId: null,
    repMax: entry.repMax,
    repMin: entry.repMin,
    restSeconds: entry.restSeconds,
    sets: [],
    status: 'PENDING' as const,
    targetSets: entry.targetSets,
  }));

  return {
    session: {
      id: sessionId,
      templateId: workout.id,
      templateName: workout.name,
      plannedDate,
      startedAt,
      clientStartedAt: startedAt,
      endedAt: null,
      clientEndedAt: null,
      durationMinutes: null,
      notes: null,
      status: 'ACTIVE',
      version: 1,
      workingSets: 0,
      totalVolumeKg: '0.00',
      createdAt: startedAt,
      exercises,
    },
    request: {
      templateId: workout.id,
      plannedDate,
      clientStartedAt: startedAt,
      exercises: exercises.map((exercise) => ({
        id: exercise.id,
        exerciseId: exercise.exerciseId,
        position: exercise.position,
        targetSets: exercise.targetSets,
        repMin: exercise.repMin,
        repMax: exercise.repMax,
        restSeconds: exercise.restSeconds,
        notes: exercise.notes,
        status: exercise.status,
      })),
    },
  };
}

export function applyLocalSet(
  session: SessionDetail,
  setId: string,
  body: UpsertSetRequest,
): SessionDetail {
  const completedAt = body.clientCompletedAt ?? new Date().toISOString();
  return recalculate({
    ...session,
    exercises: session.exercises.map((exercise) =>
      exercise.id !== body.sessionExerciseId
        ? exercise
        : {
            ...exercise,
            sets: [
              ...exercise.sets.filter((set) => set.id !== setId),
              {
                id: setId,
                sessionExerciseId: body.sessionExerciseId,
                setNumber: body.setNumber,
                weightKg: body.weightKg,
                reps: body.reps,
                isWarmup: body.isWarmup ?? false,
                rpe: body.rpe ?? null,
                painLevel: body.painLevel ?? null,
                notes: body.notes ?? null,
                completedAt,
              },
            ].sort((left, right) => left.setNumber - right.setNumber),
          },
    ),
  });
}

export function removeLocalSet(session: SessionDetail, setId: string): SessionDetail {
  return recalculate({
    ...session,
    exercises: session.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.filter((set) => set.id !== setId),
    })),
  });
}

export function replaceLocalExerciseSets(
  session: SessionDetail,
  sessionExerciseId: string,
  body: ReplaceExerciseSetsRequest,
): SessionDetail {
  return recalculate({
    ...session,
    exercises: session.exercises.map((exercise) =>
      exercise.id !== sessionExerciseId
        ? exercise
        : {
            ...exercise,
            status: body.sets.length > 0 ? ('DONE' as const) : exercise.status,
            sets: body.sets.map((set) => ({
              id: set.id,
              sessionExerciseId,
              setNumber: set.setNumber,
              weightKg: set.weightKg,
              reps: set.reps,
              isWarmup: set.isWarmup,
              rpe: null,
              painLevel: null,
              notes: set.notes ?? null,
              completedAt: set.clientCompletedAt ?? new Date().toISOString(),
            })),
          },
    ),
  });
}

export function setLocalExerciseStatus(
  session: SessionDetail,
  sessionExerciseId: string,
  status: 'DONE' | 'SKIPPED',
): SessionDetail {
  return {
    ...session,
    exercises: session.exercises.map((exercise) =>
      exercise.id === sessionExerciseId ? { ...exercise, status } : exercise,
    ),
  };
}

export function finishLocalSession(
  session: SessionDetail,
  action: 'complete' | 'abandon',
  endedAt: string,
  notes: string | null,
): SessionDetail {
  return {
    ...session,
    status: action === 'complete' ? 'COMPLETED' : 'ABANDONED',
    notes,
    endedAt,
    clientEndedAt: endedAt,
    durationMinutes: Math.max(
      0,
      Math.floor((new Date(endedAt).getTime() - new Date(session.startedAt).getTime()) / 60_000),
    ),
  };
}

function recalculate(session: SessionDetail): SessionDetail {
  const workingSets = session.exercises
    .flatMap((exercise) => exercise.sets)
    .filter((set) => !set.isWarmup);
  const total = workingSets.reduce((sum, set) => sum + Number(set.weightKg) * set.reps, 0);
  return { ...session, workingSets: workingSets.length, totalVolumeKg: total.toFixed(2) };
}
