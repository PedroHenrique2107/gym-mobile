'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Dumbbell,
  Flame,
  Pencil,
  Trash2,
  Trophy,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ExerciseSetsModal, type ExerciseSetInput } from '@/features/sessions/exercise-sets-modal';
import { apiClient } from '@/lib/api/client';
import type { components } from '@/lib/api/generated/types';
import { describeApiError, requireApiData, requireApiSuccess } from '@/lib/api/result';
import { addCivilDays, formatCivilDate, todayCivil } from '@/lib/dates/civil-date';

type Summary = components['schemas']['ProgressSummaryResponse'];
type ExerciseRecord = components['schemas']['ExerciseRecordResponse'];
type ExerciseHistory = components['schemas']['ExerciseHistoryResponse'];
type Session = components['schemas']['SessionSummaryResponse'];
type SessionDetail = components['schemas']['SessionDetailResponse'];

export const progressKeys = {
  all: ['progress'] as const,
  overview: ['progress', 'overview'] as const,
  measurements: ['progress', 'measurements'] as const,
  photos: ['progress', 'photos'] as const,
};

export function ProgressOverview() {
  const queryClient = useQueryClient();
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
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
  const removeSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await apiClient.DELETE('/api/v1/sessions/{sessionId}', {
        params: { path: { sessionId } },
      });
      requireApiSuccess(error, 'excluir o treino');
    },
    onSuccess: async (_, sessionId) => {
      if (selectedSessionId === sessionId) setSelectedSessionId(null);
      await queryClient.invalidateQueries({ queryKey: progressKeys.overview });
      toast.success('Treino e todas as séries foram excluídos.');
    },
    onError: (error) => toast.error(describeApiError(error, 'Não foi possível excluir o treino.')),
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

      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
        <MetricCard
          icon={<Dumbbell />}
          label="Treinos concluídos"
          value={summary.completedSessions}
          hint="nos últimos 90 dias"
          tone="primary"
        />
        <MetricCard
          icon={<Flame />}
          label="Ofensiva diária"
          value={`${summary.dailyStreak} ${summary.dailyStreak === 1 ? 'dia' : 'dias'}`}
          hint={
            summary.dailyStreak > 0
              ? 'Treine hoje para continuar'
              : 'Conclua um treino para começar'
          }
          tone="lime"
          streak={summary.dailyStreak}
        />
        <MetricCard
          icon={<Trophy />}
          label="Volume total"
          value={`${summary.totalVolumeKg} kg`}
          hint="carga × repetições"
          tone="amber"
        />
        <MetricCard
          icon={<Clock3 />}
          label="Tempo em treino"
          value={`${summary.totalMinutes} min`}
          hint="tempo acumulado"
          tone="sky"
        />
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
                  <div className="min-w-0">
                    <p className="font-medium">{record.exerciseName}</p>
                    <p className="text-xs text-muted-foreground">
                      Melhor série: {record.maxWeightKg} kg × {record.maxWeightReps} rep.
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-right text-base font-bold tabular text-primary">
                    {record.maxWeightKg} kg <ChevronDown className="size-4" />
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
              <li key={session.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{session.templateName}</p>
                    <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="size-3" />
                      {session.plannedDate
                        ? formatCivilDate(session.plannedDate)
                        : new Intl.DateTimeFormat('pt-BR').format(new Date(session.startedAt))}
                      {' · '}
                      {session.workingSets} séries
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <p className="font-semibold tabular">{session.totalVolumeKg} kg</p>
                    <p className="text-xs text-muted-foreground">{sessionStatus(session.status)}</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                  {session.status === 'COMPLETED' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      aria-expanded={selectedSessionId === session.id}
                      onClick={() =>
                        setSelectedSessionId((current) =>
                          current === session.id ? null : session.id,
                        )
                      }
                    >
                      <Pencil />{' '}
                      {selectedSessionId === session.id ? 'Fechar edição' : 'Editar treino'}
                    </Button>
                  ) : null}
                  <Button
                    className={
                      session.status === 'COMPLETED' ? undefined : 'min-[360px]:col-span-2'
                    }
                    size="sm"
                    variant="destructive"
                    disabled={removeSession.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Excluir definitivamente "${session.templateName}" e todas as séries?`,
                        )
                      ) {
                        removeSession.mutate(session.id);
                      }
                    }}
                  >
                    <Trash2 /> Excluir treino
                  </Button>
                </div>
                {selectedSessionId === session.id ? (
                  <HistorySessionEditor sessionId={session.id} />
                ) : null}
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
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HistorySessionEditor({ sessionId }: { readonly sessionId: string }) {
  const detail = useQuery({
    queryKey: ['sessions', 'history', sessionId],
    queryFn: () => loadHistorySession(sessionId),
  });

  if (detail.isPending) {
    return <p className="mt-3 text-sm text-muted-foreground">Abrindo treino...</p>;
  }
  if (detail.isError) {
    return (
      <p role="alert" className="mt-3 text-sm text-destructive">
        {describeApiError(detail.error, 'Não foi possível abrir este treino.')}
      </p>
    );
  }

  return (
    <HistorySessionEditorContent
      key={`${detail.data.id}:${detail.data.version}`}
      sessionId={sessionId}
      initialDetail={detail.data}
    />
  );
}

function HistorySessionEditorContent({
  sessionId,
  initialDetail,
}: {
  readonly sessionId: string;
  readonly initialDetail: SessionDetail;
}) {
  const queryClient = useQueryClient();
  const [plannedDate, setPlannedDate] = useState(
    initialDetail.plannedDate ?? initialDetail.startedAt.slice(0, 10),
  );
  const [notes, setNotes] = useState(initialDetail.notes ?? '');
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const detail = useQuery({
    queryKey: ['sessions', 'history', sessionId],
    queryFn: () => loadHistorySession(sessionId),
    initialData: initialDetail,
  });

  const updateMetadata = useMutation({
    mutationFn: async () => {
      const { data, error } = await apiClient.PATCH('/api/v1/sessions/{sessionId}', {
        params: { path: { sessionId } },
        body: { plannedDate: plannedDate || null, notes: notes.trim() || null },
      });
      return requireApiData(data, error, 'corrigir o treino concluído');
    },
    onSuccess: async (updated) => {
      queryClient.setQueryData(['sessions', 'history', sessionId], updated);
      await queryClient.invalidateQueries({ queryKey: progressKeys.overview });
      toast.success('Histórico atualizado.');
    },
    onError: (error) =>
      toast.error(describeApiError(error, 'Não foi possível atualizar o histórico.')),
  });

  const updateSets = useMutation({
    mutationFn: async ({
      sessionExerciseId,
      sets,
    }: {
      sessionExerciseId: string;
      sets: ExerciseSetInput[];
    }) => {
      const { data, error } = await apiClient.PUT(
        '/api/v1/sessions/{sessionId}/exercises/{sessionExerciseId}/sets',
        {
          params: { path: { sessionId, sessionExerciseId } },
          body: { sets },
        },
      );
      return requireApiData(data, error, 'corrigir as séries do histórico');
    },
    onSuccess: async (updated) => {
      queryClient.setQueryData(['sessions', 'history', sessionId], updated);
      setEditingExerciseId(null);
      await queryClient.invalidateQueries({ queryKey: progressKeys.overview });
      toast.success('Séries corrigidas e indicadores recalculados.');
    },
    onError: (error) =>
      toast.error(describeApiError(error, 'Não foi possível corrigir as séries.')),
  });

  const editingExercise = detail.data.exercises.find((item) => item.id === editingExerciseId);

  return (
    <div className="mt-3 flex min-w-0 flex-col gap-3 rounded-xl bg-secondary/30 p-3">
      <FormField id={`history-date-${sessionId}`} label="Data do treino">
        <Input
          id={`history-date-${sessionId}`}
          type="date"
          value={plannedDate}
          onChange={(event) => setPlannedDate(event.target.value)}
        />
      </FormField>
      <FormField id={`history-notes-${sessionId}`} label="Observações">
        <Textarea
          id={`history-notes-${sessionId}`}
          value={notes}
          maxLength={1000}
          onChange={(event) => setNotes(event.target.value)}
        />
      </FormField>
      <Button disabled={updateMetadata.isPending} onClick={() => updateMetadata.mutate()}>
        {updateMetadata.isPending ? 'Salvando...' : 'Salvar data e observações'}
      </Button>

      <div className="border-t border-border pt-3">
        <p className="mb-2 text-sm font-semibold">Exercícios e séries</p>
        <div className="flex flex-col gap-2">
          {detail.data.exercises.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              className="tap flex min-w-0 items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-left"
              onClick={() => setEditingExerciseId(exercise.id)}
            >
              <span className="min-w-0 truncate text-sm">{exercise.exerciseName}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {exercise.sets.length} séries · editar
              </span>
            </button>
          ))}
        </div>
      </div>

      {editingExercise ? (
        <ExerciseSetsModal
          open
          exercise={editingExercise}
          pending={updateSets.isPending}
          onClose={() => setEditingExerciseId(null)}
          onSubmit={(sets) => updateSets.mutate({ sessionExerciseId: editingExercise.id, sets })}
        />
      ) : null}
    </div>
  );
}

async function loadHistorySession(sessionId: string): Promise<SessionDetail> {
  const { data, error } = await apiClient.GET('/api/v1/sessions/{sessionId}', {
    params: { path: { sessionId } },
  });
  return requireApiData(data, error, 'abrir o treino concluído');
}

function MetricCard({
  icon,
  label,
  value,
  hint,
  tone,
  streak,
}: {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: React.ReactNode;
  readonly hint: string;
  readonly tone: 'primary' | 'lime' | 'amber' | 'sky';
  readonly streak?: number;
}) {
  const toneClasses = {
    primary: 'from-primary/18 text-primary',
    lime: 'from-lime-400/18 text-lime-400',
    amber: 'from-amber-400/18 text-amber-400',
    sky: 'from-sky-400/18 text-sky-400',
  }[tone];

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br ${toneClasses} to-transparent`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-background/70 shadow-sm [&_svg]:size-5">
          {icon}
        </span>
        {streak !== undefined ? (
          <div className="flex gap-1" aria-label={`${streak} dias consecutivos`}>
            {Array.from({ length: 7 }, (_, index) => (
              <span
                key={index}
                className={`size-1.5 rounded-full ${index < Math.min(streak, 7) ? 'bg-current' : 'bg-current/20'}`}
              />
            ))}
          </div>
        ) : null}
      </div>
      <p className="text-2xl font-black tracking-tight tabular text-foreground">{value}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}

function sessionStatus(status: Session['status']): string {
  return { ACTIVE: 'Em andamento', COMPLETED: 'Concluido', ABANDONED: 'Abandonado' }[status];
}
