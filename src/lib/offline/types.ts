import type { components } from '@/lib/api/generated/types';

export type SessionDetail = components['schemas']['SessionDetailResponse'];
export type WorkoutDetail = components['schemas']['WorkoutDetailResponse'];
export type StartSessionRequest = components['schemas']['StartSessionRequest'];
export type UpsertSessionExerciseRequest = components['schemas']['UpsertSessionExerciseRequest'];
export type UpsertSetRequest = components['schemas']['UpsertSetRequest'];
export type FinishSessionRequest = components['schemas']['FinishSessionRequest'];

export type OfflineOperation =
  | {
      readonly kind: 'START_SESSION';
      readonly sessionId: string;
      readonly body: StartSessionRequest;
    }
  | {
      readonly kind: 'UPSERT_SET';
      readonly sessionId: string;
      readonly setId: string;
      readonly body: UpsertSetRequest;
    }
  | {
      readonly kind: 'DELETE_SET';
      readonly sessionId: string;
      readonly setId: string;
    }
  | {
      readonly kind: 'SET_EXERCISE_STATUS';
      readonly sessionId: string;
      readonly sessionExerciseId: string;
      readonly body: UpsertSessionExerciseRequest;
    }
  | {
      readonly kind: 'FINISH_SESSION';
      readonly sessionId: string;
      readonly action: 'complete' | 'abandon';
      readonly idempotencyKey: string;
      readonly body: FinishSessionRequest;
    };

export interface OutboxEntry {
  readonly id: string;
  readonly ownerId: string;
  readonly operation: OfflineOperation;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly sequence: number;
  readonly attempts: number;
  readonly status: 'PENDING' | 'BLOCKED';
  readonly lastErrorCode?: string;
  readonly nextAttemptAt?: string;
}

export interface OfflineQueueStatus {
  readonly pending: number;
  readonly blocked: number;
}

export interface ActiveSessionRecord {
  readonly ownerId: string;
  readonly data: SessionDetail;
  readonly updatedAt: string;
}

export interface WorkoutSnapshotRecord {
  readonly ownerId: string;
  readonly workoutId: string;
  readonly data: WorkoutDetail;
  readonly updatedAt: string;
}
