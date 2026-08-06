import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchApiHealth, fetchApiReadiness } from './health';
import { ApiError, ErrorCode } from './problem';

function mockFetch(response: Response | Error) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(() =>
      response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
    );
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** `fetch` aceita string, URL ou Request; so a primeira forma e usada aqui. */
function requestedUrl(input: RequestInfo | URL | undefined): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  if (input instanceof Request) return input.url;
  return '';
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchApiHealth', () => {
  it('le a resposta de liveness', async () => {
    mockFetch(json({ status: 'ok', version: '1.2.3', uptimeSeconds: 42 }));

    await expect(fetchApiHealth()).resolves.toEqual({
      status: 'ok',
      version: '1.2.3',
      uptimeSeconds: 42,
    });
  });

  it('consulta /health fora do prefixo /api/v1', async () => {
    // Health e contrato de plataforma; nao deve migrar com /api/v2.
    const spy = mockFetch(json({ status: 'ok', version: '0', uptimeSeconds: 0 }));

    await fetchApiHealth();

    const url = requestedUrl(spy.mock.calls[0]?.[0]);
    expect(url).toMatch(/\/health$/);
    expect(url).not.toContain('/api/v1');
  });

  it('vira erro de rede quando o fetch falha', async () => {
    mockFetch(new TypeError('Failed to fetch'));

    await expect(fetchApiHealth()).rejects.toMatchObject({
      status: 0,
      code: ErrorCode.NETWORK_ERROR,
    });
  });
});

describe('fetchApiReadiness', () => {
  it('le o estado de cada dependencia', async () => {
    mockFetch(
      json({
        status: 'degraded',
        checks: [
          { name: 'database', status: 'unconfigured', detail: 'DATABASE_URL nao configurada.' },
          { name: 'supabase-auth', status: 'up' },
        ],
      }),
    );

    const result = await fetchApiReadiness();

    expect(result.status).toBe('degraded');
    expect(result.checks).toHaveLength(2);
    expect(result.checks[0]?.name).toBe('database');
  });

  it('preserva o corpo de um 503', async () => {
    // O 503 de readiness carrega justamente a informacao util: qual
    // dependencia caiu. Tratar como excecao descartaria o diagnostico.
    mockFetch(json({ status: 'not_ready', checks: [{ name: 'database', status: 'down' }] }, 503));

    const result = await fetchApiReadiness();

    expect(result.status).toBe('not_ready');
    expect(result.checks[0]?.status).toBe('down');
  });

  it('lanca quando o corpo nao tem a forma esperada', async () => {
    mockFetch(json({ mensagem: 'algo diferente' }, 503));

    await expect(fetchApiReadiness()).rejects.toBeInstanceOf(ApiError);
  });

  it('lanca em status inesperado', async () => {
    mockFetch(json({ status: 502 }, 502));

    await expect(fetchApiReadiness()).rejects.toBeInstanceOf(ApiError);
  });

  it('nao envia cookies', async () => {
    // A API autentica por Bearer; cookies pertencem a origem do Next.js.
    const spy = mockFetch(json({ status: 'ready', checks: [] }));

    await fetchApiReadiness();

    expect(spy.mock.calls[0]?.[1]).toMatchObject({ credentials: 'omit' });
  });
});
