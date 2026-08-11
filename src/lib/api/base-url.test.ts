import { describe, expect, it } from 'vitest';

import { resolveApiBaseUrl } from './base-url';

describe('resolveApiBaseUrl', () => {
  it('usa o IP do navegador para o backend local aberto no celular', () => {
    expect(
      resolveApiBaseUrl('http://localhost:3001', 'development', {
        hostname: '192.168.1.20',
      } as Location),
    ).toBe('http://192.168.1.20:3001');
  });

  it('não altera preview, produção ou uma API remota', () => {
    expect(
      resolveApiBaseUrl('http://localhost:3001', 'production', {
        hostname: '192.168.1.20',
      } as Location),
    ).toBe('http://localhost:3001');
    expect(
      resolveApiBaseUrl('https://api.example.com', 'development', {
        hostname: '192.168.1.20',
      } as Location),
    ).toBe('https://api.example.com');
  });
});
