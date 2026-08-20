import { describe, expect, it } from 'vitest';

import { shouldBlockInitialJamCheck } from './initial-check';

describe('bloqueio da checagem inicial da Workout Jam', () => {
  it('bloqueia enquanto a consulta online está pendente', () => {
    expect(
      shouldBlockInitialJamCheck({
        online: true,
        knownJamStorageReady: true,
        hasKnownJam: false,
        pending: true,
        error: false,
      }),
    ).toBe(true);
  });

  it('bloqueia offline quando há uma Jam conhecida para reconciliar', () => {
    expect(
      shouldBlockInitialJamCheck({
        online: false,
        knownJamStorageReady: true,
        hasKnownJam: true,
        pending: false,
        error: true,
      }),
    ).toBe(true);
  });

  it('mantém o treino solo disponível offline quando não há Jam conhecida', () => {
    expect(
      shouldBlockInitialJamCheck({
        online: false,
        knownJamStorageReady: true,
        hasKnownJam: false,
        pending: true,
        error: false,
      }),
    ).toBe(false);
  });

  it('aguarda a leitura persistente antes de liberar o treino offline', () => {
    expect(
      shouldBlockInitialJamCheck({
        online: false,
        knownJamStorageReady: false,
        hasKnownJam: false,
        pending: true,
        error: false,
      }),
    ).toBe(true);
  });
});
