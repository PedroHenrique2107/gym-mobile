import type { ReactNode } from 'react';

import { BottomNav } from '@/components/navigation/bottom-nav';

/**
 * Layout da area autenticada.
 *
 * Estas rotas sao protegidas pelo middleware, que valida a identidade no
 * Supabase antes de renderizar qualquer dado privado. O layout cuida apenas da
 * composicao visual; repetir a autorizacao aqui criaria duas fontes de verdade.
 *
 * `pb-28` reserva espaco para a navegacao fixa; sem isso o ultimo item de
 * qualquer lista ficaria permanentemente sob a barra.
 */
export default function ProtectedLayout({ children }: { readonly children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <main id="conteudo" className="flex-1 px-5 pb-28 pt-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
