import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BottomNav } from './bottom-nav';

const usePathname = vi.hoisted(() => vi.fn<() => string>());

vi.mock('next/navigation', () => ({ usePathname }));

describe('BottomNav', () => {
  beforeEach(() => {
    usePathname.mockReturnValue('/inicio');
  });

  it('expoe as cinco areas principais', () => {
    render(<BottomNav />);

    for (const label of ['Inicio', 'Treinar', 'Agenda', 'Progresso', 'Perfil']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('tem rotulo acessivel na navegacao', () => {
    render(<BottomNav />);
    expect(screen.getByRole('navigation', { name: 'Navegacao principal' })).toBeInTheDocument();
  });

  it('marca a area atual com aria-current', () => {
    // Cor sozinha nao comunica o item ativo para leitor de tela.
    usePathname.mockReturnValue('/agenda');
    render(<BottomNav />);

    expect(screen.getByRole('link', { name: 'Agenda' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current');
  });

  it('mantem a area ativa em rotas filhas', () => {
    // `/treinos/abc` deve continuar destacando Treinar.
    usePathname.mockReturnValue('/treinar/nova');
    render(<BottomNav />);

    expect(screen.getByRole('link', { name: 'Treinar' })).toHaveAttribute('aria-current', 'page');
  });

  it('aplica o alvo minimo de toque em todos os itens', () => {
    render(<BottomNav />);

    for (const link of screen.getAllByRole('link')) {
      expect(link.className).toContain('tap');
    }
  });
});
