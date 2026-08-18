import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Construction, Inbox, WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StateMessageProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
  readonly tone?: 'neutral' | 'danger';
  readonly className?: string;
  /**
   * Elemento do titulo.
   *
   * `p` por padrao, porque em geral este bloco aparece **dentro** de uma pagina
   * que ja tem seu `h1`, e um segundo `h1` competiria com ele. Quando o bloco e
   * o conteudo principal — 404, tela de erro — passe `h1`: sem um, o leitor de
   * tela nao tem como anunciar em que pagina o usuario esta.
   */
  readonly titleAs?: 'h1' | 'h2' | 'p';
}

/**
 * Bloco de estado nao-conteudo: vazio, erro, offline, em construcao.
 *
 * Um unico componente para os quatro casos porque a diferenca entre eles e
 * apenas icone, texto e acao. Componentes separados divergiriam em espacamento
 * e em como anunciam o estado para leitores de tela.
 */
export function StateMessage({
  icon: Icon,
  title,
  description,
  action,
  tone = 'neutral',
  className,
  titleAs: TitleTag = 'p',
}: StateMessageProps) {
  return (
    <div
      // `status` para estado informativo, `alert` para falha: o segundo
      // interrompe o leitor de tela, e interromper por uma lista vazia seria
      // agressivo demais.
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex flex-col items-center gap-3 px-6 py-10 text-center', className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex size-12 items-center justify-center rounded-full',
          tone === 'danger'
            ? 'bg-destructive/15 text-destructive'
            : 'bg-secondary text-muted-foreground',
        )}
      >
        <Icon className="size-6" />
      </span>

      <div className="flex flex-col gap-1">
        <TitleTag
          className={cn(
            'font-semibold text-foreground',
            TitleTag === 'h1' ? 'text-xl tracking-tight' : 'text-base',
          )}
        >
          {title}
        </TitleTag>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {action}
    </div>
  );
}

export function EmptyState(props: Omit<StateMessageProps, 'icon' | 'tone'>) {
  return <StateMessage icon={Inbox} tone="neutral" {...props} />;
}

/**
 * Falha recuperavel.
 *
 * `onRetry` e opcional porque nem toda falha e nova tentativa: um `403` nao
 * melhora ao repetir, e oferecer o botao ali ensinaria o usuario a insistir em
 * algo que nunca vai funcionar.
 */
export function ErrorState({
  title = 'Não foi possível carregar',
  description,
  onRetry,
  retryLabel = 'Tentar novamente',
  titleAs,
}: {
  readonly title?: string;
  readonly description?: string;
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
  readonly titleAs?: 'h1' | 'h2' | 'p';
}) {
  return (
    <StateMessage
      icon={AlertTriangle}
      tone="danger"
      title={title}
      {...(titleAs === undefined ? {} : { titleAs })}
      {...(description === undefined ? {} : { description })}
      {...(onRetry
        ? {
            action: (
              <Button variant="outline" onClick={onRetry}>
                {retryLabel}
              </Button>
            ),
          }
        : {})}
    />
  );
}

export function OfflineState({ description }: { readonly description?: string }) {
  return (
    <StateMessage
      icon={WifiOff}
      title="Sem conexão"
      description={description ?? 'Verifique sua internet e tente novamente.'}
    />
  );
}

/**
 * Funcionalidade ainda nao construida.
 *
 * Existe para que uma rota navegavel diga a verdade sobre o proprio estado. A
 * alternativa — preencher a tela com dados de exemplo — daria a impressao de
 * uma funcionalidade pronta e tornaria impossivel saber, olhando o app, o que
 * de fato funciona.
 */
export function NotBuiltYetState({
  feature,
  phase,
  description,
}: {
  readonly feature: string;
  readonly phase: string;
  readonly description?: string;
}) {
  return (
    <StateMessage
      icon={Construction}
      title={`${feature} ainda não foi implementado`}
      description={
        description ??
        `Esta tela existe para validar a navegação. A funcionalidade entra na fase ${phase} e nenhum dado é exibido aqui até lá.`
      }
    />
  );
}
