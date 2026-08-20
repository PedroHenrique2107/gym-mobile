import type { WorkoutJamEvent } from './api';

export interface WorkoutJamEventTimeline {
  readonly data: WorkoutJamEvent[];
  readonly lastSequence: string;
}

const EVENT_TIMELINE_LIMIT = 250;

export function mergeWorkoutJamEventPage(
  current: WorkoutJamEventTimeline,
  page: WorkoutJamEventTimeline,
  limit = EVENT_TIMELINE_LIMIT,
): WorkoutJamEventTimeline {
  const byId = new Map(current.data.map((event) => [event.id, event]));
  for (const event of page.data) byId.set(event.id, event);

  const data = [...byId.values()]
    .sort((left, right) => compareSequence(left.sequence, right.sequence))
    .slice(-limit);

  return {
    data,
    lastSequence:
      compareSequence(page.lastSequence, current.lastSequence) >= 0
        ? page.lastSequence
        : current.lastSequence,
  };
}

function compareSequence(left: string, right: string): number {
  const leftValue = BigInt(left);
  const rightValue = BigInt(right);
  return leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
}
