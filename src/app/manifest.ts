import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GymFlow',
    short_name: 'GymFlow',
    description: 'Organize treinos e acompanhe seu progresso.',
    id: '/',
    start_url: '/inicio',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#1a1c1f',
    theme_color: '#1a1c1f',
    categories: ['fitness', 'health', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
