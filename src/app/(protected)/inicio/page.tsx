import type { Metadata } from 'next';

import { NotBuiltYetState } from '@/components/feedback/state-message';
import { PageHeader } from '@/components/navigation/page-header';

export const metadata: Metadata = { title: 'Inicio' };

export default function InicioPage() {
  return (
    <>
      <PageHeader title="Inicio" subtitle="Treino do dia, resumo semanal e ultimo desempenho." />
      <NotBuiltYetState
        feature="O painel de inicio"
        phase="M2"
        description="Treino do dia, resumo semanal e ultimo desempenho dependem de sessao autenticada e de dados reais da API. Nada e exibido aqui antes disso."
      />
    </>
  );
}
