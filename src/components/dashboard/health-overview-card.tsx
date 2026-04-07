import { ArrowRight, BadgeEuro, ShieldCheck } from 'lucide-react';

import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';

export function HealthOverviewCard() {
  return (
    <SectionCard className="h-full p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--foreground-soft)]">Estado general</p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">Resumen operativo</h2>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          <ShieldCheck className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="rounded-[22px] border border-[rgba(123,136,95,0.14)] bg-[rgba(255,255,255,0.62)] p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-[var(--foreground-soft)]">Tensión de pagos</p>
            <StatusBadge label="Controlada" tone="success" />
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--foreground)]">
            Las próximas obligaciones están repartidas y no concentran riesgo en una sola semana.
          </p>
        </div>

        <div className="rounded-[22px] border border-[rgba(123,136,95,0.14)] bg-[rgba(255,255,255,0.62)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(85,117,82,0.12)] text-[var(--success)]">
              <BadgeEuro className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Liquidez estimada positiva</p>
              <p className="text-sm text-[var(--foreground-soft)]">Caja y banco aguantan el cierre de mes previsto.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[22px] border border-dashed border-[rgba(123,136,95,0.22)] bg-[rgba(255,255,255,0.46)] px-4 py-3 text-sm text-[var(--foreground-soft)]">
          <span>En fase 2 conectaremos datos reales de Supabase</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </SectionCard>
  );
}
