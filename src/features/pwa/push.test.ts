import { describe, expect, it } from 'vitest';

import { decodeVapidPublicKey } from './push';

describe('VAPID public key', () => {
  it('converte base64url sem padding para bytes usados pela Push API', () => {
    // Evita enviar string ou base64 comum e receber um erro pouco explicativo ao inscrever o aparelho.
    expect(Array.from(decodeVapidPublicKey('AQIDBA'))).toEqual([1, 2, 3, 4]);
  });
});
