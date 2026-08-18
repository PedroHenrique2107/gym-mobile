/// <reference lib="esnext" />
/// <reference lib="webworker" />

import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from 'serwist';
import {
  CacheFirst,
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
} from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

interface GymflowPushPayload {
  readonly title?: string;
  readonly body?: string;
  readonly url?: string;
  readonly tag?: string;
}

const cacheable = () => new CacheableResponsePlugin({ statuses: [200] });

/**
 * Cache somente do shell.
 *
 * Respostas de API, Supabase e URLs assinadas nunca entram no Cache Storage.
 * Dados privados necessarios ao treino ficam no IndexedDB, separados por
 * usuario, e sao removidos no logout.
 */
const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith('/api/'),
    handler: new NetworkOnly(),
  },
  {
    matcher: ({ sameOrigin, request }) =>
      sameOrigin && ['script', 'style', 'worker', 'font'].includes(request.destination),
    handler: new CacheFirst({
      cacheName: 'gymflow-static-v1',
      plugins: [
        cacheable(),
        new ExpirationPlugin({ maxEntries: 96, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      ],
    }),
  },
  {
    matcher: ({ sameOrigin, request, url }) =>
      sameOrigin &&
      request.destination === 'image' &&
      (url.pathname.startsWith('/icons/') || url.pathname.startsWith('/_next/')),
    handler: new CacheFirst({
      cacheName: 'gymflow-images-v1',
      plugins: [
        cacheable(),
        new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      ],
    }),
  },
  {
    matcher: ({ sameOrigin, request }) => sameOrigin && request.headers.get('RSC') === '1',
    handler: new NetworkOnly(),
  },
  {
    matcher: ({ sameOrigin, request, url }) =>
      sameOrigin && request.mode === 'navigate' && url.pathname.startsWith('/treinar'),
    handler: new NetworkFirst({
      cacheName: 'gymflow-training-shell-v1',
      networkTimeoutSeconds: 4,
      plugins: [cacheable(), new ExpirationPlugin({ maxEntries: 2, maxAgeSeconds: 24 * 60 * 60 })],
    }),
  },
  {
    matcher: /.*/i,
    handler: new NetworkOnly(),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: { cleanupOutdatedCaches: true },
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
});

serwist.addEventListeners();

self.addEventListener('push', (event: PushEvent) => {
  const payload = readPushPayload(event.data);
  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'GymFlow', {
      body: payload.body ?? 'Você tem uma atualização no GymFlow.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: payload.tag ?? 'gymflow',
      data: { url: safeNotificationPath(payload.url) },
    }),
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const path = safeNotificationPath((event.notification.data as { url?: unknown } | null)?.url);
  event.waitUntil(openOrFocus(path));
});

function readPushPayload(data: PushMessageData | null): GymflowPushPayload {
  if (!data) return {};
  try {
    const value: unknown = data.json();
    if (typeof value !== 'object' || value === null) return {};
    return {
      title: readString(value, 'title'),
      body: readString(value, 'body'),
      url: readString(value, 'url'),
      tag: readString(value, 'tag'),
    };
  } catch {
    return {};
  }
}

function safeNotificationPath(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.includes('\\')) return '/inicio';
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith('//') || decoded.includes('\\')) return '/inicio';
    const url = new URL(value, self.location.origin);
    return url.origin === self.location.origin
      ? `${url.pathname}${url.search}${url.hash}`
      : '/inicio';
  } catch {
    return '/inicio';
  }
}

function readString(value: object, key: string): string | undefined {
  if (!(key in value)) return undefined;
  const field: unknown = Reflect.get(value, key);
  return typeof field === 'string' ? field : undefined;
}

async function openOrFocus(path: string): Promise<void> {
  const target = new URL(path, self.location.origin).href;
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);

  if (existing && 'focus' in existing) {
    await existing.focus();
    await existing.navigate(target);
    return;
  }
  await self.clients.openWindow(target);
}
