import Dexie from 'dexie';

import { getOfflineDatabase } from './database';
import type {
  OfflineOperation,
  OfflineQueueStatus,
  OutboxEntry,
  SessionDetail,
  WorkoutDetail,
} from './types';

export async function readActiveSession(ownerId: string): Promise<SessionDetail | null> {
  return (await getOfflineDatabase().activeSessions.get(ownerId))?.data ?? null;
}

export async function writeActiveSession(ownerId: string, data: SessionDetail): Promise<void> {
  await getOfflineDatabase().activeSessions.put({
    ownerId,
    data,
    updatedAt: new Date().toISOString(),
  });
  announceOfflineChange(ownerId);
}

export async function removeActiveSession(ownerId: string): Promise<void> {
  await getOfflineDatabase().activeSessions.delete(ownerId);
  announceOfflineChange(ownerId);
}

export async function writeWorkout(ownerId: string, data: WorkoutDetail): Promise<void> {
  await getOfflineDatabase().workoutSnapshots.put({
    ownerId,
    workoutId: data.id,
    data,
    updatedAt: new Date().toISOString(),
  });
}

export async function readWorkout(
  ownerId: string,
  workoutId: string,
): Promise<WorkoutDetail | null> {
  return (await getOfflineDatabase().workoutSnapshots.get([ownerId, workoutId]))?.data ?? null;
}

export async function listWorkouts(ownerId: string): Promise<WorkoutDetail[]> {
  const records = await getOfflineDatabase()
    .workoutSnapshots.where('ownerId')
    .equals(ownerId)
    .toArray();
  return records.map((record) => record.data).sort((left, right) => left.position - right.position);
}

export async function enqueueOperation(
  ownerId: string,
  id: string,
  operation: OfflineOperation,
): Promise<void> {
  const database = getOfflineDatabase();
  await database.transaction('rw', database.outbox, async () => {
    const previous = await database.outbox.get([ownerId, id]);
    const last = previous
      ? null
      : await database.outbox
          .where('[ownerId+sequence]')
          .between([ownerId, Dexie.minKey], [ownerId, Dexie.maxKey])
          .last();
    const now = new Date().toISOString();
    await database.outbox.put({
      id,
      ownerId,
      operation,
      sequence: previous?.sequence ?? (last?.sequence ?? 0) + 1,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
      attempts: previous?.attempts ?? 0,
      status: 'PENDING',
    });
  });
  announceOfflineChange(ownerId);
}

export async function removeOperation(id: string, ownerId: string): Promise<boolean> {
  const database = getOfflineDatabase();
  const key: [string, string] = [ownerId, id];
  const existed = (await database.outbox.get(key)) !== undefined;
  await database.outbox.delete(key);
  announceOfflineChange(ownerId);
  return existed;
}

export async function listPendingOperations(ownerId: string): Promise<OutboxEntry[]> {
  const entries = await getOfflineDatabase()
    .outbox.where('[ownerId+status]')
    .equals([ownerId, 'PENDING'])
    .toArray();
  return entries.sort((left, right) => left.sequence - right.sequence);
}

export async function readQueueStatus(ownerId: string): Promise<OfflineQueueStatus> {
  const database = getOfflineDatabase();
  const [pending, blocked] = await Promise.all([
    database.outbox.where('[ownerId+status]').equals([ownerId, 'PENDING']).count(),
    database.outbox.where('[ownerId+status]').equals([ownerId, 'BLOCKED']).count(),
  ]);
  return { pending, blocked };
}

export async function markOperationAttempt(
  entry: OutboxEntry,
  status: OutboxEntry['status'],
  errorCode: string,
  nextAttemptAt?: string,
): Promise<void> {
  await getOfflineDatabase().outbox.update([entry.ownerId, entry.id], {
    attempts: entry.attempts + 1,
    updatedAt: new Date().toISOString(),
    status,
    lastErrorCode: errorCode,
    nextAttemptAt,
  });
  announceOfflineChange(entry.ownerId);
}

export async function retryBlockedOperations(ownerId: string): Promise<void> {
  await getOfflineDatabase()
    .outbox.where('[ownerId+status]')
    .equals([ownerId, 'BLOCKED'])
    .modify({ status: 'PENDING', nextAttemptAt: undefined });
  announceOfflineChange(ownerId);
}

export async function discardOfflineChanges(ownerId: string): Promise<void> {
  const database = getOfflineDatabase();
  await database.transaction('rw', [database.activeSessions, database.outbox], async () => {
    await database.activeSessions.delete(ownerId);
    await database.outbox.where('ownerId').equals(ownerId).delete();
  });
  announceOfflineChange(ownerId);
}

export async function clearOfflineUser(ownerId: string): Promise<void> {
  const database = getOfflineDatabase();
  await database.transaction(
    'rw',
    [database.activeSessions, database.workoutSnapshots, database.outbox],
    async () => {
      await database.activeSessions.delete(ownerId);
      await database.workoutSnapshots.where('ownerId').equals(ownerId).delete();
      await database.outbox.where('ownerId').equals(ownerId).delete();
    },
  );
  announceOfflineChange(ownerId);
}

function announceOfflineChange(ownerId: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gymflow:offline-change', { detail: { ownerId } }));
  }
}
