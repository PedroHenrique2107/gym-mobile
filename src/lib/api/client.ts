import createClient, { type Middleware } from 'openapi-fetch';

import { env } from '@/lib/config/env';

import type { paths } from './generated/types';
import { ApiError, toApiError, toNetworkError } from './problem';

/** Prefixo obrigatorio de todas as rotas de negocio. */
export const API_BASE_PATH = '/api/v1';

/**
 * Provedor do access token.
 *
 * A fase M2 registra a implementacao real, que le a sessao do Supabase Auth. O
 * cliente HTTP nao conhece o Supabase de proposito: assim ele permanece
 * testavel sem sessao e a troca de provedor de identidade nao o alcanca.
 */
export type TokenProvider = () => Promise<string | null>;

let tokenProvider: TokenProvider | null = null;

export function setTokenProvider(provider: TokenProvider | null): void {
  tokenProvider = provider;
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
  async onResponse({ response }) {
    if (response.ok) {
      return response;
    }

    throw await toApiError(response);
  },

  onError({ error }) {
    // Um `ApiError` lançado por `onResponse` reentra aqui; repassar sem
    // envolver evita transformar um 422 em erro de rede.
    if (error instanceof ApiError) {
      return error;
    }

    return toNetworkError(error);
  },
};

/**
 * Cliente HTTP tipado pelo contrato do `gym-service`.
 *
 * Os tipos vem de `generated/types.ts`, gerado a partir do `openapi.json` do
 * backend. Nenhum tipo de dominio e escrito a mao aqui: se o contrato mudar de
 * forma incompativel, o `typecheck` quebra em vez de a divergencia aparecer em
 * runtime na mao do usuario.
 */
export const apiClient = createClient<paths>({
  baseUrl: `${env.apiUrl}${API_BASE_PATH}`,
  headers: { 'content-type': 'application/json' },
  // Nao envia cookies: a API autentica por Bearer, e os cookies de sessao do
  // Supabase pertencem a origem do Next.js.
  credentials: 'omit',
});

apiClient.use(authMiddleware);
apiClient.use(errorMiddleware);
