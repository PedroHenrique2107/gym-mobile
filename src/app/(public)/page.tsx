import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  CloudOff,
  Dumbbell,
  History,
  LockKeyhole,
  NotebookTabs,
  Play,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  UsersRound,
} from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';

const landingDescription =
  'Planeje fichas e agenda, registre séries e cargas e acompanhe sua evolução em um aplicativo de treino feito para o celular.';

export const metadata: Metadata = {
  title: { absolute: 'GymFlow | Seu treino, do planejamento à evolução' },
  description: landingDescription,
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName: 'GymFlow',
    title: 'GymFlow | Seu treino, do planejamento à evolução',
    description: landingDescription,
    images: [
      {
        url: '/icons/gymflow-1024.png',
        width: 1024,
        height: 1024,
        alt: 'Símbolo verde-limão do GymFlow sobre fundo grafite',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'GymFlow | Seu treino, do planejamento à evolução',
    description: landingDescription,
    images: ['/icons/gymflow-1024.png'],
  },
};

const FEATURES = [
  {
    icon: NotebookTabs,
    title: 'Fichas organizadas',
    description:
      'Monte, edite e duplique fichas com séries, repetições, descanso e exercícios em ordem.',
  },
  {
    icon: CalendarDays,
    title: 'Agenda semanal',
    description:
      'Associe fichas aos dias da semana e ajuste exceções sem perder sua rotina principal.',
  },
  {
    icon: Play,
    title: 'Execução sem distrações',
    description:
      'Registre cargas e repetições, acompanhe as séries e conclua cada exercício em um único fluxo.',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Evolução visível',
    description:
      'Consulte histórico, volume, ofensiva diária e recordes pessoais pela maior carga levantada.',
  },
  {
    icon: History,
    title: 'Histórico que continua útil',
    description:
      'Revise treinos concluídos e corrija datas, observações, cargas ou repetições quando precisar.',
  },
  {
    icon: CloudOff,
    title: 'Treino mesmo sem sinal',
    description:
      'Continue registrando durante uma conexão instável e sincronize as alterações ao reconectar.',
  },
] as const;

const STEPS = [
  {
    number: '01',
    title: 'Organize',
    description: 'Crie suas fichas e distribua os treinos na agenda.',
  },
  {
    number: '02',
    title: 'Execute',
    description: 'Registre cada série com a carga e as repetições realizadas.',
  },
  {
    number: '03',
    title: 'Acompanhe',
    description: 'Use histórico, recordes, medidas e fotos para observar sua evolução.',
  },
] as const;

/** Landing institucional publica; toda a experiencia autenticada comeca em `/inicio`. */
export default function LandingPage() {
  return (
    <main id="conteudo" className="min-h-dvh overflow-hidden">
      <div className="relative isolate">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[-22rem] -z-10 size-[42rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl"
        />

        <header className="safe-top mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 pb-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-3" aria-label="GymFlow — início">
            <Image
              src="/icons/icon-192.png"
              width={44}
              height={44}
              alt=""
              priority
              className="rounded-xl"
            />
            <span className="text-lg font-bold tracking-tight">GymFlow</span>
          </Link>

          <Link href="/inicio" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
            Entrar <ArrowRight aria-hidden="true" />
          </Link>
        </header>

        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-28 lg:pt-20">
          <div className="flex max-w-2xl flex-col items-start">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="size-4" aria-hidden="true" />
              Seu treino em um só lugar
            </div>

            <h1 className="text-5xl font-black tracking-[-0.06em] text-balance sm:text-6xl lg:text-7xl">
              GymFlow
            </h1>
            <p className="mt-4 max-w-xl text-2xl font-semibold leading-tight tracking-tight text-balance sm:text-3xl">
              Do planejamento à última série, acompanhe a sua evolução.
            </p>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Fichas, agenda, execução e progresso conectados em uma experiência mobile feita para
              manter o foco no que importa: treinar com consistência.
            </p>

            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link href="/inicio" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
                Entrar no aplicativo <ArrowRight aria-hidden="true" />
              </Link>
              <a href="#recursos" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                Conhecer recursos
              </a>
            </div>

            <ul className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              {['Instalável no celular', 'Suporte offline', 'Histórico individual'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <AppPreview />
        </section>
      </div>

      <section
        id="recursos"
        aria-labelledby="features-title"
        className="border-y border-border bg-card/35"
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Recursos</p>
            <h2 id="features-title" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Tudo que acompanha o seu treino
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Uma jornada contínua, do primeiro planejamento ao histórico que orienta o próximo
              treino.
            </p>
          </div>

          <article className="mt-10 grid gap-4 rounded-2xl border border-primary/30 bg-primary/8 p-5 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-5 sm:p-6">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <UsersRound className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-lg font-semibold">Workout Jam ao vivo</h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Com conexão ativa, um ADMIN inicia a Jam e o outro usuário aceita o convite por um
                link ou código temporário. A partir daí, ambos veem de quem é cada série e podem
                registrar cargas e repetições um para o outro ao vivo.
              </p>
            </div>
          </article>

          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/35"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="flow-title"
        className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28"
      >
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="max-w-lg lg:sticky lg:top-10">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
              Como funciona
            </p>
            <h2 id="flow-title" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Um fluxo simples para manter a constância
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              O GymFlow conecta o que você planejou ao que realmente executou, sem espalhar seus
              registros por várias telas desconectadas.
            </p>
          </div>

          <ol className="grid gap-4">
            {STEPS.map((step) => (
              <li
                key={step.number}
                className="grid grid-cols-[auto_1fr] gap-4 rounded-2xl border border-border bg-card p-5 sm:gap-6 sm:p-6"
              >
                <span className="text-2xl font-black tabular text-primary" aria-hidden="true">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="privacy-title" className="border-y border-border bg-card/35">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center lg:px-10 lg:py-24">
          <div>
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </span>
            <h2 id="privacy-title" className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Seu treino pertence a você
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
              O acesso ao aplicativo é autenticado. Fichas, sessões, medidas e fotos ficam
              vinculadas à conta certa e não fazem parte da apresentação pública.
            </p>
          </div>

          <div className="grid gap-3">
            <SecurityItem
              icon={LockKeyhole}
              title="Acesso autenticado"
              description="As áreas de treino exigem uma sessão válida antes de mostrar dados pessoais."
            />
            <SecurityItem
              icon={Target}
              title="Registros individualizados"
              description="Histórico e evolução permanecem associados ao perfil que realizou o treino."
            />
            <SecurityItem
              icon={Smartphone}
              title="Experiência mobile-first"
              description="Interface responsiva, áreas seguras do iPhone e instalação como PWA."
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-primary/10 p-6 sm:p-10 lg:p-12">
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-24 size-72 rounded-full bg-primary/15 blur-3xl"
          />
          <div className="relative max-w-2xl">
            <Dumbbell className="size-8 text-primary" aria-hidden="true" />
            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Seu próximo treino começa aqui
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground sm:text-lg">
              Entre com sua conta para organizar a rotina, registrar suas séries e acompanhar cada
              etapa da evolução.
            </p>
            <Link
              href="/inicio"
              className={`${buttonVariants({ variant: 'primary', size: 'lg' })} mt-7 sm:w-auto`}
            >
              Entrar no aplicativo <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <div className="flex items-center gap-2">
            <Image src="/icons/icon-32.png" width={24} height={24} alt="" className="rounded-md" />
            <span>GymFlow · Treino e evolução no seu ritmo.</span>
          </div>
          <nav aria-label="Links do rodapé" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/status" className="hover:text-foreground">
              Status da API
            </Link>
            <Link href="/inicio" className="font-semibold text-primary hover:text-primary/80">
              Entrar
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function AppPreview() {
  return (
    <figure
      aria-label="Prévia ilustrativa da tela de treino do GymFlow"
      className="relative mx-auto w-full max-w-md"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-10 bottom-0 h-24 rounded-full bg-primary/20 blur-3xl"
      />
      <div className="relative rounded-[2rem] border border-white/15 bg-card/95 p-3 shadow-2xl shadow-black/40">
        <div className="overflow-hidden rounded-[1.45rem] border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Dumbbell className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Treino em andamento</p>
                <p className="text-sm font-semibold">Superiores</p>
              </div>
            </div>
            <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
              Ativo
            </span>
          </div>

          <div className="space-y-3 p-4 sm:p-5">
            <div className="rounded-2xl border border-primary/25 bg-primary/8 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-primary">Exercício atual</p>
                  <p className="mt-1 font-semibold">Supino reto</p>
                </div>
                <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
                  3 séries
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[1, 2, 3].map((set) => (
                  <div
                    key={set}
                    className="rounded-xl border border-border bg-background/70 px-2 py-3 text-center"
                  >
                    <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                      Série {set}
                    </p>
                    <p className="mt-1 text-sm font-bold">Carga + reps</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                Registrar séries
              </div>
            </div>

            {['Desenvolvimento', 'Tríceps na polia'].map((exercise) => (
              <div
                key={exercise}
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <Dumbbell className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium">{exercise}</span>
                </div>
                <span className="text-xs text-muted-foreground">A seguir</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="sr-only">
        Exemplo da execução de uma ficha com exercícios e registro conjunto das séries.
      </figcaption>
    </figure>
  );
}

function SecurityItem({
  icon: Icon,
  title,
  description,
}: {
  readonly icon: typeof LockKeyhole;
  readonly title: string;
  readonly description: string;
}) {
  return (
    <article className="flex gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </article>
  );
}
