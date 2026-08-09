import { describe, expect, it } from 'vitest';

import { calculateRetryDelay } from './sync';

describe('offline retry policy', () => {
  it('aplica backoff exponencial com limite para preservar rede e bateria', () => {
    // Evita uma tempestade de requisicoes quando a API permanece temporariamente indisponivel.
    expect([0, 1, 2, 3].map(calculateRetryDelay)).toEqual([1000, 2000, 4000, 8000]);
    expect(calculateRetryDelay(20)).toBe(30_000);
  });
});
