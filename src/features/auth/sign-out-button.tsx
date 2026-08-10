'use client';

import { useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { LOGIN_ROUTE } from '@/lib/auth/routes';
import { signOutAndClear } from '@/lib/auth/session';

export function SignOutButton() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut(): Promise<void> {
    setSigningOut(true);

    // `signOutAndClear` já é tolerante a falha de rede: o logout local acontece
    // de qualquer forma. Deixar o usuário preso numa tela que ele acredita ter
    // fechado seria pior que uma sessão órfã no servidor, que expira sozinha.
    await signOutAndClear(queryClient);

    router.replace(LOGIN_ROUTE);
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      onClick={() => {
        void handleSignOut();
      }}
      disabled={signingOut}
    >
      <LogOut aria-hidden="true" />
      {signingOut ? 'Saindo...' : 'Sair'}
    </Button>
  );
}
