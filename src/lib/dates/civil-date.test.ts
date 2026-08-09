import { describe, expect, it } from 'vitest';

import { addCivilDays, formatCivilDate, todayCivil } from './civil-date';

describe('datas civis', () => {
  it('nao converte a data local por UTC', () => {
    expect(todayCivil(new Date(2026, 7, 9, 0, 5))).toBe('2026-08-09');
  });

  it('avanca por calendario inclusive em ano bissexto', () => {
    expect(addCivilDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addCivilDays('2024-02-29', 1)).toBe('2024-03-01');
  });

  it('formata sem alterar o dia recebido', () => {
    expect(formatCivilDate('2026-08-09')).toMatch(/09/);
  });
});
