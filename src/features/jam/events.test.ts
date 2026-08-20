import { describe, expect, it } from 'vitest';

import type { WorkoutJamEvent } from './api';
import { mergeWorkoutJamEventPage } from './events';

function event(sequence: number): WorkoutJamEvent {
  return {
    id: `event-${sequence}`,
    sequence: String(sequence),
    jamId: 'jam-id',
    type: 'SET_UPSERTED',
    actorId: 'actor-id',
    subjectId: 'owner-id',
    sessionId: 'session-id',
    payload: {},
    occurredAt: '2026-08-19T12:00:00.000Z',
  };
}

describe('linha do tempo de eventos da Jam', () => {
  it('avança o cursor além da primeira página de 100 eventos', () => {
    const first = {
      data: Array.from({ length: 100 }, (_, index) => event(index + 1)),
      lastSequence: '100',
    };
    const second = {
      data: Array.from({ length: 40 }, (_, index) => event(index + 101)),
      lastSequence: '140',
    };

    const result = mergeWorkoutJamEventPage(
      mergeWorkoutJamEventPage({ data: [], lastSequence: '0' }, first),
      second,
    );

    expect(result.data).toHaveLength(140);
    expect(result.data.at(-1)?.sequence).toBe('140');
    expect(result.lastSequence).toBe('140');
  });

  it('deduplica reentregas e limita o histórico local sem regredir o cursor', () => {
    const current = {
      data: Array.from({ length: 200 }, (_, index) => event(index + 1)),
      lastSequence: '200',
    };
    const page = { data: [event(200), event(201)], lastSequence: '201' };
    const result = mergeWorkoutJamEventPage(current, page, 100);

    expect(result.data).toHaveLength(100);
    expect(result.data[0]?.sequence).toBe('102');
    expect(result.data.at(-1)?.sequence).toBe('201');
    expect(result.lastSequence).toBe('201');
  });
});
