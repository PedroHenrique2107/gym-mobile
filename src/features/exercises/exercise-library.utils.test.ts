import { describe, expect, it } from 'vitest';

import { exerciseNamesMatch, getExerciseDeletionState } from './exercise-library.utils';

describe('exerciseNamesMatch', () => {
  it('aceita o mesmo nome sem diferenciar caixa ou espacos externos', () => {
    expect(exerciseNamesMatch('  SUPINO Reto  ', 'Supino reto')).toBe(true);
    expect(exerciseNamesMatch('ROSCA BÍCEPS', 'Rosca bíceps')).toBe(true);
  });

  it('preserva acentos e exige o nome completo', () => {
    expect(exerciseNamesMatch('Rosca biceps', 'Rosca bíceps')).toBe(false);
    expect(exerciseNamesMatch('Supino', 'Supino reto')).toBe(false);
  });
});

describe('getExerciseDeletionState', () => {
  it('avisa quando o exercicio esta referenciado por fichas', () => {
    expect(
      getExerciseDeletionState({ templateCount: 3, activeSessionCount: 0, canDelete: true }),
    ).toEqual({ hasTemplateReferences: true, blocked: false });
  });

  it('bloqueia enquanto uma sessao ativa usa o exercicio', () => {
    expect(
      getExerciseDeletionState({ templateCount: 0, activeSessionCount: 1, canDelete: true }),
    ).toEqual({ hasTemplateReferences: false, blocked: true });
  });

  it('respeita um bloqueio informado pelo servidor mesmo sem sessao ativa', () => {
    expect(
      getExerciseDeletionState({ templateCount: 0, activeSessionCount: 0, canDelete: false }),
    ).toEqual({ hasTemplateReferences: false, blocked: true });
  });
});
