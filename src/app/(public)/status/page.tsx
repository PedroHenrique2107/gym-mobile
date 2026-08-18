import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

import { PageHeader } from '@/components/navigation/page-header';
import { ApiStatusPanel } from '@/features/system/api-status-panel';

export const metadata: Metadata = { title: 'Status da API' };

/**
 * Diagnostico de conexao.
 *
 * Publica de proposito: e usada justamente quando a autenticacao nao funciona, e
 * exigir login para diagnosticar seria circular. Nao expoe nenhum dado de
 * usuario — apenas versao, tempo no ar e quais dependencias estao configuradas.
 */
export default function StatusPage() {
  return (
    <main id="conteudo" className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8">
      <Link
        href="/"
        className="tap mb-4 -ml-2 inline-flex items-center gap-1.5 self-start rounded-lg px-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Início
      </Link>

      <PageHeader
        title="Status da API"
        subtitle="Estado atual do gym-service, consultado em tempo real."
      />

      <ApiStatusPanel />
    </main>
  );
}
