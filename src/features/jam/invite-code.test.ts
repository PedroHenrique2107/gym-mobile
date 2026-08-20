import { describe, expect, it } from 'vitest';

import {
  buildInvitePath,
  clearHostInvite,
  normalizeInviteCode,
  participantInitials,
  readHostInvite,
  readInviteCodeFromHash,
  storeHostInvite,
} from './invite-code';

const CODE = 'abcDEF_1234567890';

describe('convite da Workout Jam', () => {
  it('lê apenas código válido do fragmento', () => {
    expect(readInviteCodeFromHash(`#codigo=${CODE}`)).toBe(CODE);
    expect(readInviteCodeFromHash('#codigo=curto')).toBeNull();
    expect(readInviteCodeFromHash('#outro=segredo')).toBeNull();
  });

  it('mantem o segredo fora da query string', () => {
    const path = buildInvitePath(CODE);
    expect(path).toBe(`/jam/entrar#codigo=${CODE}`);
    expect(path).not.toContain('?');
  });

  it('normaliza entrada manual sem alterar maiusculas', () => {
    expect(normalizeInviteCode(`  ${CODE}  `)).toBe(CODE);
    expect(normalizeInviteCode('codigo com espaco')).toBeNull();
  });

  it('gera iniciais textuais para identificar participantes', () => {
    expect(participantInitials('Ana Maria Souza')).toBe('AS');
    expect(participantInitials('pedro')).toBe('P');
    expect(participantInitials(null)).toBe('?');
  });

  it('mantém o convite do anfitrião somente na sessão da guia e ligado à Jam', () => {
    storeHostInvite({
      jamId: 'jam-a',
      inviteCode: CODE,
      expiresAt: '2026-08-19T12:10:00.000Z',
    });

    expect(
      readHostInvite('jam-a', new Date('2026-08-19T12:00:00.000Z').getTime())?.inviteCode,
    ).toBe(CODE);
    expect(readHostInvite('jam-b', new Date('2026-08-19T12:00:00.000Z').getTime())).toBeNull();
    expect(readHostInvite('jam-a', new Date('2026-08-19T12:11:00.000Z').getTime())).toBeNull();
    clearHostInvite();
  });
});
