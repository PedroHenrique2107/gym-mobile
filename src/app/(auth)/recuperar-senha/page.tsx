import Link from 'next/link';
import type { Metadata } from 'next';

import { AuthLayout } from '@/features/auth/auth-layout';
import { RecoverPasswordForm } from '@/features/auth/recover-password-form';

export const metadata: Metadata = { title: 'Recuperar senha' };

export default function RecuperarSenhaPage() {
  return (
    <AuthLayout
      title="Recuperar senha"
      description="Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha."
      footer={
        <Link href="/entrar" className="text-primary underline-offset-4 hover:underline">
          Voltar para o login
        </Link>
      }
    >
      <RecoverPasswordForm />
    </AuthLayout>
  );
}
