/**
 * Leitura do contrato de erro do `gym-service`.
 *
 * O backend responde toda falha em `application/problem+json` (RFC 9457). O
 * campo que decide comportamento e `code`, nunca `detail`: `code` e estavel e
 * versionado, `detail` e texto livre que pode ser reescrito a qualquer momento.
 * Ramificar em `detail` significaria quebrar o app quando alguem melhorar uma
 * mensagem.
 */

export const PROBLEM_JSON_CONTENT_TYPE = 'application/problem+json';

/** Codigos que o frontend trata de forma distinta. */
export const ErrorCode = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  FORBIDDEN: 'FORBIDDEN',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  ACCOUNT_PENDING_DELETION: 'ACCOUNT_PENDING_DELETION',
  CONSENT_REQUIRED: 'CONSENT_REQUIRED',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RESOURCE_VERSION_CONFLICT: 'RESOURCE_VERSION_CONFLICT',
  IDEMPOTENCY_KEY_MISMATCH: 'IDEMPOTENCY_KEY_MISMATCH',
  IDEMPOTENCY_KEY_REQUIRED: 'IDEMPOTENCY_KEY_REQUIRED',
  IDEMPOTENCY_IN_PROGRESS: 'IDEMPOTENCY_IN_PROGRESS',
  RESOURCE_IN_USE: 'RESOURCE_IN_USE',
  ACCOUNT_LIMIT_REACHED: 'ACCOUNT_LIMIT_REACHED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  /** Nao vem do backend: representa falha de rede ou resposta ilegivel. */
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ProblemDetails {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail?: string;
  readonly instance: string;
  readonly code: string;
  readonly requestId: string;
  readonly errors: Record<string, string[]> | null;
  /** Extensoes como `currentVersion` em um 409. */
  readonly [key: string]: unknown;
}

/**
 * Erro lancado por toda falha de chamada a API.
 *
 * Carrega o `requestId` porque e o unico elo entre o que o usuario viu e a
 * linha de log do servidor. Sem ele, diagnosticar um relato do usuario depende
 * de adivinhar o horario.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | undefined;
  readonly fieldErrors: Record<string, string[]> | null;
  readonly problem: ProblemDetails | undefined;

  constructor(params: {
    status: number;
    code: string;
    message: string;
    requestId?: string | undefined;
    fieldErrors?: Record<string, string[]> | null;
    problem?: ProblemDetails | undefined;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.code = params.code;
    this.requestId = params.requestId;
    this.fieldErrors = params.fieldErrors ?? null;
    this.problem = params.problem;
  }

  /** Sessao ausente ou expirada: exige renovar ou voltar ao login. */
  get isAuthError(): boolean {
    return this.status === 401;
  }

  /**
   * Falta de permissao.
   *
   * Separado de `isAuthError` de proposito: o plano determina que `403` **nao**
   * dispare logout. Deslogar alguem por tentar uma acao sem permissao seria
   * perder o treino em andamento por um clique indevido.
   */
  get isPermissionError(): boolean {
    return this.status === 403;
  }

  get isValidationError(): boolean {
    return this.status === 422;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }

  /**
   * Vale a pena tentar de novo automaticamente.
   *
   * Rede, `5xx` e `429` sao transitorios. `4xx` nao: repetir sem corrigir o
   * payload apenas gasta bateria e cota.
   */
  get isRetryable(): boolean {
    return (
      this.status === 0 ||
      this.status >= 500 ||
      this.status === 429 ||
      this.code === ErrorCode.IDEMPOTENCY_IN_PROGRESS
    );
  }

  /** Versao atual do recurso em um conflito de concorrencia. */
  get currentVersion(): number | undefined {
    const value = this.problem?.['currentVersion'];
    return typeof value === 'number' ? value : undefined;
  }
}

/** Mensagens de fallback quando o backend nao envia `detail`. */
const FALLBACK_MESSAGES: Readonly<Record<number, string>> = {
  0: 'Sem conexão com o servidor. Verifique sua internet.',
  400: 'Não foi possível processar a requisição.',
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Você não tem permissão para esta ação.',
  404: 'Não encontramos o que você procurava.',
  409: 'Este item foi alterado em outro dispositivo.',
  413: 'O arquivo é maior que o permitido.',
  415: 'Formato de arquivo não aceito.',
  422: 'Revise os campos informados.',
  429: 'Muitas tentativas. Aguarde um momento.',
  500: 'Algo deu errado do nosso lado. Tente novamente.',
  503: 'O serviço está indisponível. Tente em instantes.',
};

const GENERIC_MESSAGE = 'Algo deu errado. Tente novamente.';

export function messageForStatus(status: number): string {
  return FALLBACK_MESSAGES[status] ?? GENERIC_MESSAGE;
}

/**
 * Converte uma resposta de erro em `ApiError`.
 *
 * Aceita corpo ausente ou ilegivel sem lancar: um proxy ou o Service Worker
 * podem devolver HTML no lugar do JSON esperado, e nesse caso o usuario ainda
 * precisa de uma mensagem util em vez de um `SyntaxError`.
 */
export async function toApiError(response: Response): Promise<ApiError> {
  const problem = await readProblemBody(response);

  if (problem) {
    const status = problem.status || response.status;

    return new ApiError({
      status,
      code: problem.code,
      // `detail` do backend ja vem em pt-BR, sanitizado e especifico desta
      // ocorrencia. `title` nao entra na cadeia de proposito: pela RFC 9457 ele
      // e o rotulo do *tipo* de problema, identico em toda ocorrencia — "Falha
      // interna" descreve a categoria, mas nao diz ao usuario o que fazer. O
      // fallback local e escrito como orientacao.
      message: problem.detail ?? messageForStatus(status),
      requestId: problem.requestId,
      fieldErrors: problem.errors,
      problem,
    });
  }

  return new ApiError({
    status: response.status,
    code: inferCodeFromStatus(response.status),
    message: messageForStatus(response.status),
    requestId: response.headers.get('x-request-id') ?? undefined,
  });
}

/**
 * Falha antes de existir resposta HTTP: DNS, offline, timeout, CORS.
 *
 * A causa original vai para `cause` e nunca para `message`: mensagens de rede
 * do navegador citam host e porta, e a interface nao deve exibir isso.
 */
export function toNetworkError(cause: unknown): ApiError {
  const error = new ApiError({
    status: 0,
    code: ErrorCode.NETWORK_ERROR,
    message: messageForStatus(0),
  });

  if (cause !== undefined) {
    error.cause = cause;
  }

  return error;
}

async function readProblemBody(response: Response): Promise<ProblemDetails | null> {
  const contentType = response.headers.get('content-type') ?? '';

  // Aceita tambem `application/json`: um proxy pode normalizar o content-type.
  if (!contentType.includes('json')) {
    return null;
  }

  try {
    const body: unknown = await response.json();
    return isProblemDetails(body) ? body : null;
  } catch {
    return null;
  }
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate['code'] === 'string' && typeof candidate['status'] === 'number';
}

function inferCodeFromStatus(status: number): ErrorCodeValue {
  switch (status) {
    case 401:
      return ErrorCode.UNAUTHENTICATED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 409:
      return ErrorCode.CONFLICT;
    case 422:
      return ErrorCode.VALIDATION_ERROR;
    case 429:
      return ErrorCode.RATE_LIMITED;
    case 503:
      return ErrorCode.SERVICE_UNAVAILABLE;
    default:
      return status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.BAD_REQUEST;
  }
}
