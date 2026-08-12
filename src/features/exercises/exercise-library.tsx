'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, BookOpen, Pencil, Plus, Search, X } from 'lucide-react';
import { useDeferredValue, useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { FormField } from '@/components/forms/form-field';
import { EmptyState, ErrorState } from '@/components/feedback/state-message';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import type { components, paths } from '@/lib/api/generated/types';
import { describeApiError, requireApiData } from '@/lib/api/result';

type ExerciseSummary = components['schemas']['ExerciseSummaryResponse'];
type ExerciseDetail = components['schemas']['ExerciseDetailResponse'];
type CreateExerciseRequest = components['schemas']['CreateExerciseRequest'];
type UpdateExerciseRequest = components['schemas']['UpdateExerciseRequest'];
type MuscleGroup = components['schemas']['MuscleGroup'];
type Equipment = components['schemas']['Equipment'];
type Difficulty = components['schemas']['Difficulty'];
type ExerciseQuery = NonNullable<paths['/api/v1/exercises']['get']['parameters']['query']>;

export const exerciseKeys = {
  all: ['exercises'] as const,
  list: (query: ExerciseQuery) => [...exerciseKeys.all, 'list', query] as const,
};

const MUSCLES: readonly [MuscleGroup, string][] = [
  ['CHEST', 'Peito'],
  ['BACK', 'Costas'],
  ['SHOULDERS', 'Ombros'],
  ['BICEPS', 'Biceps'],
  ['TRICEPS', 'Triceps'],
  ['FOREARMS', 'Antebracos'],
  ['CORE', 'Core'],
  ['GLUTES', 'Gluteos'],
  ['QUADS', 'Quadriceps'],
  ['HAMSTRINGS', 'Posteriores'],
  ['CALVES', 'Panturrilhas'],
  ['FULL_BODY', 'Corpo inteiro'],
];

const EQUIPMENT: readonly [Equipment, string][] = [
  ['BARBELL', 'Barra'],
  ['DUMBBELL', 'Halter'],
  ['MACHINE', 'Maquina'],
  ['CABLE', 'Polia'],
  ['BODYWEIGHT', 'Peso corporal'],
  ['KETTLEBELL', 'Kettlebell'],
  ['BAND', 'Elastico'],
  ['BENCH', 'Banco'],
  ['OTHER', 'Outro'],
];

export function ExerciseLibrary() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [muscle, setMuscle] = useState<MuscleGroup | ''>('');
  const [equipment, setEquipment] = useState<Equipment | ''>('');
  const [origin, setOrigin] = useState<'global' | 'custom' | ''>('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [editing, setEditing] = useState<ExerciseDetail | null>(null);
  const [creating, setCreating] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filters: ExerciseQuery = {
    limit: 100,
    ...(deferredSearch.trim() ? { search: deferredSearch.trim() } : {}),
    ...(muscle ? { muscle } : {}),
    ...(equipment ? { equipment } : {}),
    ...(origin ? { origin } : {}),
    ...(includeArchived ? { includeArchived: true } : {}),
  };

  const exercises = useQuery({
    queryKey: exerciseKeys.list(filters),
    enabled: open,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/exercises', {
        params: { query: filters },
      });
      return requireApiData(data, error, 'listar os exercicios');
    },
  });

  const remove = useMutation({
    mutationFn: async (exercise: ExerciseSummary) => {
      const { data, error } = await apiClient.DELETE('/api/v1/exercises/{id}', {
        params: { path: { id: exercise.id } },
      });
      return requireApiData(data, error, 'excluir o exercicio');
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
      toast.success(
        result.archived ? 'Exercicio arquivado porque esta em uso.' : 'Exercicio excluido.',
      );
    },
    onError: (error) =>
      toast.error(describeApiError(error, 'Nao foi possivel remover o exercicio.')),
  });

  async function openEditor(id: string): Promise<void> {
    setLoadingId(id);
    try {
      const { data, error } = await apiClient.GET('/api/v1/exercises/{id}', {
        params: { path: { id } },
      });
      setEditing(requireApiData(data, error, 'abrir o exercicio'));
      setCreating(false);
    } catch (error) {
      toast.error(describeApiError(error, 'Nao foi possivel abrir o exercicio.'));
    } finally {
      setLoadingId(null);
    }
  }

  function closeForm(): void {
    setCreating(false);
    setEditing(null);
  }

  function closeCatalog(): void {
    closeForm();
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <Card className="flex flex-col gap-4 bg-gradient-to-br from-primary/12 to-transparent min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <BookOpen className="size-5" />
          </span>
          <div className="min-w-0">
            <CardTitle>Catálogo de exercícios</CardTitle>
            <CardDescription className="mt-1">
              Consulte opções ou gerencie seus exercícios personalizados.
            </CardDescription>
          </div>
        </div>
        <Button className="shrink-0" onClick={() => setOpen(true)}>
          <BookOpen /> Abrir catálogo
        </Button>
      </Card>

      {open ? (
        <div className="fixed inset-0 z-100 flex items-end justify-center bg-black/75 min-[600px]:items-center min-[600px]:p-5">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exercise-library-title"
            className="safe-bottom flex max-h-dvh w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-border bg-background shadow-2xl min-[600px]:max-h-[92dvh] min-[600px]:rounded-3xl"
          >
            <div className="safe-top flex items-center justify-between gap-3 border-b border-border px-4 pb-3">
              <div className="min-w-0">
                <h2 id="exercise-library-title" className="truncate text-lg font-bold">
                  Catálogo de exercícios
                </h2>
                <p className="text-sm text-muted-foreground">
                  Pesquise, crie e organize exercícios.
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Fechar catálogo"
                onClick={closeCatalog}
              >
                <X />
              </Button>
            </div>

            <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">Exercícios disponíveis</h3>
                  <p className="text-sm text-muted-foreground">
                    Catálogo global e seus exercícios.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setCreating(true);
                    setEditing(null);
                  }}
                >
                  <Plus /> Novo
                </Button>
              </div>

              {creating || editing ? (
                <ExerciseForm exercise={editing} onCancel={closeForm} onSaved={closeForm} />
              ) : null}

              <Card className="flex flex-col gap-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />
                  <Input
                    aria-label="Buscar exercicio"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="pl-9"
                    placeholder="Buscar por nome"
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                  <Select
                    aria-label="Filtrar por grupo muscular"
                    value={muscle}
                    onChange={(event) => setMuscle(event.target.value as MuscleGroup | '')}
                  >
                    <option value="">Todos os musculos</option>
                    {MUSCLES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                  <Select
                    aria-label="Filtrar por equipamento"
                    value={equipment}
                    onChange={(event) => setEquipment(event.target.value as Equipment | '')}
                  >
                    <option value="">Todo equipamento</option>
                    {EQUIPMENT.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                  <Select
                    aria-label="Filtrar por origem"
                    value={origin}
                    onChange={(event) => setOrigin(event.target.value as typeof origin)}
                  >
                    <option value="">Todas as origens</option>
                    <option value="global">Catalogo</option>
                    <option value="custom">Meus exercicios</option>
                  </Select>
                  <label className="tap flex items-center gap-2 rounded-lg border border-input px-3 text-sm">
                    <input
                      type="checkbox"
                      checked={includeArchived}
                      onChange={(event) => setIncludeArchived(event.target.checked)}
                    />
                    Arquivados
                  </label>
                </div>
              </Card>

              {exercises.isPending ? <Card aria-busy="true">Carregando biblioteca...</Card> : null}
              {exercises.isError ? (
                <Card>
                  <ErrorState
                    description={describeApiError(
                      exercises.error,
                      'Falha ao carregar a biblioteca.',
                    )}
                    onRetry={() => void exercises.refetch()}
                  />
                </Card>
              ) : null}
              {exercises.data?.data.length === 0 ? (
                <Card>
                  <EmptyState
                    title="Nenhum exercicio encontrado"
                    description="Altere os filtros ou crie um exercicio personalizado."
                  />
                </Card>
              ) : null}

              <div className="flex flex-col gap-2">
                {exercises.data?.data.map((exercise) => (
                  <Card key={exercise.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="truncate">{exercise.name}</CardTitle>
                        <Badge variant={exercise.isGlobal ? 'neutral' : 'primary'}>
                          {exercise.isGlobal ? 'Catalogo' : 'Seu'}
                        </Badge>
                        {exercise.isArchived ? <Badge variant="warning">Arquivado</Badge> : null}
                      </div>
                      <CardDescription className="mt-1">
                        {muscleLabel(exercise.primaryMuscle)} · {equipmentLabel(exercise.equipment)}{' '}
                        · {difficultyLabel(exercise.difficulty)}
                      </CardDescription>
                    </div>
                    {!exercise.isGlobal ? (
                      <div className="flex shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Editar ${exercise.name}`}
                          disabled={loadingId === exercise.id}
                          onClick={() => void openEditor(exercise.id)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Excluir ou arquivar ${exercise.name}`}
                          disabled={remove.isPending}
                          onClick={() => {
                            if (window.confirm(`Excluir ou arquivar "${exercise.name}"?`)) {
                              remove.mutate(exercise);
                            }
                          }}
                        >
                          <Archive />
                        </Button>
                      </div>
                    ) : null}
                  </Card>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ExerciseForm({
  exercise,
  onCancel,
  onSaved,
}: {
  readonly exercise: ExerciseDetail | null;
  readonly onCancel: () => void;
  readonly onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(exercise?.name ?? '');
  const [primaryMuscle, setPrimaryMuscle] = useState<MuscleGroup>(
    exercise?.primaryMuscle ?? 'CHEST',
  );
  const [equipment, setEquipment] = useState<Equipment>(exercise?.equipment ?? 'DUMBBELL');
  const [difficulty, setDifficulty] = useState<Difficulty>(exercise?.difficulty ?? 'MEDIUM');
  const [instructions, setInstructions] = useState(exercise?.instructions ?? '');
  const [cautions, setCautions] = useState(exercise?.cautions ?? '');

  const save = useMutation({
    mutationFn: async () => {
      const common = {
        name,
        primaryMuscle,
        equipment,
        difficulty,
        instructions: emptyToNull(instructions),
        cautions: emptyToNull(cautions),
      };

      if (exercise) {
        const body: UpdateExerciseRequest = common;
        const { data, error } = await apiClient.PATCH('/api/v1/exercises/{id}', {
          params: {
            path: { id: exercise.id },
            header: { 'If-Match': `"${exercise.version}"` },
          },
          body,
        });
        return requireApiData(data, error, 'atualizar o exercicio');
      }

      const body: CreateExerciseRequest = common;
      const { data, error } = await apiClient.POST('/api/v1/exercises', { body });
      return requireApiData(data, error, 'criar o exercicio');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
      toast.success(exercise ? 'Exercicio atualizado.' : 'Exercicio criado.');
      onSaved();
    },
    onError: (error) =>
      toast.error(describeApiError(error, 'Nao foi possivel salvar o exercicio.')),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    save.mutate();
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <CardTitle>{exercise ? 'Editar exercicio' : 'Novo exercicio'}</CardTitle>
        <FormField id="exercise-name" label="Nome">
          <Input
            id="exercise-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            required
          />
        </FormField>
        <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
          <FormField id="exercise-muscle" label="Grupo principal">
            <Select
              id="exercise-muscle"
              value={primaryMuscle}
              onChange={(event) => setPrimaryMuscle(event.target.value as MuscleGroup)}
            >
              {MUSCLES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField id="exercise-equipment" label="Equipamento">
            <Select
              id="exercise-equipment"
              value={equipment}
              onChange={(event) => setEquipment(event.target.value as Equipment)}
            >
              {EQUIPMENT.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <FormField id="exercise-difficulty" label="Dificuldade">
          <Select
            id="exercise-difficulty"
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as Difficulty)}
          >
            <option value="EASY">Facil</option>
            <option value="MEDIUM">Media</option>
            <option value="HARD">Dificil</option>
          </Select>
        </FormField>
        <FormField id="exercise-instructions" label="Instrucoes">
          <Textarea
            id="exercise-instructions"
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            maxLength={2000}
          />
        </FormField>
        <FormField id="exercise-cautions" label="Cuidados">
          <Textarea
            id="exercise-cautions"
            value={cautions}
            onChange={(event) => setCautions(event.target.value)}
            maxLength={1000}
          />
        </FormField>
        <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
          <Button variant="outline" onClick={onCancel} disabled={save.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={save.isPending || !name.trim()}>
            {save.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function muscleLabel(value: MuscleGroup): string {
  return MUSCLES.find(([key]) => key === value)?.[1] ?? value;
}

function equipmentLabel(value: Equipment): string {
  return EQUIPMENT.find(([key]) => key === value)?.[1] ?? value;
}

function difficultyLabel(value: Difficulty): string {
  return { EASY: 'Facil', MEDIUM: 'Media', HARD: 'Dificil' }[value];
}

function emptyToNull(value: string): string | null {
  return value.trim() || null;
}
