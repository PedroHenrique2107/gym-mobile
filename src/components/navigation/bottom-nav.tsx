'use client';

import { CalendarDays, Dumbbell, House, LineChart, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

/**
 * Cinco areas principais, conforme o plano.
 *
 * Biblioteca e gerenciamento de fichas nao entram aqui: sao acessados a partir
 * de Treinar. Seis ou mais alvos em 360 px de largura deixariam cada um abaixo
 * do minimo de 44 px.
 */
const TABS = [
  { href: '/inicio', label: 'Início', icon: House },
  { href: '/treinar', label: 'Treinar', icon: Dumbbell },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/progresso', label: 'Progresso', icon: LineChart },
  { href: '/perfil', label: 'Perfil', icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur"
    >
      <ul className="safe-bottom mx-auto flex max-w-md items-stretch justify-between px-2 pt-1">
        {TABS.map(({ href, label, icon: Icon }) => {
          // Prefixo, e nao igualdade: `/treinos/abc` deve manter Treinar ativo.
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                // Comunica o item atual a leitores de tela; cor sozinha nao faz isso.
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'tap flex flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-medium',
                  'transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
