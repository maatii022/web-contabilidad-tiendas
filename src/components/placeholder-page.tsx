import { ArrowRight, LockKeyhole, PanelsTopLeft, Sparkles } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/ui/section-card';

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  moduleLabel,
  nextStep
}: {
  eyebrow: string;
  title: string;
  description: string;
  moduleLabel: string;
  nextStep: string;
}) {
  return (
    <div className="page-grid gap-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={<Button variant="secondary">Fase siguiente</Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <SectionCard className="p-6 md:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              <PanelsTopLeft className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">Módulo reservado para implementación</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--foreground-soft)]">
                La estructura visual y de navegación ya está cerrada. En la siguiente fase conectaremos formularios, datos reales, tablas y acciones concretas sin tocar la base del layout.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border border-[rgba(123,136,95,0.14)] bg-[rgba(255,255,255,0.58)] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--foreground-soft)]">Módulo</p>
              <p className="mt-3 text-lg font-semibold text-[var(--foreground)]">{moduleLabel}</p>
            </div>
            <div className="rounded-[22px] border border-[rgba(123,136,95,0.14)] bg-[rgba(255,255,255,0.58)] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--foreground-soft)]">Siguiente entrega</p>
              <p className="mt-3 text-lg font-semibold text-[var(--foreground)]">{nextStep}</p>
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-6">
          <SectionCard className="p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-[var(--accent-strong)]" />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Base premium ya fijada</h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--foreground-soft)]">
              La app ya tiene identidad visual, jerarquía, distribución, navegación y punto de partida comercial coherente con el producto final.
            </p>
          </SectionCard>

          <SectionCard className="p-6">
            <div className="flex items-center gap-3">
              <LockKeyhole className="h-5 w-5 text-[var(--accent-strong)]" />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Seguridad estructural lista</h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--foreground-soft)]">
              Login, proxy, SSR con cookies y separación entre área pública y privada ya están listos para enlazar RLS y datos reales en Supabase.
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[var(--accent-strong)]">
              Continuamos sin rehacer base
              <ArrowRight className="h-4 w-4" />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
