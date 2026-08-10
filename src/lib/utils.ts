import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes resolvendo conflitos do Tailwind.
 *
 * `clsx` monta a lista e `twMerge` garante que a ultima classe do mesmo grupo
 * vence — sem isso, `cn('p-2', 'p-4')` produziria as duas e o resultado
 * dependeria da ordem no CSS gerado.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
