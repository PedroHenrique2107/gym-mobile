'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { createQueryClient } from './query-client';

/**
 * Provider do TanStack Query.
 *
 * O cliente e criado em `useState` e nao em modulo. Em SSR, um cliente de
 * modulo seria compartilhado entre requisicoes de usuarios diferentes — dado
 * privado de um apareceria para outro. `useState` garante uma instancia por
 * arvore de renderizacao.
 */
export function QueryProvider({ children }: { readonly children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
