import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearKnownJam, markKnownJam, readKnownJam, subscribeKnownJam } from './known-jam';

describe('marcador local não secreto da Jam', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('é isolado por usuário e removido somente após reconciliação', () => {
    markKnownJam('owner-a', 'jam-a');
    markKnownJam('owner-b', 'jam-b');

    expect(readKnownJam('owner-a')).toBe('jam-a');
    expect(readKnownJam('owner-b')).toBe('jam-b');

    clearKnownJam('owner-a');
    expect(readKnownJam('owner-a')).toBeNull();
    expect(readKnownJam('owner-b')).toBe('jam-b');
    clearKnownJam('owner-b');
  });

  it('sobrevive ao fechamento da sessão da guia sem guardar segredo', () => {
    markKnownJam('owner-a', 'jam-a');
    sessionStorage.clear();

    expect(readKnownJam('owner-a')).toBe('jam-a');
    expect(localStorage.getItem('gymflow:known-jam:owner-a')).toBe('jam-a');
  });

  it('notifica a guia atual e alterações vindas de outra guia', () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeKnownJam(onChange);

    markKnownJam('owner-a', 'jam-a');
    window.dispatchEvent(new StorageEvent('storage', { key: 'gymflow:known-jam:owner-a' }));

    expect(onChange).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});
