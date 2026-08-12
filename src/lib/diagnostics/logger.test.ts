import { afterEach, describe, expect, it, vi } from 'vitest';

import { describeDiagnosticError, describeRequestUrl, logDiagnostic } from './logger';

describe('diagnostic logger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('remove valores sensiveis antes de registrar', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    logDiagnostic('error', 'api', 'request.failed', {
      requestId: 'request-1',
      authorization: 'Bearer secret-value',
      email: 'pessoa@example.com',
    });

    expect(error).toHaveBeenCalledWith('[gymflow:api] request.failed', {
      requestId: 'request-1',
      authorization: '[redacted]',
      email: '[redacted]',
    });
  });

  it('descreve URL sem query, hash ou UUID', () => {
    expect(
      describeRequestUrl(
        'https://api.example.com/api/v1/sessions/3f1c6b1e-9c1e-4a55-9b1f-1c2d3e4f5a6b?token=secret#private',
      ),
    ).toEqual({
      requestOrigin: 'https://api.example.com',
      requestPath: '/api/v1/sessions/:uuid',
    });
  });

  it('descreve erro sem expor a mensagem', () => {
    expect(
      describeDiagnosticError({
        name: 'TypeError',
        message: 'request to host with password failed',
        cause: { name: 'ConnectError', code: 'ETIMEDOUT' },
      }),
    ).toEqual({
      errorName: 'TypeError',
      errorCode: 'ETIMEDOUT',
      errorStatus: undefined,
      causeName: 'ConnectError',
    });
  });
});
