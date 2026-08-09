'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronDown, Clock3, Dumbbell, Flame, Trophy } from 'lucide-react';
import { useState } from 'react';

import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api/client';
import type { components } from '@/lib/api/generated/types';
import { describeApiError, requireApiData } from '@/lib/api/result';
import { addCivilDays, formatCivilDate, todayCivil } from '@/lib/dates/civil-date';

type Summary = components['schemas']['ProgressSummaryResponse'];
type ExerciseRecord = components['schemas']['ExerciseRecordResponse'];
type ExerciseHistory = components['schemas']['ExerciseHistoryResponse'];
type Session = components['schemas']['SessionSummaryResponse'];

export const progressKeys = {
  all: ['progress'] as const,
  overview: ['progress', 'overview'] as const,
  measurements: ['progress', 'measurements'] as const,
  photos: ['progress', 'photos'] as const,
};

export function ProgressOverview() {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const to = todayCivil();
  const from = addCivilDays(to, -89);
  const overview = useQuery({
    queryKey: [...progressKeys.overview, from, to],
    queryFn: async (): Promise<{
      summary: Summary;
      records: ExerciseRecord[];
      sessions: Session[];
    }> => {
      const [summaryResult, recordsResult, sessionsResult] = await Promise.all([
        apiClient.GET('/api/v1/progress/summary', { params: { query: { from, to } } }),
        apiClient.GET('/api/v1/progress/records'),
        apiClient.GET('/api/v1/sessions', {
          params: { query: { from, to, limit: 10, offset: 0 } },
        }),
      ]);

      return {
        summary: requireApiData(summaryResult.data, summaryResult.error, 'carregar os indicadores'),
        records: requireApiData(recordsResult.data, recordsResult.error, 'carregar os recordes')
          .data,
        sessions: requireApiData(sessionsResult.data, sessionsResult.error, 'carregar o historico')
          .data,
      };
    },
  });
  const history = useQuery({
    queryKey: [...progressKeys.overview, 'exercise', selectedExerciseId],
    enabled: selectedExerciseId !== null,
    queryFn: async (): Promise<ExerciseHistory> => {
      if (!selectedExerciseId) throw new Error('Selecione um exercicio.');
      const { data, error } = await apiClient.GET(
        '/api/v1/progress/exercises/{exerciseId}/history',
        { params: { path: { exerciseId: selectedExerciseId }, query: { limit: 30 } } },
      );
      return requireApiData(data, error, 'carregar a evolucao do exercicio');
    },
  });

  if (overview.isPending) return <Card aria-busy="true">Calculando seu progresso...</Card>;

  if (overview.isError) {
    return (
      <Card className="border-destructive/30">
        <p role="alert" className="text-sm text-destructive">
          {describeApiError(overview.error, 'Nao foi possivel carregar seu progresso.')}
        </p>
        <button
          className="tap mt-2 text-sm font-semibold text-primary"
          onClick={() => void overview.refetch()}
        >
          Tentar novamente
        </button>
      </Card>
    );
  }

  const { summary, records, sessions } = overview.data;

  return (
    <section aria-labelledby="progress-overview-title" className="flex flex-col gap-4">
      <div>
        <h2 id="progress-overview-title" className="text-lg font-semibold">
          Ultimos 90 dias
        </h2>
        <p className="text-sm text-muted-foreground">
          De {formatCivilDate(summary.from)} a {formatCivilDate(summary.to)}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard icon={<Dumbbell />} label="Treinos" value={summary.completedSessions} />
        <MetricCard icon={<Flame />} label="Sequencia" value={`${summary.weeklyStreak} sem.`} />
        <MetricCard icon={<Trophy />} label="Volume" value={`${summary.totalVolumeKg} kg`} />
        <MetricCard icon={<Clock3 />} label="Tempo" value={`${summary.totalMinutes} min`} />
      </div>

      <Card>
        <CardTitle>Recordes pessoais</CardTitle>
        <CardDescription className="mt-1">
          Series de aquecimento nao entram nos calculos.
        </CardDescription>
        {records.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Conclua um treino com series de trabalho para criar seus primeiros recordes.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {records.map((record) => (
              <li key={record.exerciseId} className="py-3 first:pt-0 last:pb-0">
                <button
                  type="button"
                  className="tap flex w-full items-start justify-between gap-3 text-left"
                  aria-expanded={selectedExerciseId === record.exerciseId}
                  onClick={() =>
                    setSelectedExerciseId((current) =>
                      current === record.exerciseId ? null : record.exerciseId,
                    )
                  }
                >
                  <div>
                    <p className="font-medium">{record.exerciseName}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.maxWeightKg} kg x {record.maxWeightReps} rep. · max. {record.maxReps}{' '}
                      rep.
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-right text-sm font-semibold tabular">
                    {record.maxSessionVolumeKg} kg <ChevronDown className="size-4" />
                  </span>
                </button>
                {selectedExerciseId === record.exerciseId ? (
                  <ExerciseHistoryDetails
                    history={history.data}
                    error={history.error}
                    loading={history.isPending}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>Historico recente</CardTitle>
        <CardDescription className="mt-1">Os dez treinos mais recentes do periodo.</CardDescription>
        {sessions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nenhum treino registrado no periodo.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-medium">{session.templateName}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="size-3" />
                    {session.plannedDate
                      ? formatCivilDate(session.plannedDate)
                      : new Intl.DateTimeFormat('pt-BR').format(new Date(session.startedAt))}
                    {' · '}
                    {session.workingSets} series
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold tabular">{session.totalVolumeKg} kg</p>
                  <p className="text-xs text-muted-foreground">{sessionStatus(session.status)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}

function ExerciseHistoryDetails({
  history,
  error,
  loading,
}: {
  readonly history?: ExerciseHistory;
  readonly error: Error | null;
  readonly loading: boolean;
}) {
  if (loading) return <p className="mt-2 text-xs text-muted-foreground">Carregando evolucao...</p>;
  if (error) {
    return (
      <p role="alert" className="mt-2 text-xs text-destructive">
        {describeApiError(error, 'Nao foi possivel carregar esta evolucao.')}
      </p>
    );
  }
  if (!history || history.points.length === 0) return null;

  return (
    <div className="mt-2 rounded-lg bg-secondary/40 p-3">
      <p className="mb-2 text-xs font-semibold">Ultimas {history.points.length} execucoes</p>
      <ul className="flex flex-col gap-2">
        {[...history.points].reverse().map((point) => (
          <li key={point.sessionId} className="flex justify-between gap-3 text-xs">
            <span className="text-muted-foreground">
              {new Intl.DateTimeFormat('pt-BR').format(new Date(point.performedAt))}
            </span>
            <span className="text-right tabular">
              {point.topWeightKg} kg x {point.topWeightReps} · {point.volumeKg} kg
              {point.maxRpe ? ` · RPE ${point.maxRpe}` : ''}
              {point.maxPain !== null && point.maxPain !== undefined
                ? ` · Dor ${point.maxPain}`
                : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-2 flex items-center gap-2 text-primary [&_svg]:size-4">{icon}</div>
      <p className="text-xl font-bold tabular">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

function sessionStatus(status: Session['status']): string {
  return { ACTIVE: 'Em andamento', COMPLETED: 'Concluido', ABANDONED: 'Abandonado' }[status];
}
