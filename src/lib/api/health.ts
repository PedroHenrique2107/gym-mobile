import { describeDiagnosticError, logDiagnostic } from '@/lib/diagnostics/logger';

import { resolveApiBaseUrl } from './base-url';
import { toApiError, toNetworkError } from './problem';

/**
 * Consulta os endpoints de infraestrutura do `gym-service`.
 *
 * Nao usa `apiClient` de proposito: `/health` e `/ready` ficam **fora** de
 * `/api/v1` — sao contrato de plataforma, nao de negocio, e nao devem migrar
 * quando surgir uma `/api/v2`. Tambem nao exigem token.
 */

export interface ApiHealth {
  readonly status: 'ok';
  readonly version: string;
  readonly uptimeSeconds: number;
}

export interface ApiReadinessCheck {
  readonly name: string;
  readonly status: 'up' | 'down' | 'unconfigured';
  readonly detail?: string;
}

export interface ApiReadiness {
  readonly status: 'ready' | 'degraded' | 'not_ready';
  readonly checks: readonly ApiReadinessCheck[];
}

/** Um healthcheck que demora mais que isso e indistinguivel de indisponivel. */
const HEALTH_TIMEOUT_MS = 5_000;

export async function fetchApiHealth(): Promise<ApiHealth> {
  const response = await requestInfra('/health');

  if (!response.ok) {
    throw await toApiError(response);
  }

  return (await response.json()) as ApiHealth;
}

/**
 * Le o readiness da API.
 *
 * `503` e uma resposta esperada aqui, nao um erro: o corpo diz **qual**
 * dependencia falhou, e essa e justamente a informacao util. Trata-lo como
 * excecao descartaria o diagnostico — e o corpo nao e Problem Details, entao
 * ele nao sobreviveria a conversao em `ApiError`.
 */
export async function fetchApiReadiness(): Promise<ApiReadiness> {
  const response = await requestInfra('/ready');

  if (!response.ok && response.status !== 503) {
    throw await toApiError(response);
  }

  const body: unknown = await response.json().catch(() => null);

  if (!isReadiness(body)) {
    throw await toApiError(response);
  }

  logDiagnostic(body.status === 'not_ready' ? 'warn' : 'info', 'infra', 'readiness.result', {
    status: body.status,
    checks: body.checks.map((check) => `${check.name}:${check.status}`).join(','),
    requestId: response.headers.get('x-request-id'),
  });

  return body;
}

async function requestInfra(path: string): Promise<Response> {
  const apiUrl = resolveApiBaseUrl();
  const startedAt = Date.now();
  logDiagnostic('info', 'infra', 'request.started', {
    method: 'GET',
    requestOrigin: apiUrl,
    requestPath: path,
    online: typeof navigator === 'undefined' ? undefined : navigator.onLine,
  });

  try {
    const response = await fetch(`${apiUrl}${path}`, {
      method: 'GET',
      headers: { accept: 'application/json' },
      credentials: 'omit',
      cache: 'no-store',
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });

    logDiagnostic(response.ok ? 'info' : 'warn', 'infra', 'request.finished', {
      method: 'GET',
      requestOrigin: apiUrl,
      requestPath: path,
      status: response.status,
      durationMs: Date.now() - startedAt,
      requestId: response.headers.get('x-request-id'),
    });

    return response;
  } catch (cause) {
    const error = toNetworkError(cause);
    logDiagnostic('warn', 'infra', 'request.failed', {
      method: 'GET',
      requestOrigin: apiUrl,
      requestPath: path,
      durationMs: Date.now() - startedAt,
      online: typeof navigator === 'undefined' ? undefined : navigator.onLine,
      ...describeDiagnosticError(error),
    });
    throw error;
  }
}

function isReadiness(value: unknown): value is ApiReadiness {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate['status'] === 'string' && Array.isArray(candidate['checks']);
}
