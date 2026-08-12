import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import {
  AFTER_LOGIN_ROUTE,
  LOGIN_ROUTE,
  REDIRECT_PARAM,
  isAuthFlowRoute,
  isPublicRoute,
  safeRedirectTarget,
} from '@/lib/auth/routes';
import {
  describeDiagnosticError,
  describeRequestUrl,
  logDiagnostic,
} from '@/lib/diagnostics/logger';

/**
 * Proteção de rotas e renovação de sessão.
 *
 * Roda antes de qualquer página renderizar, o que resolve dois problemas de uma
 * vez.
 *
 * O primeiro é a dívida da fase M1: as rotas de `(protected)` existiam mas eram
 * públicas. Proteger no cliente deixaria o conteúdo aparecer por um instante
 * antes do redirecionamento — e, pior, o HTML já teria sido enviado.
 *
 * O segundo é a renovação: o Supabase renova o token em segundo plano, e a
 * sessão renovada precisa voltar ao navegador como cookie. Server Components não
 * podem escrever cookies; o middleware pode.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  logDiagnostic('debug', 'proxy', 'request.received', {
    method: request.method,
    ...describeRequestUrl(request.url),
  });

  // A resposta é criada antes da consulta ao Supabase porque uma renovação
  // necessária durante `getClaims()` precisa escrever os novos cookies nela.
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Sem Supabase configurado, nenhuma sessão pode existir. Bloquear as rotas
  // privadas é o comportamento correto: liberá-las "porque a autenticação não
  // está configurada" seria exatamente o tipo de exceção que vira brecha.
  if (!supabaseUrl || !supabaseKey) {
    logDiagnostic('warn', 'proxy', 'auth.unconfigured', {
      routePublic: isPublicRoute(pathname),
      ...describeRequestUrl(request.url),
    });
    return isPublicRoute(pathname) ? response : redirectToLogin(request);
  }

  // Estas paginas publicas nao dependem de saber se existe uma sessao. A
  // landing e o login continuam validando para redirecionar quem ja entrou.
  if (isPublicRoute(pathname) && pathname !== LOGIN_ROUTE && pathname !== '/') {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    auth: { flowType: 'pkce' },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  /**
   * `getClaims()` valida criptograficamente o JWT e renova a sessão próxima do
   * vencimento. Com chave assimétrica, a JWKS é buscada uma vez e mantida em
   * cache, removendo a chamada ao Auth que `getUser()` faria em cada navegação.
   * `getSession()` sozinho continua inadequado aqui porque apenas leria o cookie.
   */
  const authStartedAt = Date.now();
  let authenticated = false;

  try {
    // Valida assinatura e expiracao. Com JWT assimetrico, a JWKS fica em cache
    // e a verificacao ocorre localmente por WebCrypto, sem confiar no cookie.
    const result = await supabase.auth.getClaims();
    authenticated = Boolean(result.data?.claims.sub) && !result.error;
    logDiagnostic('info', 'proxy', 'auth.validated', {
      authenticated,
      durationMs: Date.now() - authStartedAt,
      ...describeRequestUrl(request.url),
    });
  } catch (error) {
    logDiagnostic('error', 'proxy', 'auth.validation_failed', {
      durationMs: Date.now() - authStartedAt,
      ...describeRequestUrl(request.url),
      ...describeDiagnosticError(error),
    });
    throw error;
  }

  // Já autenticado tentando entrar de novo: manda para dentro do app. Exceto nas
  // rotas de fluxo, onde a sessão é justamente o que permite concluir a ação.
  if (
    authenticated &&
    (pathname === LOGIN_ROUTE || pathname === '/') &&
    !isAuthFlowRoute(pathname)
  ) {
    const destino = safeRedirectTarget(request.nextUrl.searchParams.get(REDIRECT_PARAM));
    logDiagnostic('info', 'proxy', 'redirect.authenticated_user', {
      destinationPath: describeRequestUrl(new URL(destino, request.url))['requestPath'],
      ...describeRequestUrl(request.url),
    });
    return NextResponse.redirect(new URL(destino, request.url));
  }

  if (isPublicRoute(pathname)) {
    return response;
  }

  if (!authenticated) {
    logDiagnostic('info', 'proxy', 'redirect.unauthenticated_user', {
      ...describeRequestUrl(request.url),
    });
    return redirectToLogin(request);
  }

  return response;
}

/**
 * Manda para o login preservando o destino.
 *
 * Sem isso, quem abre um link direto para uma tela interna e precisa entrar
 * acabaria em `/inicio`, tendo que navegar de novo até onde queria — e teria
 * perdido o contexto do link.
 */
function redirectToLogin(request: NextRequest): NextResponse {
  const url = new URL(LOGIN_ROUTE, request.url);
  const destino = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (destino !== AFTER_LOGIN_ROUTE) {
    url.searchParams.set(REDIRECT_PARAM, destino);
  }

  return NextResponse.redirect(url);
}

export const config = {
  /**
   * Exclui apenas o que não é página.
   *
   * O padrão é por exclusão, e não por inclusão, pela mesma razão da lista de
   * rotas públicas: uma rota nova nasce protegida. Arquivos estáticos e ícones
   * ficam de fora porque não carregam dado privado e o custo de validar a sessão
   * em cada um deles seria uma chamada de rede por asset.
   */
  matcher: [
    '/((?!_next/|favicon.ico|manifest.webmanifest|sw.js|icons/|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)',
  ],
};
