import { apiClient } from '@/lib/api/client';
import { ApiError, ErrorCode } from '@/lib/api/problem';
import { requireApiData } from '@/lib/api/result';
import { describeDiagnosticError, logDiagnostic } from '@/lib/diagnostics/logger';

import {
  listPendingOperations,
  markOperationAttempt,
  removeActiveSession,
  removeOperation,
  writeActiveSession,
} from './repository';
import type { OfflineOperation, SessionDetail } from './types';

export interface SyncResult {
  readonly sent: number;
  readonly pending: number;
  readonly blocked: boolean;
  readonly error?: unknown;
}

const runningByOwner = new Map<string, Promise<SyncResult>>();
const retryTimers = new Map<string, number>();
const MAX_RETRY_DELAY_MS = 30_000;

/**
 * Reenvia em ordem usando o token atual fornecido pelo cliente HTTP.
 *
 * A fila nao conhece Supabase nem guarda Authorization. Duas chamadas
 * simultaneas compartilham a mesma Promise para nao disputar a ordem.
 */
export async function syncOutbox(
  ownerId: string,
  options: { readonly force?: boolean } = {},
): Promise<SyncResult> {
  const existing = runningByOwner.get(ownerId);
  if (existing) {
    logDiagnostic('debug', 'offline', 'sync.reused_running_job');
    return existing;
  }
  clearRetryTimer(ownerId);
  const current = run(ownerId, options.force ?? false).finally(() => {
    runningByOwner.delete(ownerId);
  });
  runningByOwner.set(ownerId, current);
  return current;
}

export function cancelOutboxSync(ownerId: string): void {
  clearRetryTimer(ownerId);
}

export function calculateRetryDelay(attempts: number): number {
  return Math.min(1000 * 2 ** Math.max(0, attempts), MAX_RETRY_DELAY_MS);
}

async function run(ownerId: string, force: boolean): Promise<SyncResult> {
  const entries = await listPendingOperations(ownerId);
  let sent = 0;

  logDiagnostic('info', 'offline', 'outbox.started', {
    operations: entries.length,
    force,
    online: typeof navigator === 'undefined' ? undefined : navigator.onLine,
  });

  for (const entry of entries) {
    const retryAt = entry.nextAttemptAt ? new Date(entry.nextAttemptAt).getTime() : 0;
    if (!force && retryAt > Date.now()) {
      scheduleRetry(ownerId, retryAt - Date.now());
      logDiagnostic('debug', 'offline', 'outbox.waiting_retry', {
        operationKind: entry.operation.kind,
        attempts: entry.attempts,
        retryInMs: retryAt - Date.now(),
      });
      return { sent, pending: entries.length - sent, blocked: false };
    }

    try {
      logDiagnostic('debug', 'offline', 'operation.started', {
        operationKind: entry.operation.kind,
        attempts: entry.attempts,
      });
      const session = await execute(entry.operation);
      await removeOperation(entry.id, ownerId);
      if (session?.status === 'ACTIVE') await writeActiveSession(ownerId, session);
      if (session && session.status !== 'ACTIVE') await removeActiveSession(ownerId);
      sent += 1;
      logDiagnostic('info', 'offline', 'operation.sent', {
        operationKind: entry.operation.kind,
        sent,
        remaining: entries.length - sent,
      });
    } catch (error) {
      const retryable = error instanceof ApiError && error.isRetryable;
      const retryDelay = retryable ? calculateRetryDelay(entry.attempts) : undefined;
      await markOperationAttempt(
        entry,
        retryable ? 'PENDING' : 'BLOCKED',
        error instanceof ApiError ? error.code : ErrorCode.NETWORK_ERROR,
        retryDelay === undefined ? undefined : new Date(Date.now() + retryDelay).toISOString(),
      );
      if (retryDelay !== undefined) scheduleRetry(ownerId, retryDelay);
      logDiagnostic(retryable ? 'warn' : 'error', 'offline', 'operation.failed', {
        operationKind: entry.operation.kind,
        attempts: entry.attempts + 1,
        retryable,
        retryInMs: retryDelay,
        errorCode: error instanceof ApiError ? error.code : ErrorCode.NETWORK_ERROR,
        ...describeDiagnosticError(error),
      });
      announceSync(ownerId);
      return { sent, pending: entries.length - sent, blocked: !retryable, error };
    }
  }

  announceSync(ownerId);
  logDiagnostic('info', 'offline', 'outbox.completed', { sent, pending: 0 });
  return { sent, pending: 0, blocked: false };
}

function scheduleRetry(ownerId: string, delayMs: number): void {
  if (typeof window === 'undefined') return;
  clearRetryTimer(ownerId);
  const timer = window.setTimeout(() => {
    retryTimers.delete(ownerId);
    if (navigator.onLine) void syncOutbox(ownerId, { force: true });
  }, delayMs);
  retryTimers.set(ownerId, timer);
  logDiagnostic('debug', 'offline', 'retry.scheduled', { retryInMs: delayMs });
}

function clearRetryTimer(ownerId: string): void {
  const timer = retryTimers.get(ownerId);
  if (timer !== undefined) window.clearTimeout(timer);
  retryTimers.delete(ownerId);
}

async function execute(operation: OfflineOperation): Promise<SessionDetail | null> {
  switch (operation.kind) {
    case 'START_SESSION': {
      const { data, error } = await apiClient.PUT('/api/v1/sessions/{sessionId}', {
        params: { path: { sessionId: operation.sessionId } },
        body: operation.body,
      });
      return requireApiData(data, error, 'sincronizar o inicio do treino');
    }
    case 'UPSERT_SET': {
      const { data, error } = await apiClient.PUT('/api/v1/sessions/{sessionId}/sets/{setId}', {
        params: { path: { sessionId: operation.sessionId, setId: operation.setId } },
        body: operation.body,
      });
      return requireApiData(data, error, 'sincronizar a serie');
    }
    case 'DELETE_SET': {
      const { data, error } = await apiClient.DELETE('/api/v1/sessions/{sessionId}/sets/{setId}', {
        params: { path: { sessionId: operation.sessionId, setId: operation.setId } },
      });
      return requireApiData(data, error, 'sincronizar a exclusao da serie');
    }
    case 'REPLACE_EXERCISE_SETS': {
      const { data, error } = await apiClient.PUT(
        '/api/v1/sessions/{sessionId}/exercises/{sessionExerciseId}/sets',
        {
          params: {
            path: {
              sessionId: operation.sessionId,
              sessionExerciseId: operation.sessionExerciseId,
            },
          },
          body: operation.body,
        },
      );
      return requireApiData(data, error, 'sincronizar as series do exercicio');
    }
    case 'SET_EXERCISE_STATUS': {
      const { data, error } = await apiClient.PUT(
        '/api/v1/sessions/{sessionId}/exercises/{sessionExerciseId}',
        {
          params: {
            path: {
              sessionId: operation.sessionId,
              sessionExerciseId: operation.sessionExerciseId,
            },
          },
          body: operation.body,
        },
      );
      return requireApiData(data, error, 'sincronizar o exercicio');
    }
    case 'FINISH_SESSION': {
      const path =
        operation.action === 'complete'
          ? '/api/v1/sessions/{sessionId}/complete'
          : '/api/v1/sessions/{sessionId}/abandon';
      const { data, error } = await apiClient.POST(path, {
        params: {
          path: { sessionId: operation.sessionId },
          header: { 'Idempotency-Key': operation.idempotencyKey },
        },
        body: operation.body,
      });
      return requireApiData(data, error, 'sincronizar o encerramento do treino');
    }
    default: {
      const exhaustive: never = operation;
      throw new Error(`Operacao offline desconhecida: ${String(exhaustive)}`);
    }
  }
}

function announceSync(ownerId: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gymflow:sync-complete', { detail: { ownerId } }));
  }
}
