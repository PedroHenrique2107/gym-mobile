import type { ReactNode } from 'react';

import { BottomNav } from '@/components/navigation/bottom-nav';

/**
 * Layout da area autenticada.
 *
 * ATENCAO — estas rotas ainda **nao estao protegidas**. A verificacao de sessao
 * entra na fase M2, junto do Supabase Auth: sem um mecanismo de sessao, um
 * guardiao aqui redirecionaria todo acesso e tornaria a navegacao impossivel de
 * validar nesta fase.
 *
 * Isso e aceitavel hoje por um motivo verificavel: nenhuma destas telas le ou
 * exibe dado de usuario. Elas existem para validar a navegacao, os alvos de
 * toque e as safe areas. No momento em que a primeira consulta a API entrar
 * aqui, a protecao de rota precisa existir antes.
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
