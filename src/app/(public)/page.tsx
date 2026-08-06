import { Dumbbell } from 'lucide-react';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

/**
 * Pagina inicial publica.
 *
 * O texto descreve apenas o que existe. O plano proibe anunciar funcionalidade
 * indisponivel, e essa restricao e util: uma landing que promete cronometro,
 * graficos e offline antes de eles existirem transforma cada primeira sessao em
 * frustracao, e torna impossivel saber pelo proprio app o que ja funciona.
 */
export default function LandingPage() {
  return (
    <main id="conteudo" className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-10">
      <div className="flex flex-1 flex-col justify-center gap-8">
        <div className="flex flex-col gap-4">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"
          >
            <Dumbbell className="size-7" />
          </span>

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">GymFlow</h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              Organize seus treinos de academia e acompanhe seu progresso, direto do celular.
            </p>
          </div>
        </div>

        <Card className="border-warning/30 bg-warning/5">
          <CardTitle className="text-warning">Em desenvolvimento</CardTitle>
          <CardDescription className="mt-1 leading-relaxed">
            Esta versao contem apenas a fundacao tecnica do aplicativo: tema, navegacao, tratamento
            de erros e conexao com a API. Login, treinos, historico e funcionamento offline ainda
            nao foram construidos.
          </CardDescription>
        </Card>

        <div className="flex flex-col gap-3">
          <Link href="/inicio" className={buttonVariants({ size: 'lg', variant: 'primary' })}>
            Ver a navegacao
          </Link>
          <Link href="/status" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
            Verificar conexao com a API
          </Link>
        </div>
      </div>

      <footer className="pt-8 text-center text-xs text-muted-foreground">
        <p>Nome e identidade visual sao provisorios, aguardando aprovacao de marca.</p>
      </footer>
    </main>
  );
}
