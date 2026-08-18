'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ArrowDown, ArrowUp, Copy, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { FormField } from '@/components/forms/form-field';
import { IntegerInput } from '@/components/forms/numeric-input';
import { EmptyState, ErrorState } from '@/components/feedback/state-message';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import type { components } from '@/lib/api/generated/types';
import { describeApiError, requireApiData, requireApiSuccess } from '@/lib/api/result';

import { exerciseKeys } from '@/features/exercises/exercise-library';

type WorkoutSummary = components['schemas']['WorkoutSummaryResponse'];
type WorkoutDetail = components['schemas']['WorkoutDetailResponse'];
type WorkoutExerciseInput = components['schemas']['WorkoutExerciseInput'];
type ExerciseSummary = components['schemas']['ExerciseSummaryResponse'];
type CreateWorkoutRequest = components['schemas']['CreateWorkoutRequest'];
type UpdateWorkoutRequest = components['schemas']['UpdateWorkoutRequest'];

export const workoutKeys = {
  all: ['workouts'] as const,
  list: ['workouts', 'list'] as const,
};

export function WorkoutManager() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<WorkoutDetail | null>(null);
  const [creating, setCreating] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const workouts = useQuery({
    queryKey: workoutKeys.list,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/workouts');
      return requireApiData(data, error, 'listar as fichas');
    },
  });

  const exercises = useQuery({
    queryKey: exerciseKeys.list({ limit: 100 }),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/exercises', {
        params: { query: { limit: 100 } },
      });
      return requireApiData(data, error, 'listar os exercícios');
    },
  });

  const refresh = async (): Promise<void> => {
    setCreating(false);
    setEditing(null);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: workoutKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['schedule'] }),
    ]);
  };

  const archive = useMutation({
    mutationFn: async (workout: WorkoutSummary) => {
      const { data, error } = await apiClient.PATCH('/api/v1/workouts/{id}', {
        params: {
          path: { id: workout.id },
          header: { 'If-Match': `"${workout.version}"` },
        },
        body: { archived: true },
      });
      return requireApiData(data, error, 'arquivar a ficha');
    },
    onSuccess: async () => {
      await refresh();
      toast.success('Ficha arquivada e retirada da agenda semanal.');
    },
    onError: (error) => toast.error(describeApiError(error, 'Não foi possível arquivar a ficha.')),
  });

  const duplicate = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST('/api/v1/workouts/{id}/duplicate', {
        params: { path: { id } },
        body: {},
      });
      return requireApiData(data, error, 'duplicar a ficha');
    },
    onSuccess: async () => {
      await refresh();
      toast.success('Ficha duplicada.');
    },
    onError: (error) => toast.error(describeApiError(error, 'Não foi possível duplicar a ficha.')),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.DELETE('/api/v1/workouts/{id}', {
        params: { path: { id } },
      });
      requireApiSuccess(error, 'excluir a ficha');
    },
    onSuccess: async () => {
      await refresh();
      toast.success('Ficha excluída.');
    },
    onError: (error) => toast.error(describeApiError(error, 'Não foi possível excluir a ficha.')),
  });

  const reorder = useMutation({
    mutationFn: async (ordered: WorkoutSummary[]) => {
      const { data, error } = await apiClient.POST('/api/v1/workouts/reorder', {
        body: { workoutIds: ordered.map((workout) => workout.id) },
      });
      return requireApiData(data, error, 'reordenar as fichas');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workoutKeys.all });
    },
    onError: (error) =>
      toast.error(describeApiError(error, 'Não foi possível reordenar as fichas.')),
  });

  async function editWorkout(id: string): Promise<void> {
    setLoadingId(id);
    try {
      const { data, error } = await apiClient.GET('/api/v1/workouts/{id}', {
        params: { path: { id } },
      });
      setEditing(requireApiData(data, error, 'abrir a ficha'));
      setCreating(false);
    } catch (error) {
      toast.error(describeApiError(error, 'Não foi possível abrir a ficha.'));
    } finally {
      setLoadingId(null);
    }
  }

  function moveWorkout(index: number, direction: -1 | 1): void {
    const current = workouts.data?.data;
    if (!current) return;
    const destination = index + direction;
    if (destination < 0 || destination >= current.length) return;
    const ordered = [...current];
    const [moved] = ordered.splice(index, 1);
    if (!moved) return;
    ordered.splice(destination, 0, moved);
    reorder.mutate(ordered);
  }

  return (
    <section aria-labelledby="workouts-title" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="workouts-title" className="text-lg font-semibold">
            Minhas fichas
          </h2>
          <p className="text-sm text-muted-foreground">Ordem, exercícios e metas de cada treino.</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
        >
          <Plus /> Nova
        </Button>
      </div>

      {creating || editing ? (
        <WorkoutForm
          workout={editing}
          exercises={exercises.data?.data ?? []}
          exercisesPending={exercises.isPending}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => void refresh()}
        />
      ) : null}

      {workouts.isPending ? <Card aria-busy="true">Carregando fichas...</Card> : null}
      {workouts.isError ? (
        <Card>
          <ErrorState
            description={describeApiError(workouts.error, 'Não foi possível carregar as fichas.')}
            onRetry={() => void workouts.refetch()}
          />
        </Card>
      ) : null}
      {workouts.data?.data.length === 0 ? (
        <Card>
          <EmptyState
            title="Nenhuma ficha criada"
            description="Crie sua primeira ficha e depois associe-a aos dias na Agenda."
          />
        </Card>
      ) : null}

      <div className="flex flex-col gap-3">
        {workouts.data?.data.map((workout, index, all) => (
          <Card key={workout.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle>{workout.name}</CardTitle>
                <CardDescription className="mt-1">
                  {workout.exerciseCount} {workout.exerciseCount === 1 ? 'exercício' : 'exercícios'}
                  {workout.notes ? ` · ${workout.notes}` : ''}
                </CardDescription>
              </div>
              <div className="flex">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Mover ${workout.name} para cima`}
                  disabled={index === 0 || reorder.isPending}
                  onClick={() => moveWorkout(index, -1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Mover ${workout.name} para baixo`}
                  disabled={index === all.length - 1 || reorder.isPending}
                  onClick={() => moveWorkout(index, 1)}
                >
                  <ArrowDown />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1 border-t border-border pt-2">
              <ActionButton
                label="Editar"
                icon={<Pencil />}
                disabled={loadingId === workout.id}
                onClick={() => void editWorkout(workout.id)}
              />
              <ActionButton
                label="Duplicar"
                icon={<Copy />}
                disabled={duplicate.isPending}
                onClick={() => duplicate.mutate(workout.id)}
              />
              <ActionButton
                label="Arquivar"
                icon={<Archive />}
                disabled={archive.isPending}
                onClick={() => {
                  if (window.confirm(`Arquivar "${workout.name}" e removê-la da agenda semanal?`)) {
                    archive.mutate(workout);
                  }
                }}
              />
              <ActionButton
                label="Excluir"
                icon={<Trash2 />}
                destructive
                disabled={remove.isPending}
                onClick={() => {
                  if (window.confirm(`Excluir definitivamente a ficha "${workout.name}"?`)) {
                    remove.mutate(workout.id);
                  }
                }}
              />
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function WorkoutForm({
  workout,
  exercises,
  exercisesPending,
  onCancel,
  onSaved,
}: {
  readonly workout: WorkoutDetail | null;
  readonly exercises: ExerciseSummary[];
  readonly exercisesPending: boolean;
  readonly onCancel: () => void;
  readonly onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(workout?.name ?? '');
  const [notes, setNotes] = useState(workout?.notes ?? '');
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [items, setItems] = useState<WorkoutExerciseInput[]>(
    workout?.exercises.map((item) => ({
      exerciseId: item.exercise.id,
      targetSets: item.targetSets,
      repMin: item.repMin,
      repMax: item.repMax,
      restSeconds: item.restSeconds,
      notes: item.notes,
    })) ?? [],
  );

  const save = useMutation({
    mutationFn: async () => {
      const common = { name, notes: notes.trim() || null, exercises: items };

      if (workout) {
        const body: UpdateWorkoutRequest = common;
        const { data, error } = await apiClient.PATCH('/api/v1/workouts/{id}', {
          params: {
            path: { id: workout.id },
            header: { 'If-Match': `"${workout.version}"` },
          },
          body,
        });
        return requireApiData(data, error, 'atualizar a ficha');
      }

      const body: CreateWorkoutRequest = common;
      const { data, error } = await apiClient.POST('/api/v1/workouts', { body });
      return requireApiData(data, error, 'criar a ficha');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workoutKeys.all });
      toast.success(workout ? 'Ficha atualizada.' : 'Ficha criada.');
      onSaved();
    },
    onError: (error) => toast.error(describeApiError(error, 'Não foi possível salvar a ficha.')),
  });

  function addExercise(): void {
    if (!selectedExerciseId || items.some((item) => item.exerciseId === selectedExerciseId)) return;
    setItems((current) => [
      ...current,
      {
        exerciseId: selectedExerciseId,
        targetSets: 3,
        repMin: 10,
        repMax: 10,
        restSeconds: 90,
        notes: null,
      },
    ]);
    setSelectedExerciseId('');
  }

  function updateItem(index: number, update: Partial<WorkoutExerciseInput>): void {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...update } : item)),
    );
  }

  function moveItem(index: number, direction: -1 | 1): void {
    setItems((current) => {
      const destination = index + direction;
      if (destination < 0 || destination >= current.length) return current;
      const ordered = [...current];
      const [moved] = ordered.splice(index, 1);
      if (!moved) return current;
      ordered.splice(destination, 0, moved);
      return ordered;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    save.mutate();
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <CardTitle>{workout ? 'Editar ficha' : 'Nova ficha'}</CardTitle>
        <FormField id="workout-name" label="Nome">
          <Input
            id="workout-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            required
          />
        </FormField>
        <FormField id="workout-notes" label="Observações">
          <Textarea
            id="workout-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={1000}
          />
        </FormField>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Exercícios na ordem de execução</p>
          <div className="flex gap-2">
            <Select
              aria-label="Exercício para adicionar"
              value={selectedExerciseId}
              onChange={(event) => setSelectedExerciseId(event.target.value)}
              disabled={exercisesPending}
            >
              <option value="">
                {exercisesPending ? 'Carregando...' : 'Selecione um exercício'}
              </option>
              {exercises
                .filter((exercise) => !items.some((item) => item.exerciseId === exercise.id))
                .map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </option>
                ))}
            </Select>
            <Button size="icon" aria-label="Adicionar exercício" onClick={addExercise}>
              <Plus />
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
            A ficha pode ser salva vazia e receber exercícios depois.
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          {items.map((item, index) => (
            <Card key={item.exerciseId} className="bg-secondary/20 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-sm font-semibold">
                  {exercises.find((exercise) => exercise.id === item.exerciseId)?.name ??
                    workout?.exercises.find((entry) => entry.exercise.id === item.exerciseId)
                      ?.exercise.name ??
                    'Exercício'}
                </p>
                <div className="flex">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Mover exercício para cima"
                    disabled={index === 0}
                    onClick={() => moveItem(index, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Mover exercício para baixo"
                    disabled={index === items.length - 1}
                    onClick={() => moveItem(index, 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Remover exercício da ficha"
                    onClick={() => setItems((current) => current.filter((_, i) => i !== index))}
                  >
                    <X />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-3">
                <NumberField
                  label="Séries"
                  value={item.targetSets ?? 3}
                  min={1}
                  max={20}
                  onChange={(value) => updateItem(index, { targetSets: value })}
                />
                <NumberField
                  label="Repetições"
                  value={item.repMax ?? item.repMin ?? 10}
                  min={1}
                  max={100}
                  onChange={(value) => updateItem(index, { repMin: value, repMax: value })}
                />
                <NumberField
                  label="Pausa (s)"
                  value={item.restSeconds ?? 90}
                  min={0}
                  max={1800}
                  onChange={(value) => updateItem(index, { restSeconds: value })}
                />
              </div>
              <Input
                aria-label="Observação deste exercício"
                className="mt-2"
                value={item.notes ?? ''}
                onChange={(event) => updateItem(index, { notes: event.target.value || null })}
                maxLength={500}
                placeholder="Observação opcional"
              />
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
          <Button variant="outline" onClick={onCancel} disabled={save.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={save.isPending || !name.trim()}>
            {save.isPending ? 'Salvando...' : 'Salvar ficha'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly onChange: (value: number) => void;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <IntegerInput
        className="min-w-0 px-2 text-sm"
        min={min}
        max={max}
        value={value}
        onValueChange={onChange}
        required
      />
    </label>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  disabled,
  destructive = false,
}: {
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly destructive?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      className={destructive ? 'text-destructive' : undefined}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </Button>
  );
}
