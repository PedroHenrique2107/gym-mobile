'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchApiHealth, fetchApiReadiness } from '@/lib/api/health';

export const apiStatusKeys = {
  health: ['api', 'health'] as const,
  readiness: ['api', 'readiness'] as const,
};

/**
 * Opcoes comuns das consultas de diagnostico.
 *
 * `retry: false` contraria o padrao global de proposito. A politica geral
 * repete erro de rede tres vezes com backoff, o que e correto para uma consulta
 * de dados — mas aqui atrasaria em mais de sete segundos a unica informacao que
 * a tela existe para dar. Quem abre o diagnostico quer saber **agora** se a API
 * respondeu; o botao "Verificar novamente" deixa a nova tentativa na mao do
 * usuario, onde ela pertence.
 *
 * `staleTime: 0` porque estado de infraestrutura muda a qualquer momento, e um
 * cache mostraria "online" depois de a API cair.
 */
const DIAGNOSTIC_QUERY_OPTIONS = {
  retry: false,
  staleTime: 0,
  gcTime: 0,
} as const;

/**
 * Le o estado real do `gym-service`.
 *
 * Nao existe valor de fallback nem dado de exemplo: se a API estiver fora, a
 * consulta falha e a interface mostra a falha. Um placeholder "online" tornaria
 * a tela inutil justamente quando ela precisa servir para algo.
 */
export function useApiHealth() {
  return useQuery({
    queryKey: apiStatusKeys.health,
    queryFn: fetchApiHealth,
    ...DIAGNOSTIC_QUERY_OPTIONS,
  });
}

export function useApiReadiness() {
  return useQuery({
    queryKey: apiStatusKeys.readiness,
    queryFn: fetchApiReadiness,
    ...DIAGNOSTIC_QUERY_OPTIONS,
  });
}
