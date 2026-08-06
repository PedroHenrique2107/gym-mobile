import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

/**
 * Cabecalhos de seguranca aplicados a todas as respostas.
 *
 * A Content-Security-Policy nao esta aqui de proposito. O Next injeta scripts
 * inline no bootstrap, entao uma CSP util exige nonce por requisicao — o que
 * forca renderizacao dinamica em toda pagina e conflita com o shell estatico
 * que a PWA precisa. A alternativa preguicosa, `script-src 'unsafe-inline'`,
 * daria a aparencia de protecao sem nenhuma. A decisao fica para a fase M7,
 * junto da otimizacao de bundle e do deploy, onde o custo de renderizacao pode
 * ser medido de verdade.
 */
const securityHeaders = [
  // Impede o navegador de adivinhar o tipo de um recurso e executar como script.
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // Nenhuma origem externa recebe a URL de paginas autenticadas.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // A aplicacao nunca e legitimamente enquadrada por outro site.
  { key: 'X-Frame-Options', value: 'DENY' },

  // Desliga APIs que a aplicacao nao usa. Camera e microfone entram apenas se
  // as fotos de progresso passarem a ser capturadas no proprio app.
  {
    key: 'Permissions-Policy',
    value: [
      'accelerometer=()',
      'camera=()',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'payment=()',
      'usb=()',
    ].join(', '),
  },

  // Isola o contexto de navegacao de janelas abertas por terceiros.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * Fixa a raiz usada para rastrear arquivos do build.
   *
   * Sem isto, o Next sobe a arvore procurando um lockfile e pode escolher um
   * diretorio acima do repositorio — o que muda quais arquivos entram no
   * bundle de deploy e produz um aviso a cada build. Apontar para a pasta do
   * proprio projeto torna o resultado independente do que existe fora dele.
   */
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),

  // Um erro de tipo ou de lint precisa quebrar o build. Ignorar aqui e o
  // caminho mais curto para um deploy com regressao silenciosa.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  // O header revela a stack sem beneficio algum.
  poweredByHeader: false,

  // A assinatura do Next exige uma Promise; nao ha nada a aguardar aqui.
  headers() {
    return Promise.resolve([{ source: '/:path*', headers: securityHeaders }]);
  },
};

export default nextConfig;
