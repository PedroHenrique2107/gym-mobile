import type { Metadata } from 'next';

import { PageHeader } from '@/components/navigation/page-header';
import { ProgressDashboard } from '@/features/progress/progress-dashboard';

export const metadata: Metadata = { title: 'Progresso' };

export default function ProgressoPage() {
  return (
    <>
      <PageHeader title="Progresso" subtitle="Histórico, recordes e medidas." />
      <ProgressDashboard />
    </>
  );
}
