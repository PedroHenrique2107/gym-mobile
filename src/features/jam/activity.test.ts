import { describe, expect, it } from 'vitest';

import type { WorkoutJamEvent, WorkoutJamParticipant } from './api';
import { describeWorkoutJamEvent } from './activity';

const participants = [
  { profileId: 'admin-id', name: 'Ana Admin' },
  { profileId: 'member-id', name: 'Bruno Membro' },
] as WorkoutJamParticipant[];

function event(input: Partial<WorkoutJamEvent>): WorkoutJamEvent {
  return {
    id: 'event-id',
    sequence: '1',
    jamId: 'jam-id',
    type: 'SET_UPSERTED',
    actorId: 'member-id',
    subjectId: 'admin-id',
    sessionId: 'session-id',
    payload: {},
    occurredAt: '2026-08-19T12:00:00.000Z',
    ...input,
  };
}

describe('atividade da Workout Jam', () => {
  it('deixa claro quando uma pessoa registra para a outra', () => {
    expect(describeWorkoutJamEvent(event({}), participants)).toBe(
      'Bruno Membro registrou uma série para Ana Admin.',
    );
  });

  it('diferencia registro no próprio treino', () => {
    expect(
      describeWorkoutJamEvent(event({ actorId: 'admin-id', subjectId: 'admin-id' }), participants),
    ).toBe('Ana Admin registrou uma série no próprio treino.');
  });
});
