'use client';

import { Download, RefreshCw, Smartphone, Wifi, WifiOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

import { usePwa } from './pwa-provider';

export function PwaSettings() {
  const pwa = usePwa();

  return (
    <Card className="mt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>Aplicativo e offline</CardTitle>
          <CardDescription className="mt-1">
            Instale o GymFlow e controle quando uma nova versao entra em uso.
          </CardDescription>
        </div>
        <span className={pwa.isOnline ? 'text-success' : 'text-warning'}>
          {pwa.isOnline ? <Wifi aria-label="Online" /> : <WifiOff aria-label="Offline" />}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {pwa.canInstall ? (
          <Button onClick={() => void pwa.install()}>
            <Download /> Instalar neste aparelho
          </Button>
        ) : null}
        {pwa.isIos && !pwa.isInstalled ? (
          <p className="rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
            No iPhone, abra Compartilhar e escolha “Adicionar a Tela de Inicio”.
          </p>
        ) : null}
        {pwa.isInstalled ? (
          <p className="flex items-center gap-2 text-sm text-success">
            <Smartphone className="size-4" /> Instalado como aplicativo
          </p>
        ) : null}
        {pwa.updateAvailable ? (
          <Button onClick={() => pwa.applyUpdate()}>
            <RefreshCw /> Aplicar atualizacao
          </Button>
        ) : (
          <Button variant="outline" onClick={() => void pwa.checkForUpdate()}>
            <RefreshCw /> Procurar atualizacao
          </Button>
        )}
      </div>
    </Card>
  );
}
