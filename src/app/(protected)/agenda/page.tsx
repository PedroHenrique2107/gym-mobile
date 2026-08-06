import type { Metadata } from 'next';

import { NotBuiltYetState } from '@/components/feedback/state-message';
import { PageHeader } from '@/components/navigation/page-header';

export const metadata: Metadata = { title: 'Agenda' };

export default function AgendaPage() {
  return (
    <>
      <PageHeader title="Agenda" subtitle="Sua semana de treinos." />
      <NotBuiltYetState
        feature="A agenda semanal"
        phase="M3"
        description="Recorrencia por dia da semana, reagendamento e dias de descanso dependem dos endpoints de agenda do backend, que entram na fase S3."
      />
    </>
  );
}
