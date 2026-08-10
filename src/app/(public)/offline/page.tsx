import { Dumbbell, RefreshCw, WifiOff } from 'lucide-react';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function OfflinePage() {
  return (
    <main id="conteudo" className="mx-auto flex min-h-dvh max-w-md items-center px-5 py-10">
      <Card className="w-full text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-warning/10 text-warning">
          <WifiOff aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold">Voce esta offline</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Se um treino ja estava salvo neste aparelho, abra Treinar para continuar registrando as
          series. Fotos e administracao exigem conexao.
        </p>
        <div className="mt-5 grid gap-2">
          <Link href="/treinar" className={buttonVariants({ size: 'lg' })}>
            <Dumbbell /> Abrir treino
          </Link>
          <Link href="/inicio" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            <RefreshCw /> Tentar novamente
          </Link>
        </div>
      </Card>
    </main>
  );
}
