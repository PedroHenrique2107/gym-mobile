'use client';

import { RefreshCw } from 'lucide-react';

import { ErrorState } from '@/components/feedback/state-message';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api/problem';
import type { ApiReadinessCheck } from '@/lib/api/health';
import { env } from '@/lib/config/env';

import { useApiHealth, useApiReadiness } from './use-api-status';

/**
 * Diagnostico da conexao com o `gym-service`.
 *
 * Serve ao critério de saida da fase M1 — verificar que o frontend fala com a
 * API — e continua util depois, para distinguir "o app esta com problema" de "a
 * API esta fora". Todo valor exibido vem de uma resposta real.
 */
export function ApiStatusPanel() {
  const health = useApiHealth();
  const readiness = useApiReadiness();

  const isLoading = health.isPending || readiness.isPending;
  const isRefreshing = health.isFetching || readiness.isFetching;

  const refresh = () => {
    void health.refetch();
    void readiness.refetch();
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardTitle>Endereço configurado</CardTitle>
        <CardDescription className="mt-1 break-all">
          {/* Origem da API e valor publico: ja esta no bundle do navegador. */}
          <code>{env.apiUrl}</code>
        </CardDescription>
      </Card>

      {isLoading ? <LoadingCard /> : null}

      {!isLoading && health.isError ? (
        <Card>
          <ErrorState
            title="A API não respondeu"
            description={describeError(health.error)}
            onRetry={refresh}
          />
        </Card>
      ) : null}

      {health.isSuccess ? (
        <Card>
          <div className="flex items-start justify-between gap-3">
            <CardTitle>Servico</CardTitle>
            <Badge variant="success">Respondendo</Badge>
          </div>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <Row label="Versão" value={health.data.version} />
            <Row label="No ar há" value={formatUptime(health.data.uptimeSeconds)} />
          </dl>
        </Card>
      ) : null}

      {readiness.isSuccess ? (
        <Card>
          <div className="flex items-start justify-between gap-3">
            <CardTitle>Dependências</CardTitle>
            <ReadinessBadge status={readiness.data.status} />
          </div>

          <ul className="mt-3 flex flex-col gap-3">
            {readiness.data.checks.map((check) => (
              <CheckRow key={check.name} check={check} />
            ))}
          </ul>

          {readiness.data.status === 'degraded' ? (
            <CardDescription className="mt-4 leading-relaxed">
              Dependências marcadas como não configuradas são esperadas nesta fase: banco de dados e
              Supabase Auth entram na fase S2 do backend.
            </CardDescription>
          ) : null}
        </Card>
      ) : null}

      <Button variant="outline" onClick={refresh} disabled={isRefreshing} className="self-start">
        <RefreshCw className={isRefreshing ? 'animate-spin' : undefined} aria-hidden="true" />
        {isRefreshing ? 'Verificando...' : 'Verificar novamente'}
      </Button>
    </div>
  );
}

function LoadingCard() {
  return (
    // `aria-busy` anuncia o carregamento; os skeletons ficam fora da arvore.
    <Card aria-busy="true">
      <span className="sr-only">Verificando a API...</span>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-2/3" />
    </Card>
  );
}

function Row({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular font-medium">{value}</dd>
    </div>
  );
}

function CheckRow({ check }: { readonly check: ApiReadinessCheck }) {
  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{check.name}</span>
        <CheckBadge status={check.status} />
      </div>
      {check.detail ? <p className="text-xs text-muted-foreground">{check.detail}</p> : null}
    </li>
  );
}

function ReadinessBadge({ status }: { readonly status: 'ready' | 'degraded' | 'not_ready' }) {
  if (status === 'ready') return <Badge variant="success">Pronta</Badge>;
  if (status === 'degraded') return <Badge variant="warning">Parcial</Badge>;
  return <Badge variant="danger">Não pronta</Badge>;
}

function CheckBadge({ status }: { readonly status: ApiReadinessCheck['status'] }) {
  if (status === 'up') return <Badge variant="success">No ar</Badge>;
  if (status === 'unconfigured') return <Badge variant="neutral">Não configurada</Badge>;
  return <Badge variant="danger">Fora</Badge>;
}

/**
 * Mensagem de falha.
 *
 * `ApiError.message` ja e texto seguro: vem do `detail` em pt-BR do backend ou
 * de um fallback local. Erro de outra origem nao tem a mensagem exibida, porque
 * mensagens de rede do navegador citam host e porta.
 */
function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.status === 0
      ? 'Não foi possível alcançar a API. Confirme que o gym-service está rodando no endereço acima.'
      : error.message;
  }

  return 'Falha inesperada ao consultar a API.';
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) return remainingMinutes > 0 ? `${hours} h ${remainingMinutes} min` : `${hours} h`;

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days} d ${remainingHours} h` : `${days} d`;
}
