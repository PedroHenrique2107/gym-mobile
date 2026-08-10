import type { AuthError } from '@supabase/supabase-js';

/**
 * Traduz erros do Supabase Auth em mensagens para o usuário.
 *
 * As mensagens originais vêm em inglês e descrevem o mecanismo, não a ação a
 * tomar — `"Invalid login credentials"` não diz se o problema é o e-mail ou a
 * senha. Repassá-las violaria a regra de não exibir mensagem interna.
 *
 * A tradução é por `code`, e não por texto: o Supabase reescreve mensagens entre
 * versões, e comparar strings quebraria em silêncio numa atualização.
 */
const MESSAGES: Readonly<Record<string, string>> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Confirme seu e-mail pelo link que enviamos antes de entrar.',
  user_not_found: 'E-mail ou senha incorretos.',
  weak_password: 'Escolha uma senha mais forte, com pelo menos 8 caracteres.',
  same_password: 'A nova senha precisa ser diferente da atual.',
  over_request_rate_limit: 'Muitas tentativas em pouco tempo. Aguarde um minuto e tente de novo.',
  over_email_send_rate_limit: 'Muitos e-mails enviados. Aguarde alguns minutos e tente de novo.',
  otp_expired: 'Este link expirou. Peça um novo.',
  validation_failed: 'Revise os dados informados.',
  signup_disabled: 'O cadastro e feito somente por convite.',
  email_exists: 'Este e-mail ja esta em uso.',
  session_not_found: 'Sua sessao expirou. Entre novamente.',
};

/**
 * Deliberadamente idêntica para e-mail inexistente e senha errada.
 *
 * Distinguir os dois casos transformaria a tela de login em um verificador de
 * quem tem conta no aplicativo — informação que não deve ser pública, ainda mais
 * num sistema fechado por convite.
 */
const GENERIC = 'Nao foi possivel concluir. Verifique os dados e tente novamente.';

export function describeAuthError(error: AuthError | null | undefined): string {
  if (!error) return GENERIC;

  const byCode = error.code ? MESSAGES[error.code] : undefined;
  if (byCode) return byCode;

  // Alguns erros só trazem status. `429` é o mais provável de acontecer e o mais
  // confuso sem explicação: o usuário não sabe que existe um limite.
  if (error.status === 429) {
    return MESSAGES['over_request_rate_limit'] ?? GENERIC;
  }

  if (error.status === 0 || error.name === 'AuthRetryableFetchError') {
    return 'Sem conexao com o servidor. Verifique sua internet.';
  }

  return GENERIC;
}

/** Requisito mínimo de senha, alinhado ao padrão do Supabase. */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Valida a senha antes de enviar.
 *
 * Validar aqui evita uma ida ao servidor para descobrir algo que já se sabia, e
 * dá a mensagem no campo certo em vez de um erro geral no topo do formulário.
 */
export function validatePassword(password: string, confirmation?: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `A senha precisa ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  if (confirmation !== undefined && password !== confirmation) {
    return 'As senhas nao coincidem.';
  }

  return null;
}

/** Verificação de formato apenas. Quem confirma a existência é o servidor. */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim();

  if (!trimmed) return 'Informe seu e-mail.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) return 'Informe um e-mail valido.';

  return null;
}
