'use client';

import { ErrorState } from '@/components/feedback/state-message';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api/problem';

import { useProfile } from './use-profile';

/**
 * Resumo do perfil autenticado.
 *
 * Primeira tela que consome dado real da API. Alem das preferencias, orienta o
 * usuario para as areas que concentram a execucao e o acompanhamento reais.
 */
export function ProfileSummary() {
  const { data: profile, isPending, isError, error, refetch } = useProfile();

  if (isPending) {
    return (
      <Card aria-busy="true">
        <span className="sr-only">Carregando seu perfil...</span>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <ErrorState
          title="Nao foi possivel carregar seu perfil"
          description={describe(error)}
          onRetry={() => {
            void refetch();
          }}
        />
      </Card>
    );
  }

  const primeiroNome = profile.fullName?.trim().split(/\s+/)[0];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{primeiroNome ? `Ola, ${primeiroNome}` : 'Sua conta'}</CardTitle>
          {profile.role === 'ADMIN' ? <Badge variant="primary">Administrador</Badge> : null}
        </div>

        <CardDescription className="mt-1">
          {profile.onboardingCompletedAt
            ? 'Perfil configurado.'
            : 'Complete seu perfil para receber sugestoes mais precisas.'}
        </CardDescription>

        <dl className="mt-4 flex flex-col gap-2 text-sm">
          <Row label="Objetivo" value={traduzirObjetivo(profile.goal)} />
          <Row label="Experiencia" value={traduzirExperiencia(profile.experience)} />
          <Row label="Treinos por semana" value={`${profile.weeklyFrequency}x`} />
          <Row label="Duracao da sessao" value={`${profile.sessionMinutes} min`} />
        </dl>
      </Card>

      <Card className="border-primary/30 bg-primary/5">
        <CardTitle className="text-primary">Seu treino em um so lugar</CardTitle>
        <CardDescription className="mt-1 leading-relaxed">
          Use Treinar para executar suas fichas, Agenda para organizar a semana e Progresso para
          acompanhar sessoes, medidas e fotos. Seus treinos preparados continuam disponiveis mesmo
          quando a conexao cair.
        </CardDescription>
      </Card>
    </div>
  );
}

function Row({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

/**
 * Tradução dos enums na interface.
 *
 * Os valores são estáveis em inglês no banco e no contrato de propósito: mudar
 * o idioma de um valor persistido exigiria migration de dados. A tradução vive
 * aqui, onde trocar uma palavra não afeta nada além do texto exibido.
 */
function traduzirObjetivo(goal: string): string {
  const mapa: Record<string, string> = {
    HYPERTROPHY: 'Hipertrofia',
    STRENGTH: 'Forca',
    WEIGHT_LOSS: 'Emagrecimento',
    RECOMPOSITION: 'Recomposicao',
    CONDITIONING: 'Condicionamento',
    HEALTH: 'Saude',
  };

  return mapa[goal] ?? goal;
}

function traduzirExperiencia(level: string): string {
  const mapa: Record<string, string> = {
    BEGINNER: 'Iniciante',
    INTERMEDIATE: 'Intermediario',
    ADVANCED: 'Avancado',
  };

  return mapa[level] ?? level;
}

/** `ApiError.message` já é texto seguro em pt-BR vindo do backend. */
function describe(error: unknown): string {
  if (error instanceof ApiError) {
    return error.status === 0
      ? 'Sem conexao com o servidor. Verifique sua internet.'
      : error.message;
  }

  return 'Falha inesperada ao carregar o perfil.';
}
