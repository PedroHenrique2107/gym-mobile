import { Dumbbell } from 'lucide-react';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

/**
 * Pagina inicial publica.
 *
 * O texto descreve apenas o que existe e acompanha a capacidade entregue pelo
 * aplicativo. Assim, a landing funciona tambem como um resumo confiavel para
 * quem esta entrando pela primeira vez.
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

        <Card className="border-primary/30 bg-primary/5">
          <CardTitle className="text-primary">Pronto para treinar</CardTitle>
          <CardDescription className="mt-1 leading-relaxed">
            Entre por convite, configure seu perfil, crie exercicios e fichas, organize a agenda e
            execute seus treinos. Sessoes, medidas e fotos registram seu progresso, com suporte
            offline e sincronizacao ao reconectar.
          </CardDescription>
        </Card>

        <div className="flex flex-col gap-3">
          <Link href="/inicio" className={buttonVariants({ size: 'lg', variant: 'primary' })}>
            Entrar no aplicativo
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
