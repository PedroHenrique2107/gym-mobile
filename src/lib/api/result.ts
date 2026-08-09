import { ApiError } from './problem';

/** Garante que uma resposta 2xx tipada trouxe o corpo prometido pelo contrato. */
export function requireApiData<T>(data: T | undefined, error: unknown, operation: string): T {
  if (data !== undefined) return data;
  if (error instanceof ApiError) throw error;
  if (error instanceof Error) throw error;
  throw new Error(`Resposta inesperada ao ${operation}.`);
}

/** Valida mutacoes 2xx sem corpo, como DELETE 204. */
export function requireApiSuccess(error: unknown, operation: string): void {
  if (error === undefined) return;
  if (error instanceof Error) throw error;
  throw new Error(`Resposta inesperada ao ${operation}.`);
}

export function describeApiError(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;

  if (error.code === 'RESOURCE_VERSION_CONFLICT') {
    return 'Este item mudou em outro dispositivo. Os dados foram atualizados; revise e tente novamente.';
  }

  const firstFieldMessage = Object.values(error.fieldErrors ?? {}).flat()[0];
  return firstFieldMessage ?? error.message;
}
