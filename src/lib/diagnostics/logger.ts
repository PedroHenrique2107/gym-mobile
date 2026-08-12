export type DiagnosticLevel = 'debug' | 'info' | 'warn' | 'error';

export type DiagnosticContext = Readonly<
  Record<string, string | number | boolean | null | undefined>
>;

const DIAGNOSTICS_STORAGE_KEY = 'gymflow:diagnostics';
const REDACTED_VALUE = '[redacted]';
const MAX_VALUE_LENGTH = 200;
const SENSITIVE_KEY =
  /(authorization|cookie|password|token|secret|email|fullName|birthDate|signedUrl|payload|body)/i;
const UUID_SEGMENT = /\b[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

/**
 * Log diagnostico centralizado do navegador e do Proxy.
 *
 * Desenvolvimento registra o fluxo completo. Preview/producao registram apenas
 * avisos e erros, a menos que o desenvolvedor habilite temporariamente no
 * navegador com:
 *
 * `localStorage.setItem('gymflow:diagnostics', 'enabled')`
 *
 * O contexto aceita apenas valores primitivos e passa por redaction. Corpos,
 * tokens, e-mail e URLs assinadas nao devem chegar aqui, mesmo em desenvolvimento.
 */
export function logDiagnostic(
  level: DiagnosticLevel,
  scope: string,
  event: string,
  context: DiagnosticContext = {},
): void {
  if ((level === 'debug' || level === 'info') && !isVerboseDiagnosticsEnabled()) {
    return;
  }

  const safeContext = sanitizeContext(context);
  const prefix = `[gymflow:${scope}] ${event}`;

  switch (level) {
    case 'debug':
      console.debug(prefix, safeContext);
      break;
    case 'info':
      console.info(prefix, safeContext);
      break;
    case 'warn':
      console.warn(prefix, safeContext);
      break;
    case 'error':
      console.error(prefix, safeContext);
      break;
  }
}

/** Extrai somente classe e codigo tecnico; nunca a mensagem potencialmente sensivel. */
export function describeDiagnosticError(error: unknown): DiagnosticContext {
  if (typeof error !== 'object' || error === null) {
    return { errorName: typeof error };
  }

  const candidate = error as { name?: unknown; code?: unknown; status?: unknown; cause?: unknown };
  const cause =
    typeof candidate.cause === 'object' && candidate.cause !== null
      ? (candidate.cause as { code?: unknown; name?: unknown })
      : null;

  return {
    errorName: typeof candidate.name === 'string' ? candidate.name : 'UnknownError',
    errorCode:
      typeof candidate.code === 'string'
        ? candidate.code
        : typeof cause?.code === 'string'
          ? cause.code
          : undefined,
    errorStatus: typeof candidate.status === 'number' ? candidate.status : undefined,
    causeName: typeof cause?.name === 'string' ? cause.name : undefined,
  };
}

/** Remove query, hash e identificadores UUID antes de registrar um caminho. */
export function describeRequestUrl(input: string | URL): DiagnosticContext {
  try {
    const url = input instanceof URL ? input : new URL(input);
    return {
      requestOrigin: url.origin,
      requestPath: url.pathname.replace(UUID_SEGMENT, ':uuid'),
    };
  } catch {
    return { requestOrigin: 'invalid-url', requestPath: 'invalid-url' };
  }
}

function isVerboseDiagnosticsEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(DIAGNOSTICS_STORAGE_KEY) === 'enabled';
  } catch {
    return false;
  }
}

function sanitizeContext(
  context: DiagnosticContext,
): Record<string, string | number | boolean | null> {
  const safe: Record<string, string | number | boolean | null> = {};

  for (const [key, rawValue] of Object.entries(context)) {
    if (rawValue === undefined) continue;

    if (SENSITIVE_KEY.test(key)) {
      safe[key] = REDACTED_VALUE;
      continue;
    }

    safe[key] =
      typeof rawValue === 'string' && rawValue.length > MAX_VALUE_LENGTH
        ? `${rawValue.slice(0, MAX_VALUE_LENGTH)}...`
        : rawValue;
  }

  return safe;
}
