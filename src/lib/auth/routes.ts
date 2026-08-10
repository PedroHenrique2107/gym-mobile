/**
 * Classificação das rotas para o middleware.
 *
 * A lista é de rotas **públicas**, e não de protegidas. A diferença importa:
 * com uma lista de protegidas, esquecer de incluir uma rota nova a deixa aberta,
 * e o esquecimento não produz sinal nenhum. Com uma lista de públicas, esquecer
 * torna a rota inacessível sem sessão — o que aparece no primeiro teste.
 */

/** Rotas alcançáveis sem sessão. */
export const PUBLIC_ROUTES = [
  '/',
  '/entrar',
  '/convite',
  '/recuperar-senha',
  '/redefinir-senha',
  '/status',
  '/offline',
] as const;

/**
 * Rotas que exigem sessão, mas onde uma sessão existente **não** deve
 * redirecionar para dentro do app.
 *
 * `/redefinir-senha` é o caso: o usuário chega ali com uma sessão de recuperação
 * válida e precisa concluir a troca de senha. Mandá-lo para `/inicio` por já
 * estar autenticado interromperia o fluxo no meio.
 */
export const AUTH_FLOW_ROUTES = ['/convite', '/redefinir-senha'] as const;

/** Para onde vai quem entra com sucesso. */
export const AFTER_LOGIN_ROUTE = '/inicio';

/** Para onde vai quem tenta uma rota protegida sem sessão. */
export const LOGIN_ROUTE = '/entrar';

/** Parâmetro que preserva o destino original durante o redirecionamento. */
export const REDIRECT_PARAM = 'destino';

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isAuthFlowRoute(pathname: string): boolean {
  return AUTH_FLOW_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Valida o destino guardado antes de redirecionar para ele.
 *
 * Aceita apenas caminhos internos que comecem com uma única barra. Sem esta
 * checagem, `?destino=https://atacante.example.com` faria a aplicação redirecionar
 * o usuário recém-autenticado para fora — um open redirect, que é usado para dar
 * aparência legítima a páginas de phishing.
 *
 * `//` é recusado porque o navegador o interpreta como URL protocol-relative:
 * `//atacante.com` leva para fora do domínio.
 */
export function safeRedirectTarget(value: string | null | undefined): string {
  if (!value) return AFTER_LOGIN_ROUTE;

  const decoded = safeDecode(value);

  if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('\\')) {
    return AFTER_LOGIN_ROUTE;
  }

  // Rota pública como destino faria o usuário voltar ao login logo após entrar.
  if (isPublicRoute(decoded.split('?')[0] ?? decoded)) {
    return AFTER_LOGIN_ROUTE;
  }

  return decoded;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    // Sequência percentual malformada. Tratar como destino inválido é mais
    // seguro que tentar adivinhar a intenção.
    return AFTER_LOGIN_ROUTE;
  }
}
