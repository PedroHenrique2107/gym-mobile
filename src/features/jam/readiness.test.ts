import { describe, expect, it } from 'vitest';

import { describeJamBlock } from './readiness';

describe('describeJamBlock', () => {
  it('prioriza offline e fila local antes do canal', () => {
    expect(describeJamBlock({ online: false, pending: 0, blocked: 0 }, true)).toContain(
      'somente com internet',
    );
    expect(describeJamBlock({ online: true, pending: 0, blocked: 1 }, true)).toContain(
      'bloqueadas',
    );
    expect(describeJamBlock({ online: true, pending: 2, blocked: 0 }, true)).toContain(
      'sincronização',
    );
  });

  it('exige canal apenas para operacoes de uma Jam ativa', () => {
    const readiness = { online: true, pending: 0, blocked: 0, channelConnected: false };
    expect(describeJamBlock(readiness)).toBeNull();
    expect(describeJamBlock(readiness, true)).toContain('Reconectando');
    expect(describeJamBlock({ ...readiness, channelConnected: true }, true)).toBeNull();
  });
});
