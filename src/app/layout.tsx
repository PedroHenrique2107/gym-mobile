import type { Metadata, Viewport } from 'next';

import { Toaster } from '@/components/feedback/toaster';
import { GymflowPwaProvider } from '@/features/pwa/pwa-provider';
import { SessionProvider } from '@/lib/auth/session-provider';
import { QueryProvider } from '@/lib/query/query-provider';

import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'GymFlow',
    template: '%s · GymFlow',
  },
  description: 'Organize seus treinos de academia e acompanhe seu progresso.',
  applicationName: 'GymFlow',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'GymFlow' },
  // A aplicacao e privada: nada deve ser indexado.
  robots: { index: false, follow: false },
  formatDetection: { telephone: false, email: false, address: false },
};

/**
 * Viewport.
 *
 * `maximumScale` e `userScalable` ficam nos valores permissivos de proposito. O
 * prototipo bloqueava o zoom, o que e uma barreira de acessibilidade direta:
 * quem precisa ampliar para ler perde o acesso ao app. O plano lista essa
 * correcao explicitamente.
 *
 * `viewportFit: 'cover'` habilita `env(safe-area-inset-*)`, que a navegacao
 * inferior usa para nao ficar sob a barra de gestos do iPhone.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#1a1c1f',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    // `lang="pt-BR"` importa de verdade: define a pronuncia do leitor de tela e
    // a hifenizacao. O prototipo declarava ingles.
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        {/* Permite pular a navegacao repetida em cada pagina, no teclado. */}
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Pular para o conteudo
        </a>

        <QueryProvider>
          <GymflowPwaProvider>
            <SessionProvider>{children}</SessionProvider>
          </GymflowPwaProvider>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
