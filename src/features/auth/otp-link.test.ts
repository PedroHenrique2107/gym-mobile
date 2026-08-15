import { describe, expect, it, vi } from 'vitest';

import { readOtpLink, verifyOtpOnce } from './otp-link';

describe('readOtpLink', () => {
  it('le o token e o tipo enviados pelo template de e-mail', () => {
    expect(readOtpLink('?token_hash=abc123&type=invite', 'convite')).toEqual({
      tokenHash: 'abc123',
      type: 'invite',
    });
  });

  it('nao encontra token quando a pessoa abre a pagina direto', () => {
    expect(readOtpLink('', 'convite')).toBeNull();
    expect(readOtpLink('?type=invite', 'recuperacao')).toBeNull();
  });

  it('usa o tipo da tela quando o link nao traz um tipo utilizavel', () => {
    expect(readOtpLink('?token_hash=abc', 'convite')?.type).toBe('invite');
    expect(readOtpLink('?token_hash=abc', 'recuperacao')?.type).toBe('recovery');
    expect(readOtpLink('?token_hash=abc&type=inventado', 'convite')?.type).toBe('invite');
  });

  it('aceita recuperacao chegando na tela de convite', () => {
    // É o caminho do reenvio para quem já confirmou o e-mail: o convite não pode
    // mais ser reenviado, então sai um link de definição de senha — que termina
    // na tela de convite, porque a conta ainda está sendo criada.
    expect(readOtpLink('?token_hash=abc&type=recovery', 'convite')?.type).toBe('recovery');
  });
});

describe('verifyOtpOnce', () => {
  it('troca o token uma unica vez, mesmo com o efeito repetido', async () => {
    const verify = vi.fn().mockResolvedValue(true);
    const link = { tokenHash: 'token-unico', type: 'invite' } as const;

    const [first, second] = await Promise.all([
      verifyOtpOnce(link, verify),
      verifyOtpOnce(link, verify),
    ]);

    expect(verify).toHaveBeenCalledTimes(1);
    expect(first).toBe(true);
    expect(second).toBe(true);
  });

  it('preserva a falha do token ja consumido em vez de tentar de novo', async () => {
    const verify = vi.fn().mockResolvedValue(false);
    const link = { tokenHash: 'token-gasto', type: 'invite' } as const;

    expect(await verifyOtpOnce(link, verify)).toBe(false);
    expect(await verifyOtpOnce(link, verify)).toBe(false);
    expect(verify).toHaveBeenCalledTimes(1);
  });

  it('verifica um token diferente', async () => {
    const verify = vi.fn().mockResolvedValue(true);

    await verifyOtpOnce({ tokenHash: 'token-a', type: 'invite' }, verify);
    await verifyOtpOnce({ tokenHash: 'token-b', type: 'recovery' }, verify);

    expect(verify).toHaveBeenCalledTimes(2);
  });
});
