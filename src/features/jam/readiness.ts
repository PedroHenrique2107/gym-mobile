import { readQueueStatus } from '@/lib/offline/repository';
import { syncOutbox } from '@/lib/offline/sync';

export interface JamReadiness {
  readonly online: boolean;
  readonly pending: number;
  readonly blocked: number;
  readonly channelConnected?: boolean;
}

export function describeJamBlock(readiness: JamReadiness, requireChannel = false): string | null {
  if (!readiness.online) return 'A Jam funciona somente com internet.';
  if (readiness.blocked > 0) {
    return 'Resolva as alterações offline bloqueadas antes de usar a Jam.';
  }
  if (readiness.pending > 0) {
    return 'Aguarde a sincronização das alterações offline antes de usar a Jam.';
  }
  if (requireChannel && !readiness.channelConnected) {
    return 'Reconectando ao treino em tempo real. Aguarde para registrar séries.';
  }
  return null;
}

/**
 * Jam nunca escreve na outbox. Antes de entrar, esgota a fila existente e
 * recusa o fluxo se algo ainda estiver pendente ou bloqueado.
 */
export async function prepareForWorkoutJam(ownerId: string): Promise<void> {
  if (!navigator.onLine) throw new Error('A Jam funciona somente com internet.');

  const result = await syncOutbox(ownerId, { force: true });
  const queue = await readQueueStatus(ownerId);
  const reason = describeJamBlock({
    online: navigator.onLine,
    pending: Math.max(result.pending, queue.pending),
    blocked: result.blocked ? Math.max(1, queue.blocked) : queue.blocked,
  });

  if (reason) throw result.error instanceof Error ? result.error : new Error(reason);
}
