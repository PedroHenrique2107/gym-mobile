import { describe, expect, it } from 'vitest';

import { decimalToApi, formatKilograms, normalizeDecimalInput } from './numeric-input';

describe('numeric input helpers', () => {
  it('remove letras e limita a carga a duas casas decimais', () => {
    expect(normalizeDecimalInput('12kg,345')).toBe('12.34');
  });

  it('normaliza a carga para o contrato decimal da API', () => {
    expect(decimalToApi('52,5')).toBe('52.50');
  });

  it('atualiza a apresentacao em kg sem alterar o valor digitado', () => {
    expect(formatKilograms('52.5')).toBe('52,5 kg');
    expect(formatKilograms('')).toBe('0 kg');
  });
});
