import { describe, expect, it } from 'vitest';

import { ApiError } from './problem';
import { describeApiError, requireApiData, requireApiSuccess } from './result';

describe('resultado da API', () => {
  it('prioriza a mensagem do primeiro campo invalido', () => {
    const error = new ApiError({
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Revise os campos.',
      fieldErrors: { name: ['Informe um nome valido.'] },
    });

    expect(describeApiError(error, 'Falha.')).toBe('Informe um nome valido.');
  });

  it('orienta recarregar em conflito de versao', () => {
    const error = new ApiError({
      status: 409,
      code: 'RESOURCE_VERSION_CONFLICT',
      message: 'Conflito.',
    });

    expect(describeApiError(error, 'Falha.')).toContain('outro dispositivo');
  });

  it('aceita corpo presente e sucesso sem corpo', () => {
    expect(requireApiData({ id: '1' }, undefined, 'ler')).toEqual({ id: '1' });
    expect(() => requireApiSuccess(undefined, 'excluir')).not.toThrow();
  });

  it('nao aceita resposta sem o corpo contratado', () => {
    expect(() => requireApiData(undefined, undefined, 'ler')).toThrow('Resposta inesperada');
    expect(() => requireApiSuccess({ status: 500 }, 'excluir')).toThrow('Resposta inesperada');
  });
});
