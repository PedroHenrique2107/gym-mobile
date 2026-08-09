import type { Metadata } from 'next';

import { PageHeader } from '@/components/navigation/page-header';
import { ProfileSummary } from '@/features/profile/profile-summary';

export const metadata: Metadata = { title: 'Inicio' };

export default function InicioPage() {
  return (
    <>
      <PageHeader title="Inicio" subtitle="Sua conta e configuracao de treino." />
      <ProfileSummary />
    </>
  );
}
