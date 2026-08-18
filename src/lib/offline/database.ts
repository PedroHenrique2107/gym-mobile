import Dexie, { type Table } from 'dexie';

import type { ActiveSessionRecord, OutboxEntry, WorkoutSnapshotRecord } from './types';

class GymflowOfflineDatabase extends Dexie {
  readonly activeSessions!: Table<ActiveSessionRecord, string>;
  readonly workoutSnapshots!: Table<WorkoutSnapshotRecord, [string, string]>;
  readonly outbox!: Table<OutboxEntry, [string, string]>;

  constructor() {
    super('gymflow-offline');
    this.version(1).stores({
      activeSessions: 'ownerId, updatedAt',
      workoutSnapshots: '[ownerId+workoutId], ownerId, updatedAt',
      outbox: '[ownerId+id], id, ownerId, [ownerId+status], [ownerId+sequence], createdAt',
    });
  }
}

let database: GymflowOfflineDatabase | null = null;

export function getOfflineDatabase(): GymflowOfflineDatabase {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB não está disponível neste ambiente.');
  }
  database ??= new GymflowOfflineDatabase();
  return database;
}

export function resetOfflineDatabaseForTests(): void {
  database?.close();
  database = null;
}
