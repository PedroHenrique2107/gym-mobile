'use client';

import { SerwistProvider, useSerwist } from '@serwist/next/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';

import { isProductionBuild } from '@/lib/config/env';

interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

interface PwaContextValue {
  readonly isOnline: boolean;
  readonly isInstalled: boolean;
  readonly canInstall: boolean;
  readonly isIos: boolean;
  readonly updateAvailable: boolean;
  install(): Promise<void>;
  checkForUpdate(): Promise<void>;
  applyUpdate(): void;
}

const PwaContext = createContext<PwaContextValue | null>(null);

export function GymflowPwaProvider({ children }: { readonly children: ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/sw.js"
      cacheOnNavigation={false}
      reloadOnOnline={false}
      disable={!isProductionBuild}
    >
      <PwaLifecycle>{children}</PwaLifecycle>
    </SerwistProvider>
  );
}

function PwaLifecycle({ children }: { readonly children: ReactNode }) {
  const queryClient = useQueryClient();
  const { serwist } = useSerwist();
  const isOnline = useSyncExternalStore(subscribeConnection, readConnection, () => true);
  const isInstalled = useSyncExternalStore(subscribeStandalone, readStandalone, () => false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const isIos = useSyncExternalStore(subscribeUserAgent, readIos, () => false);
  const requestedUpdate = useRef(false);

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      toast.success('GymFlow instalado neste aparelho.');
    };
    const handleOffline = () => {
      toast.info('Sem conexao. Alteracoes do treino serao guardadas neste aparelho.');
    };
    const handleOnline = () => {
      window.dispatchEvent(new CustomEvent('gymflow:online'));
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!serwist) return;

    const handleWaiting = () => setUpdateAvailable(true);
    const handleControlling = () => {
      if (requestedUpdate.current) window.location.reload();
    };

    serwist.addEventListener('waiting', handleWaiting);
    serwist.addEventListener('controlling', handleControlling);

    return () => {
      serwist.removeEventListener('waiting', handleWaiting);
      serwist.removeEventListener('controlling', handleControlling);
    };
  }, [serwist]);

  const install = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'dismissed') toast.info('Instalacao cancelada.');
    setInstallPrompt(null);
  }, [installPrompt]);

  const checkForUpdate = useCallback(async () => {
    if (!serwist) return;
    await serwist.update();
    toast.success('Verificacao de atualizacao concluida.');
  }, [serwist]);

  const applyUpdate = useCallback(() => {
    const active = queryClient.getQueryData<{ status?: string }>(['sessions', 'active']);
    if (active?.status === 'ACTIVE') {
      toast.info('Conclua ou abandone o treino antes de atualizar o aplicativo.');
      return;
    }

    requestedUpdate.current = true;
    serwist?.messageSkipWaiting();
  }, [queryClient, serwist]);

  const value = useMemo<PwaContextValue>(
    () => ({
      isOnline,
      isInstalled,
      canInstall: installPrompt !== null,
      isIos,
      updateAvailable,
      install,
      checkForUpdate,
      applyUpdate,
    }),
    [
      isOnline,
      isInstalled,
      installPrompt,
      isIos,
      updateAvailable,
      install,
      checkForUpdate,
      applyUpdate,
    ],
  );

  return (
    <PwaContext.Provider value={value}>
      {!isOnline ? (
        <div
          role="status"
          className="fixed inset-x-0 top-0 z-50 bg-warning px-3 py-1 text-center text-xs font-semibold text-warning-foreground"
        >
          Offline · o treino sera sincronizado quando a conexao voltar
        </div>
      ) : null}
      {children}
    </PwaContext.Provider>
  );
}

export function usePwa(): PwaContextValue {
  const context = useContext(PwaContext);
  if (!context) throw new Error('usePwa precisa estar dentro de GymflowPwaProvider.');
  return context;
}

function subscribeConnection(onChange: () => void): () => void {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

function readConnection(): boolean {
  return navigator.onLine;
}

function subscribeStandalone(onChange: () => void): () => void {
  const media = window.matchMedia('(display-mode: standalone)');
  media.addEventListener('change', onChange);
  window.addEventListener('appinstalled', onChange);
  return () => {
    media.removeEventListener('change', onChange);
    window.removeEventListener('appinstalled', onChange);
  };
}

function readStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches;
}

function subscribeUserAgent(): () => void {
  return () => undefined;
}

function readIos(): boolean {
  return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
}
