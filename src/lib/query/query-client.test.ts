import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api/problem';

import { createQueryClient } from './query-client';

/** Le a funcao de retry configurada, sem depender de uma consulta real. */
function retryFor(error: unknown, failureCount = 0): boolean {
  const options = createQueryClient().getDefaultOptions().queries;
  const retry = options?.retry;

  if (typeof retry !== 'function') {
    throw new Error('retry deveria ser uma funcao');
  }

  return retry(failureCount, error as Error);
}

describe('politica de retry das consultas', () => {
  it('repete falha de rede', () => {
    expect(retryFor(new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'x' }))).toBe(true);
  });

  it('repete 5xx e 429', () => {
    expect(retryFor(new ApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'x' }))).toBe(
      true,
    );
    expect(retryFor(new ApiError({ status: 503, code: 'SERVICE_UNAVAILABLE', message: 'x' }))).toBe(
      true,
    );
    expect(retryFor(new ApiError({ status: 429, code: 'RATE_LIMITED', message: 'x' }))).toBe(true);
  });

  it('nao repete 4xx', () => {
    // Repetir sem corrigir o pedido gasta bateria e cota sem chance de sucesso.
    for (const status of [400, 403, 404, 409, 422]) {
      expect(retryFor(new ApiError({ status, code: 'X', message: 'x' })), `status ${status}`).toBe(
        false,
      );
    }
  });

  it('nao repete 401', () => {
    // Precisa de renovacao de sessao (M2); repetir com o mesmo token expirado
    // nunca funcionaria.
    expect(retryFor(new ApiError({ status: 401, code: 'UNAUTHENTICATED', message: 'x' }))).toBe(
      false,
    );
  });

  it('para depois de tres tentativas', () => {
    const error = new ApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'x' });

    expect(retryFor(error, 2)).toBe(true);
    expect(retryFor(error, 3)).toBe(false);
  });

  it('nao repete erro que nao vem do cliente de API', () => {
    // Provavelmente bug de codigo; repetir esconderia o problema.
    expect(retryFor(new TypeError('x is not a function'))).toBe(false);
  });

  it('nao repete mutacoes automaticamente', () => {
    // Sem Idempotency-Key (M6), repetir um POST poderia duplicar uma serie.
    expect(createQueryClient().getDefaultOptions().mutations?.retry).toBe(false);
  });
});
