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
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // A resposta é criada antes da consulta ao Supabase porque os cookies de
  // sessão renovada são escritos nela durante `getUser()`.
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Sem Supabase configurado, nenhuma sessão pode existir. Bloquear as rotas
  // privadas é o comportamento correto: liberá-las "porque a autenticação não
  // está configurada" seria exatamente o tipo de exceção que vira brecha.
  if (!supabaseUrl || !supabaseKey) {
    return isPublicRoute(pathname) ? response : redirectToLogin(request);
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
   * `getUser()` e não `getSession()`.
   *
   * `getSession()` apenas lê o cookie e confia nele. Como o cookie chega do
   * navegador, isso permitiria a qualquer pessoa forjar uma sessão editando o
   * próprio cookie. `getUser()` valida o token contra o Supabase — é uma chamada
   * de rede a mais por requisição, e é o que sustenta toda a proteção.
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Já autenticado tentando entrar de novo: manda para dentro do app. Exceto nas
  // rotas de fluxo, onde a sessão é justamente o que permite concluir a ação.
  if (user && (pathname === LOGIN_ROUTE || pathname === '/') && !isAuthFlowRoute(pathname)) {
    const destino = safeRedirectTarget(request.nextUrl.searchParams.get(REDIRECT_PARAM));
    return NextResponse.redirect(new URL(destino, request.url));
  }

  if (isPublicRoute(pathname)) {
    return response;
  }

  if (!user) {
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
    '/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)',
  ],
};
