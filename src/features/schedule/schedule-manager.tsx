'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, RotateCcw } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { DateInput } from '@/components/forms/date-input';
import { FormField } from '@/components/forms/form-field';
import { ErrorState } from '@/components/feedback/state-message';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import type { components } from '@/lib/api/generated/types';
import { describeApiError, requireApiData, requireApiSuccess } from '@/lib/api/result';
import { addCivilDays, formatCivilDate, todayCivil } from '@/lib/dates/civil-date';

import { workoutKeys } from '@/features/workouts/workout-manager';

type WeeklyDay = components['schemas']['WeeklyScheduleDayResponse'];
type ScheduleDay = components['schemas']['ScheduleDayResponse'];
type OverrideKind = components['schemas']['ScheduleOverrideKind'];
type SetOverrideRequest = components['schemas']['SetScheduleOverrideRequest'];

const WEEKDAY_NAMES = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado', 'Domingo'];

const scheduleKeys = {
  all: ['schedule'] as const,
  weekly: ['schedule', 'weekly'] as const,
  resolved: (from: string, to: string) => ['schedule', 'resolved', from, to] as const,
};

export function ScheduleManager() {
  const from = todayCivil();
  const to = addCivilDays(from, 13);
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(from);
  const [kind, setKind] = useState<OverrideKind>('REST');
  const [workoutId, setWorkoutId] = useState('');
  const [movedToDate, setMovedToDate] = useState(addCivilDays(from, 1));
  const [notes, setNotes] = useState('');

  const weekly = useQuery({
    queryKey: scheduleKeys.weekly,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/schedule/weekly');
      return requireApiData(data, error, 'carregar a semana');
    },
  });

  const resolved = useQuery({
    queryKey: scheduleKeys.resolved(from, to),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/schedule', {
        params: { query: { from, to } },
      });
      return requireApiData(data, error, 'carregar a agenda');
    },
  });

  const workouts = useQuery({
    queryKey: workoutKeys.list,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/workouts');
      return requireApiData(data, error, 'carregar as fichas');
    },
  });

  const invalidate = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
  };

  const setWeekly = useMutation({
    mutationFn: async ({ day, nextWorkoutId }: { day: WeeklyDay; nextWorkoutId: string }) => {
      if (!nextWorkoutId) {
        const { error } = await apiClient.DELETE('/api/v1/schedule/weekly/{weekday}', {
          params: { path: { weekday: day.weekday } },
        });
        requireApiSuccess(error, 'liberar o dia da semana');
        return;
      }

      const { error } = await apiClient.PUT('/api/v1/schedule/weekly/{weekday}', {
        params: {
          path: { weekday: day.weekday },
          ...(day.version === null ? {} : { header: { 'If-Match': `"${day.version}"` } }),
        },
        body: { workoutId: nextWorkoutId },
      });
      requireApiSuccess(error, 'definir o dia da semana');
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Agenda semanal atualizada.');
    },
    onError: (error) => toast.error(describeApiError(error, 'Nao foi possivel alterar a semana.')),
  });

  const saveOverride = useMutation({
    mutationFn: async (body: SetOverrideRequest) => {
      const currentOverride = resolved.data?.days.find(
        (day) => day.date === selectedDate,
      )?.override;
      const { data, error } = await apiClient.PUT('/api/v1/schedule/overrides/{date}', {
        params: {
          path: { date: selectedDate },
          ...(currentOverride ? { header: { 'If-Match': `"${currentOverride.version}"` } } : {}),
        },
        body,
      });
      return requireApiData(data, error, 'salvar a excecao');
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Excecao da agenda salva.');
    },
    onError: (error) => toast.error(describeApiError(error, 'Nao foi possivel salvar a excecao.')),
  });

  const removeOverride = useMutation({
    mutationFn: async (date: string) => {
      const { error } = await apiClient.DELETE('/api/v1/schedule/overrides/{date}', {
        params: { path: { date } },
      });
      requireApiSuccess(error, 'remover a excecao');
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('O dia voltou a seguir a agenda semanal.');
    },
    onError: (error) => toast.error(describeApiError(error, 'Nao foi possivel remover a excecao.')),
  });

  function editDay(day: ScheduleDay): void {
    setSelectedDate(day.date);
    setKind(day.override?.kind ?? 'REST');
    setWorkoutId(day.override?.workout?.id ?? '');
    setMovedToDate(day.override?.movedToDate ?? addCivilDays(day.date, 1));
    setNotes(day.override?.notes ?? '');
    document.getElementById('schedule-exception')?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleOverride(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const body: SetOverrideRequest = {
      kind,
      notes: notes.trim() || null,
      ...(kind === 'REPLACED' ? { workoutId } : {}),
      ...(kind === 'RESCHEDULED' ? { movedToDate } : {}),
    };
    saveOverride.mutate(body);
  }

  const queryError = weekly.error ?? resolved.error ?? workouts.error;

  if (queryError) {
    return (
      <Card>
        <ErrorState
          title="Nao foi possivel carregar a agenda"
          description={describeApiError(queryError, 'Falha inesperada ao carregar a agenda.')}
          onRetry={() => {
            void weekly.refetch();
            void resolved.refetch();
            void workouts.refetch();
          }}
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="weekly-title" className="flex flex-col gap-3">
        <div>
          <h2 id="weekly-title" className="text-lg font-semibold">
            Semana recorrente
          </h2>
          <p className="text-sm text-muted-foreground">A ficha que se repete em cada dia.</p>
        </div>
        {weekly.isPending ? <Card aria-busy="true">Carregando semana...</Card> : null}
        {weekly.data?.days.map((day) => (
          <Card key={day.weekday} className="flex items-center justify-between gap-3 py-3">
            <label htmlFor={`weekday-${day.weekday}`} className="w-20 text-sm font-semibold">
              {WEEKDAY_NAMES[day.weekday - 1]}
            </label>
            <Select
              id={`weekday-${day.weekday}`}
              value={day.workout?.id ?? ''}
              disabled={setWeekly.isPending || workouts.isPending}
              onChange={(event) => {
                const nextWorkoutId = event.target.value;
                if (!nextWorkoutId && day.workout) {
                  if (!window.confirm(`Deixar ${WEEKDAY_NAMES[day.weekday - 1]} sem treino?`)) {
                    return;
                  }
                }
                setWeekly.mutate({ day, nextWorkoutId });
              }}
            >
              <option value="">Dia livre</option>
              {workouts.data?.data.map((workout) => (
                <option key={workout.id} value={workout.id}>
                  {workout.name}
                </option>
              ))}
            </Select>
          </Card>
        ))}
      </section>

      <section aria-labelledby="resolved-title" className="flex flex-col gap-3">
        <div>
          <h2 id="resolved-title" className="text-lg font-semibold">
            Proximos 14 dias
          </h2>
          <p className="text-sm text-muted-foreground">
            Semana combinada com descansos, trocas e reagendamentos.
          </p>
        </div>
        {resolved.isPending ? <Card aria-busy="true">Resolvendo agenda...</Card> : null}
        {resolved.data?.days.map((day) => (
          <Card key={day.date} className="flex flex-col gap-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{formatCivilDate(day.date)}</CardTitle>
                <CardDescription className="mt-1">
                  {day.items.length === 0
                    ? day.isRest
                      ? 'Descanso marcado'
                      : 'Sem treino planejado'
                    : day.items.map((item) => item.workout.name).join(' + ')}
                </CardDescription>
              </div>
              <div className="flex flex-wrap justify-end gap-1">
                {day.isRest ? <Badge variant="warning">Descanso</Badge> : null}
                {day.override ? <Badge variant="primary">Excecao</Badge> : null}
              </div>
            </div>
            {day.items.map((item) => (
              <p
                key={`${item.workout.id}-${item.movedFromDate ?? day.date}`}
                className="text-xs text-muted-foreground"
              >
                {originLabel(item.origin, item.movedFromDate ?? null)}
              </p>
            ))}
            <Button variant="outline" size="sm" onClick={() => editDay(day)}>
              <CalendarDays /> Ajustar este dia
            </Button>
          </Card>
        ))}
      </section>

      <section id="schedule-exception" aria-labelledby="exception-title">
        <Card>
          <form onSubmit={handleOverride} className="flex flex-col gap-3">
            <div>
              <CardTitle id="exception-title">Excecao por data</CardTitle>
              <CardDescription className="mt-1">
                Marque descanso, troque a ficha ou mova o treino para outra data.
              </CardDescription>
            </div>
            <FormField id="exception-date" label="Data">
              <DateInput
                id="exception-date"
                value={selectedDate}
                onChange={(event) => {
                  const day = resolved.data?.days.find(
                    (entry) => entry.date === event.target.value,
                  );
                  if (day) editDay(day);
                  else setSelectedDate(event.target.value);
                }}
                required
              />
            </FormField>
            <FormField id="exception-kind" label="Acao">
              <Select
                id="exception-kind"
                value={kind}
                onChange={(event) => setKind(event.target.value as OverrideKind)}
              >
                <option value="REST">Marcar descanso</option>
                <option value="REPLACED">Trocar a ficha</option>
                <option value="RESCHEDULED">Reagendar</option>
              </Select>
            </FormField>
            {kind === 'REPLACED' ? (
              <FormField id="exception-workout" label="Nova ficha">
                <Select
                  id="exception-workout"
                  value={workoutId}
                  onChange={(event) => setWorkoutId(event.target.value)}
                  required
                >
                  <option value="">Selecione</option>
                  {workouts.data?.data.map((workout) => (
                    <option key={workout.id} value={workout.id}>
                      {workout.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            ) : null}
            {kind === 'RESCHEDULED' ? (
              <FormField id="exception-moved" label="Mover para">
                <DateInput
                  id="exception-moved"
                  value={movedToDate}
                  onChange={(event) => setMovedToDate(event.target.value)}
                  required
                />
              </FormField>
            ) : null}
            <FormField id="exception-notes" label="Observacao">
              <Textarea
                id="exception-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={300}
              />
            </FormField>
            <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
              <Button
                variant="outline"
                disabled={
                  removeOverride.isPending ||
                  !resolved.data?.days.some((day) => day.date === selectedDate && day.override)
                }
                onClick={() => {
                  if (window.confirm('Remover a excecao e voltar a seguir a semana?')) {
                    removeOverride.mutate(selectedDate);
                  }
                }}
              >
                <RotateCcw /> Remover
              </Button>
              <Button
                type="submit"
                disabled={
                  saveOverride.isPending ||
                  (kind === 'REPLACED' && !workoutId) ||
                  (kind === 'RESCHEDULED' && !movedToDate)
                }
              >
                {saveOverride.isPending ? 'Salvando...' : 'Salvar excecao'}
              </Button>
            </div>
          </form>
        </Card>
      </section>
    </div>
  );
}

function originLabel(
  origin: components['schemas']['ScheduleItemOrigin'],
  movedFrom: string | null,
): string {
  if (origin === 'RECURRING') return 'Vem da semana recorrente.';
  if (origin === 'REPLACED') return 'Ficha substituida somente nesta data.';
  return `Reagendado de ${movedFrom ? formatCivilDate(movedFrom) : 'outra data'}.`;
}
