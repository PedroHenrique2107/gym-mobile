'use client';

import { PartyPopper, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

const CONFETTI_COLORS = [
  'var(--color-primary)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
];

const CONFETTI_COUNT = 60;
const AUTO_DISMISS_MS = 3_600;

interface ConfettiPiece {
  readonly left: number;
  readonly color: string;
  readonly width: number;
  readonly height: number;
  readonly duration: number;
  readonly delay: number;
}

/**
 * Comemoracao ao concluir um treino.
 *
 * Some sozinha apos `AUTO_DISMISS_MS`, ou ao toque em qualquer ponto — parada
 * no meio da tela impediria o proximo toque, que num app de treino costuma ser
 * a pressa de sair e guardar o celular.
 */
export function WorkoutCelebration({
  name,
  onDismiss,
}: {
  readonly name: string | null;
  readonly onDismiss: () => void;
}) {
  // Inicializador tardio do `useState`: roda uma unica vez, fora do corpo da
  // renderizacao em si — o lugar sancionado para uma inicializacao impura
  // (`Math.random`) que nao deve se repetir a cada render.
  const [pieces] = useState<ConfettiPiece[]>(() =>
    Array.from({ length: CONFETTI_COUNT }, () => {
      const width = 5 + Math.random() * 6;
      return {
        left: Math.random() * 100,
        color:
          CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] ??
          'var(--color-primary)',
        width,
        height: width * 0.4,
        duration: 2.2 + Math.random() * 1.6,
        delay: Math.random() * 0.5,
      };
    }),
  );

  useEffect(() => {
    const timer = window.setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4"
      onClick={onDismiss}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {pieces.map((piece, index) => (
          <span
            key={index}
            className="absolute top-0 rounded-sm"
            style={{
              left: `${piece.left}%`,
              width: piece.width,
              height: piece.height,
              backgroundColor: piece.color,
              animationName: 'confetti-fall',
              animationDuration: `${piece.duration}s`,
              animationDelay: `${piece.delay}s`,
              animationTimingFunction: 'linear',
              animationFillMode: 'forwards',
            }}
          />
        ))}
      </div>

      <div
        className="relative flex flex-col items-center gap-3 rounded-3xl border border-primary/40 bg-card p-6 text-center shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <Button
          size="icon"
          variant="ghost"
          aria-label="Fechar"
          className="absolute right-2 top-2"
          onClick={onDismiss}
        >
          <X />
        </Button>
        <span className="flex size-16 items-center justify-center rounded-full bg-primary/15 text-primary">
          <PartyPopper className="size-8" />
        </span>
        <div>
          <p className="text-lg font-bold">Treino concluído!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {name
              ? `Parabéns, ${name}! Mais um dia de treino no seu histórico.`
              : 'Parabéns! Mais um dia de treino no seu histórico.'}
          </p>
        </div>
      </div>
    </div>
  );
}
