import 'fake-indexeddb/auto';

import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resetOfflineDatabaseForTests } from './database';
import {
  clearOfflineUser,
  enqueueOperation,
  listPendingOperations,
  markOperationAttempt,
  readQueueStatus,
  retryBlockedOperations,
} from './repository';

const OWNER_A = '10000000-0000-4000-8000-000000000001';
const OWNER_B = '10000000-0000-4000-8000-000000000002';

beforeEach(async () => {
  resetOfflineDatabaseForTests();
  await Dexie.delete('gymflow-offline');
});

afterEach(async () => {
  resetOfflineDatabaseForTests();
  await Dexie.delete('gymflow-offline');
});

describe('offline repository', () => {
  it('isola IDs iguais entre usuarios e deduplica dentro do mesmo usuario', async () => {
    // Evita que duas contas usadas no mesmo aparelho sobrescrevam ou apaguem a fila uma da outra.
    await enqueueOperation(OWNER_A, 'set:shared', {
      kind: 'DELETE_SET',
      sessionId: '20000000-0000-4000-8000-000000000001',
      setId: '30000000-0000-4000-8000-000000000001',
    });
    await enqueueOperation(OWNER_B, 'set:shared', {
      kind: 'DELETE_SET',
      sessionId: '20000000-0000-4000-8000-000000000002',
      setId: '30000000-0000-4000-8000-000000000002',
    });
    await enqueueOperation(OWNER_A, 'set:shared', {
      kind: 'DELETE_SET',
      sessionId: '20000000-0000-4000-8000-000000000001',
      setId: '30000000-0000-4000-8000-000000000009',
    });

    const ownerA = await listPendingOperations(OWNER_A);
    const ownerB = await listPendingOperations(OWNER_B);
    expect(ownerA).toHaveLength(1);
    expect(ownerA[0]?.operation).toMatchObject({ setId: '30000000-0000-4000-8000-000000000009' });
    expect(ownerB).toHaveLength(1);
  });

  it('preserva a ordem de insercao mesmo quando os timestamps empatam', async () => {
    // Evita enviar o encerramento antes do inicio quando varias operacoes nascem no mesmo milissegundo.
    await enqueueOperation(OWNER_A, 'start:last-alphabetically', {
      kind: 'START_SESSION',
      sessionId: '20000000-0000-4000-8000-000000000001',
      body: { templateId: '30000000-0000-4000-8000-000000000001', exercises: [] },
    });
    await enqueueOperation(OWNER_A, 'finish:first-alphabetically', {
      kind: 'FINISH_SESSION',
      sessionId: '20000000-0000-4000-8000-000000000001',
      action: 'complete',
      idempotencyKey: '40000000-0000-4000-8000-000000000001',
      body: {},
    });

    expect((await listPendingOperations(OWNER_A)).map((entry) => entry.operation.kind)).toEqual([
      'START_SESSION',
      'FINISH_SESSION',
    ]);
  });

  it('guarda somente a mutacao sem credenciais de autenticacao', async () => {
    // Evita que JWT, refresh token ou Authorization sobrevivam no armazenamento do navegador.
    await enqueueOperation(OWNER_A, 'finish:one', {
      kind: 'FINISH_SESSION',
      sessionId: '20000000-0000-4000-8000-000000000001',
      action: 'complete',
      idempotencyKey: '40000000-0000-4000-8000-000000000001',
      body: { clientEndedAt: '2026-08-09T13:00:00.000Z', notes: null },
    });

    const serialized = JSON.stringify(await listPendingOperations(OWNER_A)).toLowerCase();
    expect(serialized).not.toContain('authorization');
    expect(serialized).not.toContain('access_token');
    expect(serialized).not.toContain('refresh_token');
    expect(serialized).not.toContain('bearer');
  });

  it('explicita bloqueio, permite nova tentativa e limpa apenas o usuario solicitado', async () => {
    // Evita retry infinito de 4xx e impede que o logout de uma conta apague dados de outra.
    await enqueueOperation(OWNER_A, 'start:a', {
      kind: 'START_SESSION',
      sessionId: '20000000-0000-4000-8000-000000000001',
      body: {
        templateId: '30000000-0000-4000-8000-000000000001',
        plannedDate: '2026-08-09',
        exercises: [],
      },
    });
    await enqueueOperation(OWNER_B, 'start:b', {
      kind: 'START_SESSION',
      sessionId: '20000000-0000-4000-8000-000000000002',
      body: {
        templateId: '30000000-0000-4000-8000-000000000002',
        plannedDate: '2026-08-09',
        exercises: [],
      },
    });
    const entry = (await listPendingOperations(OWNER_A))[0]!;
    await markOperationAttempt(entry, 'BLOCKED', 'CONFLICT');

    expect(await readQueueStatus(OWNER_A)).toEqual({ pending: 0, blocked: 1 });
    await retryBlockedOperations(OWNER_A);
    expect(await readQueueStatus(OWNER_A)).toEqual({ pending: 1, blocked: 0 });

    await clearOfflineUser(OWNER_A);
    expect(await readQueueStatus(OWNER_A)).toEqual({ pending: 0, blocked: 0 });
    expect(await readQueueStatus(OWNER_B)).toEqual({ pending: 1, blocked: 0 });
  });
});
