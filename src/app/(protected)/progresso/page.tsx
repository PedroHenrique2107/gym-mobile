import type { Metadata } from 'next';

import { NotBuiltYetState } from '@/components/feedback/state-message';
import { PageHeader } from '@/components/navigation/page-header';

export const metadata: Metadata = { title: 'Progresso' };

export default function ProgressoPage() {
  return (
    <>
      <PageHeader title="Progresso" subtitle="Historico, recordes e medidas." />
      <NotBuiltYetState
        feature="O progresso"
        phase="M5"
        description="Graficos e recordes exigem sessoes de treino realmente registradas. Exibir um grafico antes disso mostraria uma evolucao que nao aconteceu."
      />
    </>
  );
}
