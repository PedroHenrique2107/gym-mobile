import { describe, expect, it } from 'vitest';

import { ApiError, ErrorCode, messageForStatus, toApiError, toNetworkError } from './problem';

function problemResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/problem+json', 'x-request-id': 'req-123' },
  });
}

const VALIDATION_PROBLEM = {
  type: '/problems/validation-error',
  title: 'Dados invalidos',
  status: 422,
  detail: 'Revise os campos informados.',
  instance: '/api/v1/workouts',
  code: 'VALIDATION_ERROR',
  requestId: '3f1c6b1e-9c1e-4a55-9b1f-1c2d3e4f5a6b',
  errors: { name: ['Informe um nome valido.'] },
};

describe('toApiError', () => {
  it('le o corpo problem+json do backend', async () => {
    const error = await toApiError(problemResponse(VALIDATION_PROBLEM, 422));

    expect(error.status).toBe(422);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Revise os campos informados.');
    expect(error.requestId).toBe(VALIDATION_PROBLEM.requestId);
    expect(error.fieldErrors).toEqual({ name: ['Informe um nome valido.'] });
    expect(error.isValidationError).toBe(true);
  });

  it('expoe a versao atual em conflito de concorrencia', async () => {
    // A interface precisa dela para recarregar e reaplicar a edicao do usuario.
    const error = await toApiError(
      problemResponse(
        {
          ...VALIDATION_PROBLEM,
          status: 409,
          code: 'RESOURCE_VERSION_CONFLICT',
          errors: null,
          currentVersion: 7,
        },
        409,
      ),
    );

    expect(error.isConflict).toBe(true);
    expect(error.currentVersion).toBe(7);
  });

  it('usa mensagem local quando o backend nao envia detail', async () => {
    const error = await toApiError(
      problemResponse(
        { ...VALIDATION_PROBLEM, detail: undefined, status: 500, code: 'INTERNAL_ERROR' },
        500,
      ),
    );

    expect(error.message).toBe(messageForStatus(500));
  });

  it('nao lanca quando a resposta nao e JSON', async () => {
    // Um proxy ou o Service Worker podem devolver HTML no lugar do JSON; o
    // usuario ainda precisa de uma mensagem util, nao de um SyntaxError.
    const response = new Response('<html>502 Bad Gateway</html>', {
      status: 502,
      headers: { 'content-type': 'text/html' },
    });

    const error = await toApiError(response);

    expect(error.status).toBe(502);
    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(error.message).not.toContain('html');
  });

  it('nao lanca quando o JSON esta truncado', async () => {
    const response = new Response('{"code": "X"', {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });

    await expect(toApiError(response)).resolves.toBeInstanceOf(ApiError);
  });

  it('recupera o requestId do header quando nao ha corpo valido', async () => {
    const response = new Response('', {
      status: 500,
      headers: { 'content-type': 'text/plain', 'x-request-id': 'req-123' },
    });

    const error = await toApiError(response);
    expect(error.requestId).toBe('req-123');
  });

  it('infere o codigo a partir do status quando o corpo nao ajuda', async () => {
    const cases: [number, string][] = [
      [401, ErrorCode.UNAUTHENTICATED],
      [403, ErrorCode.FORBIDDEN],
      [404, ErrorCode.NOT_FOUND],
      [409, ErrorCode.CONFLICT],
      [422, ErrorCode.VALIDATION_ERROR],
      [429, ErrorCode.RATE_LIMITED],
      [503, ErrorCode.SERVICE_UNAVAILABLE],
    ];

    for (const [status, expected] of cases) {
      const response = new Response('', { status, headers: { 'content-type': 'text/plain' } });
      await expect(toApiError(response).then((error) => error.code)).resolves.toBe(expected);
    }
  });
});

describe('classificacao de erros', () => {
  it('separa 401 de 403', async () => {
    // O plano determina que 403 nao dispare logout: deslogar alguem por tentar
    // uma acao sem permissao perderia o treino em andamento.
    const unauthenticated = await toApiError(
      problemResponse({ ...VALIDATION_PROBLEM, status: 401, code: 'UNAUTHENTICATED' }, 401),
    );
    const forbidden = await toApiError(
      problemResponse({ ...VALIDATION_PROBLEM, status: 403, code: 'FORBIDDEN' }, 403),
    );

    expect(unauthenticated.isAuthError).toBe(true);
    expect(unauthenticated.isPermissionError).toBe(false);

    expect(forbidden.isAuthError).toBe(false);
    expect(forbidden.isPermissionError).toBe(true);
  });

  it('considera repetivel apenas o que e transitorio', () => {
    const retryable = [0, 500, 502, 503, 429];
    const notRetryable = [400, 401, 403, 404, 409, 422];

    for (const status of retryable) {
      const error = new ApiError({ status, code: 'X', message: 'x' });
      expect(error.isRetryable, `status ${status} deveria ser repetivel`).toBe(true);
    }

    for (const status of notRetryable) {
      const error = new ApiError({ status, code: 'X', message: 'x' });
      expect(error.isRetryable, `status ${status} nao deveria ser repetivel`).toBe(false);
    }
  });

  it('repete idempotencia em andamento sem tratar todo 409 como transitorio', () => {
    // Evita bloquear a outbox quando a primeira chamada ainda esta terminando,
    // sem criar loop para conflitos que exigem decisao do usuario.
    expect(
      new ApiError({
        status: 409,
        code: ErrorCode.IDEMPOTENCY_IN_PROGRESS,
        message: 'em andamento',
      }).isRetryable,
    ).toBe(true);
    expect(new ApiError({ status: 409, code: ErrorCode.CONFLICT, message: 'conflito' }).isRetryable).toBe(
      false,
    );
  });
});

describe('toNetworkError', () => {
  it('nao expoe a mensagem do navegador', () => {
    // Mensagens de rede citam host e porta; a interface nao deve exibir isso.
    const error = toNetworkError(new Error('fetch failed: connect ECONNREFUSED 127.0.0.1:3001'));

    expect(error.status).toBe(0);
    expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
    expect(error.message).not.toContain('127.0.0.1');
    expect(error.message).not.toContain('ECONNREFUSED');
    expect(error.isRetryable).toBe(true);
  });

  it('preserva a causa para diagnostico', () => {
    const cause = new Error('falha original');
    expect(toNetworkError(cause).cause).toBe(cause);
  });
});
