import type { Metadata } from 'next';

import { PageHeader } from '@/components/navigation/page-header';
import { ProfileSummary } from '@/features/profile/profile-summary';

export const metadata: Metadata = { title: 'Início' };

export default function InicioPage() {
  return (
    <>
      <PageHeader title="Início" subtitle="Sua conta e configuração de treino." />
      <ProfileSummary />
    </>
  );
}
