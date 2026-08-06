import { env } from '@/lib/config/env';

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

  return body;
}

async function requestInfra(path: string): Promise<Response> {
  try {
    return await fetch(`${env.apiUrl}${path}`, {
      method: 'GET',
      headers: { accept: 'application/json' },
      credentials: 'omit',
      cache: 'no-store',
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
  } catch (cause) {
    throw toNetworkError(cause);
  }
}

function isReadiness(value: unknown): value is ApiReadiness {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate['status'] === 'string' && Array.isArray(candidate['checks']);
}
