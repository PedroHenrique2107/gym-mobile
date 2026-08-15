import type { EmailOtpType } from '@supabase/supabase-js';

/** Telas que consomem um token recebido por e-mail. */
export type SetPasswordMode = 'convite' | 'recuperacao';

/**
 * Tipos que estas telas sabem consumir.
 *
 * A lista existe para não repassar ao Supabase um `type` arbitrário vindo da
 * URL. Um valor desconhecido não é uma falha de segurança — a verificação
 * simplesmente falharia —, mas cair no padrão da tela dá a mensagem certa em vez
 * de um erro genérico do provedor.
 */
const SUPPORTED_TYPES: readonly string[] = [
  'invite',
  'recovery',
  'signup',
  'magiclink',
  'email',
] as const;

export interface OtpLink {
  /** Hash do token de uso único que veio no link do e-mail. */
  readonly tokenHash: string;
  readonly type: EmailOtpType;
}

/**
 * Lê o token de uso único da query string do link recebido por e-mail.
 *
 * O formato esperado é `?token_hash=...&type=invite`, produzido pelos templates
 * de e-mail do projeto. Ele substituiu o `ConfirmationURL` padrão do Supabase,
 * que era um `GET` capaz de consumir o token só por ser buscado.
 *
 * Devolve `null` quando não há token na URL. Esse caso é normal e tem dois
 * motivos legítimos: links antigos, ainda em caixas de entrada, que entregam a
 * sessão no fragmento (`#access_token=...`), e alguém que abriu a página direto.
 */
export function readOtpLink(search: string, mode: SetPasswordMode): OtpLink | null {
  const params = new URLSearchParams(search);
  const tokenHash = params.get('token_hash');

  if (!tokenHash) return null;

  return { tokenHash, type: resolveType(params.get('type'), mode) };
}

/**
 * Garante que um token seja trocado por sessão uma única vez.
 *
 * O token é de uso único: a segunda verificação do mesmo valor falha, e a falha
 * é indistinguível de um link realmente expirado. Isso deixaria de ser teórico
 * em dois cenários reais. O `reactStrictMode` executa cada efeito duas vezes em
 * desenvolvimento, e uma remontagem do componente repetiria a chamada — nos dois
 * casos, um convite válido seria declarado inválido pela própria tela que acabou
 * de validá-lo.
 *
 * O resultado guardado inclui a rejeição de propósito: se a primeira tentativa
 * falhou, repetir com o mesmo token não muda o desfecho.
 */
export function verifyOtpOnce(
  link: OtpLink,
  verify: (link: OtpLink) => Promise<boolean>,
): Promise<boolean> {
  if (inFlight?.tokenHash === link.tokenHash) {
    return inFlight.result;
  }

  inFlight = { tokenHash: link.tokenHash, result: verify(link) };

  return inFlight.result;
}

let inFlight: { readonly tokenHash: string; readonly result: Promise<boolean> } | null = null;

function resolveType(value: string | null, mode: SetPasswordMode): EmailOtpType {
  if (value && SUPPORTED_TYPES.includes(value)) {
    return value;
  }

  return mode === 'convite' ? 'invite' : 'recovery';
}
