import type { MetadataRoute } from 'next';

import { PUBLIC_SITE_URL } from '@/lib/config/site';

/**
 * Apenas a landing e publica para mecanismos de busca.
 *
 * `robots.txt` nao substitui autorizacao: as rotas privadas continuam
 * protegidas pelo proxy. A lista abaixo apenas evita que URLs de autenticacao
 * e da aplicacao aparecam em resultados de busca.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/agenda',
        '/api/',
        '/convite',
        '/entrar',
        '/inicio',
        '/jam/',
        '/offline',
        '/perfil',
        '/progresso',
        '/recuperar-senha',
        '/redefinir-senha',
        '/status',
        '/treinar',
      ],
    },
    sitemap: new URL('/sitemap.xml', PUBLIC_SITE_URL).toString(),
    host: PUBLIC_SITE_URL.origin,
  };
}
