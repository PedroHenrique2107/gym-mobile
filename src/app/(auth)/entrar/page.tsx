import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

import { AuthLayout } from '@/features/auth/auth-layout';
import { LoginForm } from '@/features/auth/login-form';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = { title: 'Entrar' };

/**
 * Login.
 *
 * `Suspense` em volta do formulario porque ele le `useSearchParams`, e o Next
 * exige a fronteira para conseguir gerar a pagina estaticamente. Sem ela, a rota
 * inteira viraria dinamica e o build acusaria erro.
 */
export default function EntrarPage() {
  return (
    <AuthLayout
      title="Entrar"
      description="Use o e-mail e a senha da sua conta do GymFlow."
      footer={
        <Link href="/recuperar-senha" className="text-primary underline-offset-4 hover:underline">
          Esqueci minha senha
        </Link>
      }
    >
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
