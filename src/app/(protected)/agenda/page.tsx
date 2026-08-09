import type { Metadata } from 'next';

import { PageHeader } from '@/components/navigation/page-header';
import { ScheduleManager } from '@/features/schedule/schedule-manager';

export const metadata: Metadata = { title: 'Agenda' };

export default function AgendaPage() {
  return (
    <>
      <PageHeader title="Agenda" subtitle="Sua semana de treinos." />
      <ScheduleManager />
    </>
  );
}
