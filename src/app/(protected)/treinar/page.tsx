import type { Metadata } from 'next';

import { NotBuiltYetState } from '@/components/feedback/state-message';
import { PageHeader } from '@/components/navigation/page-header';

export const metadata: Metadata = { title: 'Treinar' };

export default function TreinarPage() {
  return (
    <>
      <PageHeader title="Treinar" subtitle="Selecione uma ficha para comecar." />
      <NotBuiltYetState
        feature="A selecao de treino"
        phase="M3"
        description="Fichas, biblioteca de exercicios e inicio de sessao entram nas fases M3 e M4. A execucao do treino, com series e cronometro, vem em M4."
      />
    </>
  );
}
