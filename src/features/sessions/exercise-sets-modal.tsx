'use client';

import { Check, History, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import {
  IntegerInput,
  WeightInput,
  decimalToApi,
  normalizeDecimalInput,
} from '@/components/forms/numeric-input';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import type { components } from '@/lib/api/generated/types';
import { describeApiError, requireApiData } from '@/lib/api/result';
import type { UpsertSetRequest } from '@/lib/offline/types';
import { cn } from '@/lib/utils';

type SessionExercise = components['schemas']['SessionExerciseResponse'];
export type ExerciseSetInput = components['schemas']['ExerciseSetInput'];

interface SetDraft {
  readonly id: string;
  readonly setNumber: number;
  readonly isWarmup: boolean;
  readonly notes: string;
  readonly clientCompletedAt: string;
  readonly weightKg: string;
  readonly reps: number;
  /**
   * Se esta série já foi salva individualmente (checkbox "Concluir"), fora do
   * envio em lote de "Concluir exercício". Trava os campos até desmarcar, para
   * não divergir do que já foi gravado sem uma ação explícita.
   */
  readonly completed: boolean;
}

/**
 * Corpo do formulário de séries, sem moldura de diálogo. Usado tanto pelo
 * painel inline durante o treino quanto pelo modal de correção de histórico.
 */
export function ExerciseSetsForm({
  exercise,
  pending,
  onSubmit,
  onCancel,
  onSetCompleted,
  submitLabel = 'Concluir exercício',
}: {
  readonly exercise: SessionExercise;
  readonly pending: boolean;
  readonly onSubmit: (sets: ExerciseSetInput[]) => void;
  readonly onCancel?: () => void;
  /**
   * Quando informado, mostra um botão "Concluir" por série: salva aquela
   * série sozinha (carga e repetições atuais) e marca o momento em que foi
   * finalizada — é o gatilho para iniciar o descanso na hora, sem esperar o
   * exercício inteiro. Ausente (ex.: correção de histórico), o botão não
   * aparece e só o envio em lote existe.
   */
  readonly onSetCompleted?: (setId: string, body: UpsertSetRequest) => Promise<unknown>;
  readonly submitLabel?: string;
}) {
  const [drafts, setDrafts] = useState<SetDraft[]>(() => createDrafts(exercise));
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [savingSetId, setSavingSetId] = useState<string | null>(null);

  async function applyLastPerformance(): Promise<void> {
    if (!exercise.exerciseId) return;
    setLoadingSuggestion(true);
    try {
      const { data, error } = await apiClient.GET(
        '/api/v1/progress/exercises/{exerciseId}/load-suggestion',
        { params: { path: { exerciseId: exercise.exerciseId } } },
      );
      const suggestion = requireApiData(data, error, 'carregar o último desempenho');
      if (suggestion.lastWeightKg === null || suggestion.lastWeightKg === undefined) {
        toast.info('Este exercício ainda não tem carga anterior.');
        return;
      }
      setDrafts((current) =>
        current.map((draft) =>
          draft.completed
            ? draft
            : {
                ...draft,
                weightKg: normalizeDecimalInput(suggestion.lastWeightKg ?? ''),
                reps: suggestion.lastReps ?? draft.reps,
              },
        ),
      );
    } catch (error) {
      toast.error(describeApiError(error, 'Não foi possível carregar a última carga.'));
    } finally {
      setLoadingSuggestion(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (drafts.some((draft) => !draft.weightKg)) {
      toast.error('Preencha a carga de todas as séries.');
      return;
    }
    onSubmit(
      drafts.map((draft, index) => ({
        id: draft.id,
        setNumber: index + 1,
        weightKg: decimalToApi(draft.weightKg),
        reps: draft.reps,
        isWarmup: draft.isWarmup,
        notes: draft.notes.trim() || null,
        clientCompletedAt: draft.clientCompletedAt,
      })),
    );
  }

  async function toggleSetCompleted(draft: SetDraft, index: number): Promise<void> {
    if (draft.completed) {
      // Reabrir nao desfaz o que ja foi salvo — so libera os campos para uma
      // nova correcao, que so vale de fato num novo toque em "Concluir".
      setDrafts((current) =>
        current.map((item) => (item.id === draft.id ? { ...item, completed: false } : item)),
      );
      return;
    }

    if (!draft.weightKg) {
      toast.error('Preencha a carga desta série antes de concluir.');
      return;
    }

    if (!onSetCompleted) return;

    setSavingSetId(draft.id);
    try {
      await onSetCompleted(draft.id, {
        sessionExerciseId: exercise.id,
        setNumber: index + 1,
        weightKg: decimalToApi(draft.weightKg),
        reps: draft.reps,
        isWarmup: draft.isWarmup,
        notes: draft.notes.trim() || null,
        clientCompletedAt: new Date().toISOString(),
      });
      setDrafts((current) =>
        current.map((item) => (item.id === draft.id ? { ...item, completed: true } : item)),
      );
    } catch {
      // Quem forneceu `onSetCompleted` ja comunica o erro (toast proprio).
    } finally {
      setSavingSetId(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Button
        type="button"
        className="w-full"
        variant="outline"
        disabled={loadingSuggestion}
        onClick={() => void applyLastPerformance()}
      >
        <History /> {loadingSuggestion ? 'Buscando...' : 'Usar última carga em todas'}
      </Button>

      <div className="flex flex-col gap-3">
        {drafts.map((draft, index) => (
          <div
            key={draft.id}
            className={cn(
              'rounded-2xl border p-3 transition-colors',
              draft.completed ? 'border-primary/50 bg-primary/10' : 'border-border bg-secondary/30',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold tabular">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold">Série {index + 1}</span>
              </div>
              <div className="flex items-center gap-1">
                {onSetCompleted ? (
                  <button
                    type="button"
                    aria-pressed={draft.completed}
                    aria-label={
                      draft.completed ? `Reabrir série ${index + 1}` : `Concluir série ${index + 1}`
                    }
                    disabled={savingSetId === draft.id}
                    onClick={() => void toggleSetCompleted(draft, index)}
                    className={cn(
                      'tap flex items-center gap-1 rounded-full px-3 text-xs font-semibold transition-colors disabled:opacity-60',
                      draft.completed
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Check className="size-3.5" />
                    {savingSetId === draft.id
                      ? 'Salvando...'
                      : draft.completed
                        ? 'Concluída'
                        : 'Concluir'}
                  </button>
                ) : null}
                {drafts.length > 1 && !draft.completed ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Remover série ${index + 1}`}
                    onClick={() =>
                      setDrafts((current) => current.filter((item) => item.id !== draft.id))
                    }
                  >
                    <Trash2 />
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="mt-3 grid min-w-0 grid-cols-1 gap-2 min-[360px]:grid-cols-2">
              <label className="min-w-0 text-xs text-muted-foreground">
                Carga
                <WeightInput
                  className="mt-1"
                  aria-label={`Carga da série ${index + 1}`}
                  value={draft.weightKg}
                  disabled={draft.completed}
                  onValueChange={(value) =>
                    setDrafts((current) =>
                      current.map((item) =>
                        item.id === draft.id ? { ...item, weightKg: value } : item,
                      ),
                    )
                  }
                  required
                />
              </label>
              <label className="min-w-0 text-xs text-muted-foreground">
                Repetições
                <IntegerInput
                  className="mt-1 tabular"
                  aria-label={`Repetições da série ${index + 1}`}
                  min={1}
                  max={500}
                  value={draft.reps}
                  disabled={draft.completed}
                  onValueChange={(value) =>
                    setDrafts((current) =>
                      current.map((item) =>
                        item.id === draft.id ? { ...item, reps: value } : item,
                      ),
                    )
                  }
                  required
                />
              </label>
            </div>

            <label className="tap mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={draft.isWarmup}
                disabled={draft.completed}
                onChange={(event) =>
                  setDrafts((current) =>
                    current.map((item) =>
                      item.id === draft.id ? { ...item, isWarmup: event.target.checked } : item,
                    ),
                  )
                }
              />
              Aquecimento
            </label>
          </div>
        ))}
      </div>

      <Button
        type="button"
        className="w-full"
        variant="outline"
        onClick={() =>
          setDrafts((current) => [...current, createDraft(current.length + 1, exercise.repMin)])
        }
      >
        <Plus /> Adicionar série
      </Button>

      <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
        {onCancel ? (
          <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
        <Button
          type="submit"
          size="lg"
          disabled={pending || drafts.length === 0}
          className={onCancel ? undefined : 'min-[360px]:col-span-2'}
        >
          {pending ? 'Salvando...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function ExerciseSetsModal({
  open,
  exercise,
  pending,
  onClose,
  onSubmit,
}: {
  readonly open: boolean;
  readonly exercise: SessionExercise;
  readonly pending: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (sets: ExerciseSetInput[]) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const pendingRef = useRef(pending);

  useEffect(() => {
    onCloseRef.current = onClose;
    pendingRef.current = pending;
  }, [onClose, pending]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pendingRef.current) onCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [exercise, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center bg-black/70 p-0 min-[480px]:items-center min-[480px]:p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`sets-title-${exercise.id}`}
        tabIndex={-1}
        className="safe-bottom safe-top flex max-h-dvh w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl min-[480px]:max-h-[90dvh] min-[480px]:rounded-3xl"
      >
        <div className="flex min-w-0 items-start justify-between gap-3 border-b border-border px-4 pb-3">
          <div className="min-w-0">
            <h2 id={`sets-title-${exercise.id}`} className="truncate text-lg font-bold">
              {exercise.exerciseName}
            </h2>
            <p className="text-sm text-muted-foreground">
              Informe carga e repetições de todas as séries.
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Fechar"
            disabled={pending}
            onClick={onClose}
          >
            <X />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <ExerciseSetsForm exercise={exercise} pending={pending} onSubmit={onSubmit} />
        </div>
      </div>
    </div>
  );
}

function createDrafts(exercise: SessionExercise): SetDraft[] {
  const existing = [...exercise.sets]
    .sort((left, right) => left.setNumber - right.setNumber)
    .map((set) => ({
      id: set.id,
      setNumber: set.setNumber,
      weightKg: normalizeDecimalInput(set.weightKg),
      reps: set.reps,
      isWarmup: set.isWarmup,
      notes: set.notes ?? '',
      clientCompletedAt: set.completedAt,
      // Ja veio salva do servidor/banco local: trava os campos por padrao.
      completed: true,
    }));
  const total = Math.max(exercise.targetSets, existing.length, 1);
  return Array.from(
    { length: total },
    (_, index) => existing[index] ?? createDraft(index + 1, exercise.repMin),
  );
}

function createDraft(setNumber: number, reps: number): SetDraft {
  return {
    id: crypto.randomUUID(),
    setNumber,
    weightKg: '',
    reps,
    isWarmup: false,
    notes: '',
    clientCompletedAt: new Date().toISOString(),
    completed: false,
  };
}
