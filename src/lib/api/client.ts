import createClient, { type Middleware } from 'openapi-fetch';

import {
  describeDiagnosticError,
  describeRequestUrl,
  logDiagnostic,
} from '@/lib/diagnostics/logger';

import type { paths } from './generated/types';
import { resolveApiBaseUrl } from './base-url';
import { ApiError, toApiError, toNetworkError } from './problem';

/**
 * Prefixo das rotas de negocio.
 *
 * Exportado para referencia, mas **nao** entra no `baseUrl`. O contrato publica
 * os caminhos completos (`/api/v1/me`), e dividir o prefixo entre `baseUrl` e o
 * argumento faria o TypeScript nao casar `'/me'` com nenhuma chave de `paths` —
 * caindo numa uniao de todas as rotas. O sintoma era um erro apontando para o
 * schema errado, que nao sugeria a causa.
 */
export const API_BASE_PATH = '/api/v1';

/**
 * Provedor do access token.
 *
 * A fase M2 registra a implementacao real, que le a sessao do Supabase Auth. O
 * cliente HTTP nao conhece o Supabase de proposito: assim ele permanece
 * testavel sem sessao e a troca de provedor de identidade nao o alcanca.
 */
export type TokenProvider = () => Promise<string | null>;

/**
 * Renova a sessão. Devolve o token novo, ou `null` se não foi possível.
 *
 * Registrado em M2 junto do provedor de token. Mantê-lo separado permite que o
 * cliente decida **quando** renovar sem saber **como**.
 */
export type SessionRefresher = () => Promise<string | null>;

/** Chamado quando a sessão é perdida de forma irrecuperável. */
export type SessionExpiredHandler = () => void;

let tokenProvider: TokenProvider | null = null;
let sessionRefresher: SessionRefresher | null = null;
let onSessionExpired: SessionExpiredHandler | null = null;

interface RequestTrace {
  readonly startedAt: number;
  readonly method: string;
  readonly requestOrigin?: string;
  readonly requestPath?: string;
}

const requestTraces = new Map<string, RequestTrace>();

export function setTokenProvider(provider: TokenProvider | null): void {
  tokenProvider = provider;
}

export function setSessionRefresher(refresher: SessionRefresher | null): void {
  sessionRefresher = refresher;
}

export function setSessionExpiredHandler(handler: SessionExpiredHandler | null): void {
  onSessionExpired = handler;
}

/** Marca uma requisição já repetida, para não entrar em laço. */
const RETRIED_HEADER = 'x-gym-retried';

/**
 * `fetch` que renova a sessão uma vez e repete a requisição uma vez em `401`.
 *
 * O plano especifica exatamente isto, e os dois limites importam. Sem o limite
 * de renovação, várias requisições paralelas recebendo `401` disparariam
 * renovações simultâneas — e no Supabase uma renovação invalida a anterior, o
 * que derrubaria a sessão que se tentava salvar. Sem o limite de repetição, um
 * `401` persistente viraria laço infinito contra a API.
 *
 * `403` **não** entra aqui de propósito: falta de permissão não melhora com
 * token novo, e o plano determina que `403` não dispare logout.
 */
async function fetchWithRefresh(input: Request): Promise<Response> {
  const response = await fetch(input);

  if (response.status !== 401 || input.headers.has(RETRIED_HEADER) || !sessionRefresher) {
    return response;
  }

  logDiagnostic('warn', 'api', 'session_refresh.started', {
    requestId: input.headers.get('x-request-id'),
    method: input.method,
    ...describeRequestUrl(input.url),
  });

  const freshToken = await sessionRefresher();

  if (!freshToken) {
    // A renovação falhou: a sessão acabou de verdade. Avisar a aplicação é o
    // que permite limpar o cache e voltar ao login em vez de deixar a interface
    // repetindo chamadas que nunca vão funcionar.
    logDiagnostic('error', 'api', 'session_refresh.failed', {
      requestId: input.headers.get('x-request-id'),
      method: input.method,
      ...describeRequestUrl(input.url),
    });
    onSessionExpired?.();
    return response;
  }

  // `input` já foi consumido; a requisição precisa ser reconstruída.
  const retried = new Request(input, {
    headers: new Headers(input.headers),
  });
  retried.headers.set('authorization', `Bearer ${freshToken}`);
  retried.headers.set(RETRIED_HEADER, '1');

  const retryResponse = await fetch(retried);

  logDiagnostic(
    retryResponse.status === 401 ? 'error' : 'info',
    'api',
    'session_refresh.finished',
    {
      requestId: input.headers.get('x-request-id'),
      method: input.method,
      retryStatus: retryResponse.status,
      ...describeRequestUrl(input.url),
    },
  );

  if (retryResponse.status === 401) {
    // Token novo e ainda recusado: o problema não é expiração. Pode ser conta
    // desativada ou perfil removido — casos em que insistir não ajuda.
    onSessionExpired?.();
  }

  return retryResponse;
}

/**
 * Anexa o access token e o identificador de requisicao.
 *
 * O token e obtido a cada chamada, e nao guardado, porque o Supabase renova a
 * sessao em segundo plano — um valor capturado uma vez comecaria a falhar com
 * `401` depois de uma hora.
 */
const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const token = await tokenProvider?.();

    if (token) {
      request.headers.set('authorization', `Bearer ${token}`);
    }

    // Permite correlacionar um erro visto no navegador com o log do servidor.
    if (!request.headers.has('x-request-id')) {
      request.headers.set('x-request-id', crypto.randomUUID());
    }

    startRequestTrace(request);

    return request;
  },
};

/**
 * Converte respostas de erro em `ApiError`.
 *
 * Sem isto, cada chamada precisaria checar `error` manualmente e o formato de
 * Problem Details seria interpretado em varios lugares. Erros de rede tambem
 * passam por aqui, para que a interface trate uma so classe de falha.
 */
const errorMiddleware: Middleware = {
  async onResponse({ request, response }) {
    finishRequestTrace(request, response);

    if (response.ok) {
      return response;
    }

    throw await toApiError(response);
  },

  onError({ error, request }) {
    // Um `ApiError` lançado por `onResponse` reentra aqui; repassar sem
    // envolver evita transformar um 422 em erro de rede.
    if (error instanceof ApiError) {
      return error;
    }

    const networkError = toNetworkError(error);
    failRequestTrace(request, networkError);
    return networkError;
  },
};

function startRequestTrace(request: Request): void {
  const requestId = request.headers.get('x-request-id');
  if (!requestId) return;

  const url = describeRequestUrl(request.url);
  requestTraces.set(requestId, {
    startedAt: Date.now(),
    method: request.method,
    requestOrigin: typeof url['requestOrigin'] === 'string' ? url['requestOrigin'] : undefined,
    requestPath: typeof url['requestPath'] === 'string' ? url['requestPath'] : undefined,
  });

  logDiagnostic('info', 'api', 'request.started', {
    requestId,
    method: request.method,
    authenticated: request.headers.has('authorization'),
    ...url,
  });
}

function finishRequestTrace(request: Request, response: Response): void {
  const requestId = request.headers.get('x-request-id');
  const trace = requestId ? requestTraces.get(requestId) : undefined;
  if (requestId) requestTraces.delete(requestId);

  logDiagnostic(response.ok ? 'info' : 'warn', 'api', 'request.finished', {
    requestId,
    responseRequestId: response.headers.get('x-request-id'),
    method: trace?.method ?? request.method,
    status: response.status,
    durationMs: trace ? Date.now() - trace.startedAt : undefined,
    requestOrigin: trace?.requestOrigin,
    requestPath: trace?.requestPath,
  });
}

function failRequestTrace(request: Request, error: ApiError): void {
  const requestId = request.headers.get('x-request-id');
  const trace = requestId ? requestTraces.get(requestId) : undefined;
  if (requestId) requestTraces.delete(requestId);

  logDiagnostic('warn', 'api', 'request.network_failed', {
    requestId,
    method: trace?.method ?? request.method,
    durationMs: trace ? Date.now() - trace.startedAt : undefined,
    online: typeof navigator === 'undefined' ? undefined : navigator.onLine,
    requestOrigin: trace?.requestOrigin,
    requestPath: trace?.requestPath,
    ...describeDiagnosticError(error),
  });
}

/**
 * Cliente HTTP tipado pelo contrato do `gym-service`.
 *
 * Os tipos vem de `generated/types.ts`, gerado a partir do `openapi.json` do
 * backend. Nenhum tipo de dominio e escrito a mao aqui: se o contrato mudar de
 * forma incompativel, o `typecheck` quebra em vez de a divergencia aparecer em
 * runtime na mao do usuario.
 */
export const apiClient = createClient<paths>({
  // Apenas a origem: os caminhos completos vem do contrato.
  baseUrl: resolveApiBaseUrl(),
  headers: { 'content-type': 'application/json' },
  // Nao envia cookies: a API autentica por Bearer, e os cookies de sessao do
  // Supabase pertencem a origem do Next.js.
  credentials: 'omit',
  // Substitui o `fetch` global para poder renovar a sessao e repetir a
  // requisicao em `401` — algo que o middleware do openapi-fetch nao permite,
  // porque ele so observa a resposta e nao pode refazer a chamada.
  fetch: fetchWithRefresh,
});

apiClient.use(authMiddleware);
apiClient.use(errorMiddleware);
