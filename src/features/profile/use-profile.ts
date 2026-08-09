'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/client';
import type { paths } from '@/lib/api/generated/types';
import { ApiError } from '@/lib/api/problem';

export const profileKeys = {
  me: ['profile', 'me'] as const,
};

/**
 * Perfil, derivado diretamente do contrato publicado.
 *
 * A derivação é pelo caminho no `paths`, e não pelo retorno inferido do cliente:
 * a inferência resolvia para o schema errado quando mais de uma rota casava, e o
 * erro só aparecia como "propriedade não existe" num campo válido — sintoma que
 * não aponta para a causa.
 */
export type Profile = paths['/api/v1/me']['get']['responses'][200]['content']['application/json'];

/**
 * Perfil do usuário autenticado.
 *
 * O tipo vem do contrato do `gym-service`, não de uma interface escrita à mão.
 * Se o backend mudar um campo de forma incompatível, o `typecheck` quebra aqui —
 * que é exatamente onde a divergência precisa aparecer.
 */
export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/me');

      if (error || !data) {
        // O middleware do cliente já converte falhas em `ApiError`. Chegar aqui
        // com `error` preenchido e sem exceção significaria contrato quebrado.
        throw error instanceof ApiError ? error : new Error('Resposta inesperada de /me');
      }

      return data;
    },
    // O perfil muda pouco, e uma janela maior evita refetch a cada troca de aba
    // durante um treino.
    staleTime: 60_000,
  });
}
