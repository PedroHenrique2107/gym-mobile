export interface ExerciseDeletionAvailability {
  readonly activeSessionCount: number;
  readonly canDelete: boolean;
  readonly templateCount: number;
}

/** Espelha a comparacao confirmada pelo backend: trim e caixa nao bloqueiam a confirmacao. */
export function exerciseNamesMatch(value: string, expected: string): boolean {
  return value.trim().toLocaleLowerCase('pt-BR') === expected.trim().toLocaleLowerCase('pt-BR');
}

/** Deriva os estados que controlam aviso de fichas e bloqueio da exclusao. */
export function getExerciseDeletionState(impact: ExerciseDeletionAvailability) {
  return {
    hasTemplateReferences: impact.templateCount > 0,
    blocked: !impact.canDelete || impact.activeSessionCount > 0,
  } as const;
}
