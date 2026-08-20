'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  BookOpen,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useDeferredValue, useEffect, useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { EmptyState, ErrorState } from '@/components/feedback/state-message';
import { FormField } from '@/components/forms/form-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useProfile } from '@/features/profile/use-profile';
import { apiClient } from '@/lib/api/client';
import type { components, paths } from '@/lib/api/generated/types';
import { ApiError, ErrorCode } from '@/lib/api/problem';
import { describeApiError, requireApiData, requireApiSuccess } from '@/lib/api/result';

import { exerciseNamesMatch, getExerciseDeletionState } from './exercise-library.utils';

type ExerciseSummary = components['schemas']['ExerciseSummaryResponse'];
type ExerciseDetail = components['schemas']['ExerciseDetailResponse'];
type ExerciseDeletionImpact = components['schemas']['ExerciseDeletionImpactResponse'];
type CreateExerciseRequest = components['schemas']['CreateExerciseRequest'];
type UpdateExerciseRequest = components['schemas']['UpdateExerciseRequest'];
type DeleteExerciseRequest = components['schemas']['DeleteExerciseRequest'];
type MuscleGroup = components['schemas']['MuscleGroup'];
type Equipment = components['schemas']['Equipment'];
type Difficulty = components['schemas']['Difficulty'];
type ExerciseQuery = NonNullable<paths['/api/v1/exercises']['get']['parameters']['query']>;

type CatalogAction = {
  readonly action: 'archive' | 'restore';
  readonly exercise: ExerciseSummary;
};

export const exerciseKeys = {
  all: ['exercises'] as const,
  list: (query: ExerciseQuery) => [...exerciseKeys.all, 'list', query] as const,
};

const MUSCLES: readonly [MuscleGroup, string][] = [
  ['CHEST', 'Peito'],
  ['BACK', 'Costas'],
  ['SHOULDERS', 'Ombros'],
  ['BICEPS', 'Bíceps'],
  ['TRICEPS', 'Tríceps'],
  ['FOREARMS', 'Antebraços'],
  ['CORE', 'Core'],
  ['GLUTES', 'Glúteos'],
  ['QUADS', 'Quadríceps'],
  ['HAMSTRINGS', 'Posteriores'],
  ['CALVES', 'Panturrilhas'],
  ['FULL_BODY', 'Corpo inteiro'],
];

const EQUIPMENT: readonly [Equipment, string][] = [
  ['BARBELL', 'Barra'],
  ['DUMBBELL', 'Halter'],
  ['MACHINE', 'Máquina'],
  ['CABLE', 'Polia'],
  ['BODYWEIGHT', 'Peso corporal'],
  ['KETTLEBELL', 'Kettlebell'],
  ['BAND', 'Elástico'],
  ['BENCH', 'Banco'],
  ['OTHER', 'Outro'],
];

export function ExerciseLibrary() {
  const queryClient = useQueryClient();
  const profile = useProfile();
  const canManage = profile.data?.role === 'ADMIN';
  const formContainerRef = useRef<HTMLDivElement>(null);
  const catalogDialogRef = useRef<HTMLDivElement>(null);
  const catalogTriggerRef = useRef<HTMLButtonElement>(null);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [muscle, setMuscle] = useState<MuscleGroup | ''>('');
  const [equipment, setEquipment] = useState<Equipment | ''>('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [editing, setEditing] = useState<ExerciseDetail | null>(null);
  const [creating, setCreating] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [deletionTarget, setDeletionTarget] = useState<ExerciseSummary | null>(null);
  const [confirmationName, setConfirmationName] = useState('');

  const filters: ExerciseQuery = {
    limit: 100,
    ...(deferredSearch.trim() ? { search: deferredSearch.trim() } : {}),
    ...(muscle ? { muscle } : {}),
    ...(equipment ? { equipment } : {}),
    ...(canManage && includeArchived ? { includeArchived: true } : {}),
  };

  const exercises = useQuery({
    queryKey: exerciseKeys.list(filters),
    enabled: open,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/exercises', {
        params: { query: filters },
      });
      return requireApiData(data, error, 'listar os exercícios');
    },
  });

  const catalogAction = useMutation({
    mutationFn: async ({ action, exercise }: CatalogAction): Promise<ExerciseDetail> => {
      if (action === 'archive') {
        const { data, error } = await apiClient.POST('/api/v1/exercises/{id}/archive', {
          params: { path: { id: exercise.id } },
        });
        return requireApiData(data, error, 'arquivar o exercício');
      }

      const { data, error } = await apiClient.POST('/api/v1/exercises/{id}/restore', {
        params: { path: { id: exercise.id } },
      });
      return requireApiData(data, error, 'restaurar o exercício');
    },
    onSuccess: async (result, variables) => {
      await queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
      const verb = variables.action === 'archive' ? 'arquivado' : 'restaurado';
      toast.success(`Exercício ${verb}.`);
      setAnnouncement(`${result.name} foi ${verb}.`);
      if (editing?.id === result.id) closeForm();
    },
    onError: (error, variables) => {
      const fallback =
        variables.action === 'archive'
          ? 'Não foi possível arquivar o exercício.'
          : 'Não foi possível restaurar o exercício.';
      toast.error(describeApiError(error, fallback));
    },
  });

  const deletionImpact = useMutation({
    mutationFn: async (exercise: ExerciseSummary): Promise<ExerciseDeletionImpact> => {
      const { data, error } = await apiClient.GET('/api/v1/exercises/{id}/deletion-impact', {
        params: { path: { id: exercise.id } },
      });
      return requireApiData(data, error, 'consultar o impacto da exclusão');
    },
    onSuccess: (impact) => {
      setAnnouncement(`Impacto da exclusão de ${impact.exerciseName} carregado.`);
    },
    onError: (error) => {
      setAnnouncement(describeApiError(error, 'Não foi possível consultar o impacto da exclusão.'));
    },
  });

  const deleteExercise = useMutation({
    mutationFn: async ({
      exercise,
      confirmation,
    }: {
      readonly exercise: ExerciseSummary;
      readonly confirmation: string;
    }) => {
      const body: DeleteExerciseRequest = { confirmationName: confirmation };
      const { error } = await apiClient.DELETE('/api/v1/exercises/{id}', {
        params: { path: { id: exercise.id } },
        body,
      });
      requireApiSuccess(error, 'excluir definitivamente o exercício');
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
      setDeletionTarget(null);
      setConfirmationName('');
      deletionImpact.reset();
      if (editing?.id === variables.exercise.id) closeForm();
      toast.success('Exercício excluído definitivamente.');
      setAnnouncement(`${variables.exercise.name} foi excluído definitivamente do catálogo.`);
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLInputElement>('#exercise-catalog-search')?.focus();
      });
    },
    onError: (error, variables) => {
      toast.error(describeApiError(error, 'Não foi possível excluir o exercício.'));
      if (error instanceof ApiError && error.code === ErrorCode.RESOURCE_IN_USE) {
        deletionImpact.mutate(variables.exercise);
      }
    },
  });

  async function openEditor(id: string): Promise<void> {
    setLoadingId(id);
    try {
      const { data, error } = await apiClient.GET('/api/v1/exercises/{id}', {
        params: { path: { id } },
      });
      const exercise = requireApiData(data, error, 'abrir o exercício');
      setEditing(exercise);
      setCreating(false);
      setAnnouncement(`Editando ${exercise.name}. O formulário foi aberto no início do catálogo.`);
    } catch (error) {
      toast.error(describeApiError(error, 'Não foi possível abrir o exercício.'));
    } finally {
      setLoadingId(null);
    }
  }

  function startCreating(): void {
    setCreating(true);
    setEditing(null);
    setAnnouncement('Formulário para criar um exercício global aberto.');
  }

  function closeForm(): void {
    setCreating(false);
    setEditing(null);
  }

  function requestArchive(exercise: ExerciseSummary): void {
    const confirmed = window.confirm(
      `Arquivar "${exercise.name}"? Ele sairá das novas seleções, mas continuará nas fichas e no histórico existentes.`,
    );
    if (confirmed) catalogAction.mutate({ action: 'archive', exercise });
  }

  function requestDeletion(exercise: ExerciseSummary): void {
    deletionImpact.reset();
    deleteExercise.reset();
    setDeletionTarget(exercise);
    setConfirmationName('');
    deletionImpact.mutate(exercise);
  }

  function closeDeletion(): void {
    if (deleteExercise.isPending) return;
    setDeletionTarget(null);
    setConfirmationName('');
    deletionImpact.reset();
    deleteExercise.reset();
  }

  function closeCatalog(): void {
    closeDeletion();
    closeForm();
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const previousFocus =
      catalogTriggerRef.current ??
      (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const frame = window.requestAnimationFrame(() => {
      catalogDialogRef.current
        ?.querySelector<HTMLInputElement>('#exercise-catalog-search')
        ?.focus();
    });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (deletionTarget) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        setCreating(false);
        setEditing(null);
        setOpen(false);
        return;
      }

      if (event.key !== 'Tab') return;
      const dialog = catalogDialogRef.current;
      const focusable = focusableElements(dialog);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!dialog || !first || !last) return;

      const focusIsOutside =
        !(document.activeElement instanceof Node) || !dialog.contains(document.activeElement);
      if (event.shiftKey && (focusIsOutside || document.activeElement === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (focusIsOutside || document.activeElement === last)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [deletionTarget, open]);

  useEffect(() => {
    if (!open || (!creating && !editing)) return;

    const frame = window.requestAnimationFrame(() => {
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth';
      formContainerRef.current?.scrollIntoView({ behavior, block: 'start' });
      formContainerRef.current
        ?.querySelector<HTMLInputElement>('#exercise-name')
        ?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [creating, editing, open]);

  return (
    <>
      <Card className="flex flex-col gap-4 bg-gradient-to-br from-primary/12 to-transparent min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <BookOpen className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <CardTitle>Catálogo global de exercícios</CardTitle>
            <CardDescription className="mt-1">
              {canManage
                ? 'Consulte e administre os exercícios disponíveis para todos.'
                : 'Consulte os exercícios disponíveis para montar suas fichas.'}
            </CardDescription>
          </div>
        </div>
        <Button
          className="shrink-0"
          onClick={(event) => {
            catalogTriggerRef.current = event.currentTarget;
            setOpen(true);
          }}
        >
          <BookOpen /> Abrir catálogo
        </Button>
      </Card>

      {open ? (
        <div className="fixed inset-0 z-100 flex items-end justify-center bg-black/75 min-[600px]:items-center min-[600px]:p-5">
          <div
            ref={catalogDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="exercise-library-title"
            aria-describedby="exercise-library-description"
            className="safe-bottom flex max-h-dvh w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-border bg-background shadow-2xl min-[600px]:max-h-[92dvh] min-[600px]:rounded-3xl"
          >
            <div className="safe-top flex items-center justify-between gap-3 border-b border-border px-4 pb-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="exercise-library-title" className="truncate text-lg font-bold">
                    Catálogo de exercícios
                  </h2>
                  <Badge variant={canManage ? 'primary' : 'neutral'}>
                    {canManage ? 'Administração' : 'Somente consulta'}
                  </Badge>
                </div>
                <p id="exercise-library-description" className="mt-1 text-sm text-muted-foreground">
                  {canManage
                    ? 'Alterações afetam todos os usuários.'
                    : 'Apenas administradores podem alterar o catálogo.'}
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

            <p className="sr-only" aria-live="polite" aria-atomic="true">
              {announcement}
            </p>

            <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
              <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                <div>
                  <h3 className="text-base font-semibold">Exercícios disponíveis</h3>
                  <p className="text-sm text-muted-foreground">
                    Um catálogo único para todas as fichas.
                  </p>
                </div>
                {canManage ? (
                  <Button size="sm" onClick={startCreating}>
                    <Plus /> Novo exercício
                  </Button>
                ) : null}
              </div>

              {canManage && (creating || editing) ? (
                <div ref={formContainerRef} className="scroll-mt-4">
                  <ExerciseForm
                    key={editing?.id ?? 'new-exercise'}
                    exercise={editing}
                    onCancel={closeForm}
                    onSaved={(name) => {
                      setAnnouncement(`${name} foi salvo no catálogo global.`);
                      closeForm();
                    }}
                  />
                </div>
              ) : null}

              <Card className="flex flex-col gap-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />
                  <Input
                    id="exercise-catalog-search"
                    aria-label="Buscar exercício"
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
                    <option value="">Todos os músculos</option>
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
                  {canManage ? (
                    <label className="tap flex items-center gap-2 rounded-lg border border-input px-3 text-sm min-[360px]:col-span-2">
                      <input
                        type="checkbox"
                        checked={includeArchived}
                        onChange={(event) => setIncludeArchived(event.target.checked)}
                      />
                      Mostrar exercícios arquivados
                    </label>
                  ) : null}
                </div>
              </Card>

              {exercises.isPending ? <Card aria-busy="true">Carregando catálogo...</Card> : null}
              {exercises.isError ? (
                <Card>
                  <ErrorState
                    description={describeApiError(
                      exercises.error,
                      'Não foi possível carregar o catálogo.',
                    )}
                    onRetry={() => void exercises.refetch()}
                  />
                </Card>
              ) : null}
              {exercises.data?.data.length === 0 ? (
                <Card>
                  <EmptyState
                    title="Nenhum exercício encontrado"
                    description="Altere a busca ou os filtros para ver outras opções."
                  />
                </Card>
              ) : null}

              <div className="flex flex-col gap-2">
                {exercises.data?.data.map((exercise) => {
                  const actionPending =
                    catalogAction.isPending && catalogAction.variables.exercise.id === exercise.id;
                  const loadingDetails = loadingId === exercise.id;

                  return (
                    <Card
                      key={exercise.id}
                      className="flex flex-col gap-3 py-3 min-[460px]:flex-row min-[460px]:items-center min-[460px]:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="min-w-0 truncate font-semibold">{exercise.name}</p>
                          <Badge variant="neutral">Global</Badge>
                          {exercise.isArchived ? <Badge variant="warning">Arquivado</Badge> : null}
                        </div>
                        <CardDescription className="mt-1">
                          {muscleLabel(exercise.primaryMuscle)} ·{' '}
                          {equipmentLabel(exercise.equipment)} ·{' '}
                          {difficultyLabel(exercise.difficulty)}
                        </CardDescription>
                      </div>

                      {canManage ? (
                        <div
                          className="flex shrink-0 items-center justify-end gap-1 border-t border-border pt-2 min-[460px]:border-0 min-[460px]:pt-0"
                          aria-label={`Ações de ${exercise.name}`}
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Editar ${exercise.name}`}
                            disabled={
                              loadingDetails || catalogAction.isPending || deleteExercise.isPending
                            }
                            onClick={() => void openEditor(exercise.id)}
                          >
                            {loadingDetails ? (
                              <LoaderCircle className="animate-spin" />
                            ) : (
                              <Pencil />
                            )}
                          </Button>
                          {exercise.isArchived ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={`Restaurar ${exercise.name}`}
                              disabled={actionPending || deleteExercise.isPending}
                              onClick={() => catalogAction.mutate({ action: 'restore', exercise })}
                            >
                              <RotateCcw />
                            </Button>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={`Arquivar ${exercise.name}`}
                              disabled={actionPending || deleteExercise.isPending}
                              onClick={() => requestArchive(exercise)}
                            >
                              <Archive />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            aria-label={`Excluir definitivamente ${exercise.name}`}
                            disabled={catalogAction.isPending || deleteExercise.isPending}
                            onClick={() => requestDeletion(exercise)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      ) : null}
                    </Card>
                  );
                })}
              </div>
            </section>
          </div>

          {deletionTarget ? (
            <ExerciseDeletionDialog
              target={deletionTarget}
              impact={deletionImpact.data}
              impactError={deletionImpact.error}
              loadingImpact={deletionImpact.isPending}
              deleting={deleteExercise.isPending}
              confirmationName={confirmationName}
              onConfirmationChange={setConfirmationName}
              onClose={closeDeletion}
              onRetry={() => deletionImpact.mutate(deletionTarget)}
              onArchive={
                deletionTarget.isArchived
                  ? undefined
                  : () => {
                      closeDeletion();
                      catalogAction.mutate({ action: 'archive', exercise: deletionTarget });
                    }
              }
              onConfirm={() =>
                deleteExercise.mutate({
                  exercise: deletionTarget,
                  confirmation: confirmationName,
                })
              }
            />
          ) : null}
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
  readonly onSaved: (name: string) => void;
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
        name: name.trim(),
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
        return requireApiData(data, error, 'atualizar o exercício');
      }

      const body: CreateExerciseRequest = common;
      const { data, error } = await apiClient.POST('/api/v1/exercises', { body });
      return requireApiData(data, error, 'criar o exercício');
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
      toast.success(exercise ? 'Exercício atualizado.' : 'Exercício global criado.');
      onSaved(result.name);
    },
    onError: (error) =>
      toast.error(describeApiError(error, 'Não foi possível salvar o exercício.')),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    save.mutate();
  }

  const saveError = save.isError
    ? describeApiError(save.error, 'Não foi possível salvar o exercício.')
    : null;

  return (
    <Card className="border-primary/25 bg-primary/5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{exercise ? 'Editar exercício global' : 'Novo exercício global'}</CardTitle>
            <CardDescription className="mt-1">
              Esta alteração ficará disponível para todos os usuários.
            </CardDescription>
          </div>
          <ShieldCheck className="size-5 shrink-0 text-primary" aria-hidden="true" />
        </div>

        {saveError ? (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {saveError}
          </p>
        ) : null}

        <FormField
          id="exercise-name"
          label="Nome"
          hint="O nome não pode repetir outro exercício, mesmo com letras maiúsculas ou minúsculas diferentes."
        >
          <Input
            id="exercise-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (save.isError) save.reset();
            }}
            maxLength={120}
            autoComplete="off"
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
            <option value="EASY">Fácil</option>
            <option value="MEDIUM">Média</option>
            <option value="HARD">Difícil</option>
          </Select>
        </FormField>
        <FormField id="exercise-instructions" label="Instruções">
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
            {save.isPending ? 'Salvando...' : 'Salvar no catálogo'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ExerciseDeletionDialog({
  target,
  impact,
  impactError,
  loadingImpact,
  deleting,
  confirmationName,
  onConfirmationChange,
  onClose,
  onRetry,
  onArchive,
  onConfirm,
}: {
  readonly target: ExerciseSummary;
  readonly impact?: ExerciseDeletionImpact;
  readonly impactError: Error | null;
  readonly loadingImpact: boolean;
  readonly deleting: boolean;
  readonly confirmationName: string;
  readonly onConfirmationChange: (value: string) => void;
  readonly onClose: () => void;
  readonly onRetry: () => void;
  readonly onArchive?: (() => void) | undefined;
  readonly onConfirm: () => void;
}) {
  const confirmed = impact ? exerciseNamesMatch(confirmationName, impact.exerciseName) : false;
  const deletionState = impact ? getExerciseDeletionState(impact) : null;
  const blocked = deletionState?.blocked ?? false;
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => {
      firstFocusableElement(dialogRef.current)?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = focusableElements(dialogRef.current);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (confirmed && !blocked && !deleting) onConfirm();
  }

  return (
    <div className="fixed inset-0 z-110 flex items-end justify-center bg-black/80 min-[600px]:items-center min-[600px]:p-5">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-exercise-title"
        aria-describedby="delete-exercise-description"
        className="safe-bottom max-h-dvh w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-background p-5 shadow-2xl min-[600px]:max-h-[90dvh] min-[600px]:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="delete-exercise-title" className="text-xl font-bold tracking-tight">
              Excluir exercício definitivamente
            </h2>
            <p id="delete-exercise-description" className="mt-2 text-sm text-muted-foreground">
              Revise o impacto antes de remover {target.name} do catálogo global.
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Fechar confirmação de exclusão"
            disabled={deleting}
            onClick={onClose}
          >
            <X />
          </Button>
        </div>

        <div className="mt-5">
          {loadingImpact ? (
            <Card aria-busy="true" className="flex items-center gap-3">
              <LoaderCircle className="size-5 animate-spin text-primary" aria-hidden="true" />
              <p className="text-sm">Verificando fichas e histórico...</p>
            </Card>
          ) : null}

          {impactError ? (
            <Card>
              <ErrorState
                description={describeApiError(
                  impactError,
                  'Não foi possível consultar o impacto da exclusão.',
                )}
                onRetry={onRetry}
              />
            </Card>
          ) : null}

          {impact ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                <ImpactMetric label="Fichas afetadas" value={impact.templateCount} />
                <ImpactMetric label="Usuários afetados" value={impact.affectedUserCount} />
                <ImpactMetric label="Treinos no histórico" value={impact.historicalSessionCount} />
                <ImpactMetric label="Séries preservadas" value={impact.historicalSetCount} />
              </div>

              {deletionState?.hasTemplateReferences ? (
                <div
                  role="alert"
                  className="rounded-xl border border-warning/35 bg-warning/10 p-4 text-sm leading-relaxed"
                >
                  <div className="flex items-start gap-3">
                    <TriangleAlert
                      className="mt-0.5 size-5 shrink-0 text-warning"
                      aria-hidden="true"
                    />
                    <p>
                      <strong>Este exercício está em fichas.</strong> Ao excluir, ele será removido
                      de {pluralize(impact.templateCount, 'ficha', 'fichas')} de{' '}
                      {pluralize(impact.affectedUserCount, 'usuário', 'usuários')}.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                  Este exercício não está em nenhuma ficha.
                </p>
              )}

              <p className="rounded-xl border border-success/25 bg-success/8 p-4 text-sm leading-relaxed">
                O histórico não será apagado:{' '}
                {pluralize(
                  impact.historicalSessionCount,
                  'treino antigo continuará',
                  'treinos antigos continuarão',
                )}{' '}
                com nomes, cargas, repetições e séries preservados como snapshot.
              </p>

              {blocked ? (
                <div className="rounded-xl border border-destructive/35 bg-destructive/10 p-4">
                  <div className="flex items-start gap-3">
                    <TriangleAlert
                      className="mt-0.5 size-5 shrink-0 text-destructive"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-semibold text-destructive">Exclusão bloqueada agora</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {pluralize(
                          impact.activeSessionCount,
                          'Uma sessão ativa está usando este exercício.',
                          'Sessões ativas estão usando este exercício.',
                        )}{' '}
                        Finalize esses treinos antes de tentar novamente. Você ainda pode arquivá-lo
                        para impedir novas seleções.
                      </p>
                    </div>
                  </div>
                  {onArchive ? (
                    <Button className="mt-4 w-full" variant="outline" onClick={onArchive}>
                      <Archive /> Arquivar em vez de excluir
                    </Button>
                  ) : null}
                </div>
              ) : (
                <FormField
                  id="exercise-delete-confirmation"
                  label={`Digite “${impact.exerciseName}” para confirmar`}
                  hint="A comparação não diferencia letras maiúsculas de minúsculas."
                >
                  <Input
                    id="exercise-delete-confirmation"
                    value={confirmationName}
                    onChange={(event) => onConfirmationChange(event.target.value)}
                    autoComplete="off"
                    maxLength={120}
                    disabled={deleting}
                  />
                </FormField>
              )}

              <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                <Button variant="outline" onClick={onClose} disabled={deleting}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={blocked || !confirmed || deleting}
                >
                  {deleting ? 'Excluindo...' : blocked ? 'Exclusão bloqueada' : 'Excluir de todos'}
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ImpactMetric({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-2xl font-bold tabular">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function pluralize(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function focusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]',
    ),
  );
}

function firstFocusableElement(container: HTMLElement | null): HTMLElement | undefined {
  return focusableElements(container)[0];
}

function muscleLabel(value: MuscleGroup): string {
  return MUSCLES.find(([key]) => key === value)?.[1] ?? value;
}

function equipmentLabel(value: Equipment): string {
  return EQUIPMENT.find(([key]) => key === value)?.[1] ?? value;
}

function difficultyLabel(value: Difficulty): string {
  return { EASY: 'Fácil', MEDIUM: 'Média', HARD: 'Difícil' }[value];
}

function emptyToNull(value: string): string | null {
  return value.trim() || null;
}
