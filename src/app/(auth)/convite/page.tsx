import type { Metadata } from 'next';

import { AuthLayout } from '@/features/auth/auth-layout';
import { SetPasswordForm } from '@/features/auth/set-password-form';

export const metadata: Metadata = { title: 'Aceitar convite' };

/**
 * Aceite de convite.
 *
 * Destino do link enviado pelo administrador. Ate a fase M2 esta rota nao
 * existia, e o link do e-mail caia em uma pagina de nao encontrado.
 */
export default function ConvitePage() {
  return (
    <AuthLayout
      title="Bem-vindo ao GymFlow"
      description="Defina uma senha para concluir a criação da sua conta."
    >
      <SetPasswordForm mode="convite" submitLabel="Criar minha conta" />
    </AuthLayout>
  );
}
