import type { Metadata } from 'next';

import { AuthLayout } from '@/features/auth/auth-layout';
import { SetPasswordForm } from '@/features/auth/set-password-form';

export const metadata: Metadata = { title: 'Redefinir senha' };

export default function RedefinirSenhaPage() {
  return (
    <AuthLayout
      title="Criar nova senha"
      description="Escolha uma senha que você ainda não usou nesta conta."
    >
      <SetPasswordForm mode="recuperacao" submitLabel="Salvar nova senha" />
    </AuthLayout>
  );
}
