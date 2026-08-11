'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { FormField } from '@/components/forms/form-field';
import { DecimalInput } from '@/components/forms/numeric-input';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import type { components } from '@/lib/api/generated/types';
import { describeApiError, requireApiData, requireApiSuccess } from '@/lib/api/result';
import { formatCivilDate, todayCivil } from '@/lib/dates/civil-date';

import { progressKeys } from './progress-overview';

type Measurement = components['schemas']['BodyMeasurementResponse'];
type CreateMeasurement = components['schemas']['CreateBodyMeasurementRequest'];
type MetricKey = Exclude<keyof CreateMeasurement, 'measuredOn' | 'notes'>;

const METRICS: readonly [MetricKey, string, string][] = [
  ['weightKg', 'Peso', 'kg'],
  ['bodyFatPercentage', 'Gordura corporal', '%'],
  ['neckCm', 'Pescoco', 'cm'],
  ['chestCm', 'Torax', 'cm'],
  ['waistCm', 'Cintura', 'cm'],
  ['hipsCm', 'Quadril', 'cm'],
  ['leftArmCm', 'Braco esquerdo', 'cm'],
  ['rightArmCm', 'Braco direito', 'cm'],
  ['leftThighCm', 'Coxa esquerda', 'cm'],
  ['rightThighCm', 'Coxa direita', 'cm'],
  ['leftCalfCm', 'Panturrilha esquerda', 'cm'],
  ['rightCalfCm', 'Panturrilha direita', 'cm'],
];

type FormValues = Record<MetricKey, string> & { measuredOn: string; notes: string };

const emptyForm = (): FormValues =>
  ({
    measuredOn: todayCivil(),
    notes: '',
    ...Object.fromEntries(METRICS.map(([key]) => [key, ''])),
  }) as FormValues;

export function MeasurementsPanel() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Measurement | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);

  const measurements = useQuery({
    queryKey: progressKeys.measurements,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/progress/measurements', {
        params: { query: { limit: 100 } },
      });
      return requireApiData(data, error, 'carregar as medidas');
    },
  });

  const save = useMutation({
    mutationFn: async (body: CreateMeasurement) => {
      if (editing) {
        const { data, error } = await apiClient.PATCH(
          '/api/v1/progress/measurements/{measurementId}',
          {
            params: {
              path: { measurementId: editing.id },
              header: { 'If-Match': String(editing.version) },
            },
            body,
          },
        );
        return requireApiData(data, error, 'atualizar as medidas');
      }

      const { data, error } = await apiClient.POST('/api/v1/progress/measurements', { body });
      return requireApiData(data, error, 'registrar as medidas');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: progressKeys.measurements });
      setEditing(null);
      setForm(emptyForm());
      toast.success('Avaliacao corporal salva.');
    },
    onError: async (error) => {
      await queryClient.invalidateQueries({ queryKey: progressKeys.measurements });
      toast.error(describeApiError(error, 'Nao foi possivel salvar as medidas.'));
    },
  });

  const remove = useMutation({
    mutationFn: async (measurementId: string) => {
      const { error } = await apiClient.DELETE('/api/v1/progress/measurements/{measurementId}', {
        params: { path: { measurementId } },
      });
      requireApiSuccess(error, 'excluir as medidas');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: progressKeys.measurements });
      toast.success('Avaliacao corporal excluida.');
    },
    onError: (error) =>
      toast.error(describeApiError(error, 'Nao foi possivel excluir as medidas.')),
  });

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const body = Object.fromEntries([
      ['measuredOn', form.measuredOn],
      ['notes', form.notes.trim() || null],
      ...METRICS.map(([key]) => [key, form[key] ? form[key].replace(',', '.') : null]),
    ]) as CreateMeasurement;
    save.mutate(body);
  }

  function edit(measurement: Measurement): void {
    setEditing(measurement);
    setForm({
      measuredOn: measurement.measuredOn,
      notes: measurement.notes ?? '',
      ...Object.fromEntries(METRICS.map(([key]) => [key, measurement[key] ?? ''])),
    } as FormValues);
  }

  const data = measurements.data?.data ?? [];

  return (
    <section aria-labelledby="measurements-title" className="flex flex-col gap-4">
      <Card>
        <CardTitle id="measurements-title">Medidas corporais</CardTitle>
        <CardDescription className="mt-1">
          Preencha somente o que mediu. Os valores ficam no seu historico real.
        </CardDescription>
        <form className="mt-4 flex flex-col gap-3" onSubmit={submit}>
          <FormField id="measurement-date" label="Data da avaliacao">
            <Input
              id="measurement-date"
              type="date"
              value={form.measuredOn}
              max={todayCivil()}
              onChange={(event) =>
                setForm((current) => ({ ...current, measuredOn: event.target.value }))
              }
              required
            />
          </FormField>
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
            {METRICS.map(([key, label, unit]) => (
              <FormField key={key} id={`measurement-${key}`} label={`${label} (${unit})`}>
                <DecimalInput
                  id={`measurement-${key}`}
                  value={form[key]}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      [key]: value,
                    }))
                  }
                />
              </FormField>
            ))}
          </div>
          <FormField id="measurement-notes" label="Observacoes">
            <Textarea
              id="measurement-notes"
              value={form.notes}
              maxLength={1000}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </FormField>
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
            {editing ? (
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setForm(emptyForm());
                }}
              >
                <X /> Cancelar
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={save.isPending}>
              <Plus /> {save.isPending ? 'Salvando...' : editing ? 'Atualizar' : 'Registrar'}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardTitle>Evolucao registrada</CardTitle>
        <WeightTrend measurements={data} />
        {measurements.isPending ? <p className="mt-3 text-sm">Carregando medidas...</p> : null}
        {measurements.isError ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {describeApiError(measurements.error, 'Nao foi possivel carregar as medidas.')}
          </p>
        ) : null}
        {measurements.isSuccess && data.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nenhuma avaliacao registrada.</p>
        ) : null}
        <ul className="mt-3 divide-y divide-border">
          {[...data].reverse().map((measurement) => (
            <li
              key={measurement.id}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div>
                <p className="font-medium">{formatCivilDate(measurement.measuredOn)}</p>
                <p className="text-xs text-muted-foreground">
                  {measurement.weightKg ? `${measurement.weightKg} kg` : 'Peso nao informado'}
                  {measurement.bodyFatPercentage
                    ? ` · ${measurement.bodyFatPercentage}% gordura`
                    : ''}
                  {measurement.waistCm ? ` · ${measurement.waistCm} cm cintura` : ''}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Editar avaliacao"
                  onClick={() => edit(measurement)}
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Excluir avaliacao"
                  disabled={remove.isPending}
                  onClick={() => {
                    if (window.confirm('Excluir esta avaliacao corporal?'))
                      remove.mutate(measurement.id);
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

function WeightTrend({ measurements }: { readonly measurements: Measurement[] }) {
  const points = measurements
    .filter((measurement) => measurement.weightKg)
    .map((measurement) => ({ date: measurement.measuredOn, value: Number(measurement.weightKg) }))
    .filter((point) => Number.isFinite(point.value));

  if (points.length < 2) return null;

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const polyline = points
    .map(
      (point, index) =>
        `${(index / (points.length - 1)) * 100},${38 - ((point.value - min) / span) * 32}`,
    )
    .join(' ');

  return (
    <div
      className="mt-3"
      role="img"
      aria-label={`Peso de ${points[0]?.value} a ${points.at(-1)?.value} quilogramas`}
    >
      <svg viewBox="0 0 100 44" className="h-28 w-full overflow-visible" preserveAspectRatio="none">
        <polyline
          points={polyline}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          className="text-primary"
        />
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatCivilDate(points[0]?.date ?? '')}</span>
        <span>{formatCivilDate(points.at(-1)?.date ?? '')}</span>
      </div>
    </div>
  );
}
