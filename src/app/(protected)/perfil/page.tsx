import type { Metadata } from 'next';
import Link from 'next/link';

import { NotBuiltYetState } from '@/components/feedback/state-message';
import { PageHeader } from '@/components/navigation/page-header';
import { buttonVariants } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Perfil' };

export default function PerfilPage() {
  return (
    <>
      <PageHeader title="Perfil" subtitle="Seus dados, objetivo e preferencias." />

      <NotBuiltYetState
        feature="O perfil"
        phase="M3"
        description="Dados pessoais, objetivo e preferencias exigem conta autenticada, que entra na fase M2. Exportacao e exclusao de conta vem em M5."
      />

      <div className="mt-4 flex justify-center">
        <Link href="/status" className={buttonVariants({ variant: 'outline' })}>
          Ver status da API
        </Link>
      </div>
    </>
  );
}
