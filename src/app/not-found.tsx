import { FileQuestion } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

import { StateMessage } from '@/components/feedback/state-message';
import { buttonVariants } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Pagina nao encontrada' };

export default function NotFound() {
  return (
    <main id="conteudo" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center">
      <StateMessage
        icon={FileQuestion}
        // Este bloco e o conteudo principal da pagina, entao o titulo dele e o
        // `h1` — e por ele que o leitor de tela anuncia onde o usuario esta.
        titleAs="h1"
        title="Pagina nao encontrada"
        description="O endereco acessado nao existe ou foi movido."
        action={
          // `Link`, e nao botao com router: funciona sem JavaScript carregado.
          <Link href="/" className={buttonVariants({ variant: 'outline' })}>
            Voltar ao inicio
          </Link>
        }
      />
    </main>
  );
}
