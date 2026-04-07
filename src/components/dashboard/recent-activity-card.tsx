import { Clock3 } from 'lucide-react';

import { SectionCard } from '@/components/ui/section-card';

const activity = [
  'Se ha registrado un gasto de reposición de mostrador.',
  'Se ha conciliado el ingreso diario de caja.',
  'Se ha revisado una factura con pago parcial pendiente.',
  'La configuración base del negocio está lista para conectarse a datos reales.'
];

export function RecentActivityCard() {
  return (
    <SectionCard className="p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          <Clock3 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--foreground-soft)]">Actividad</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">Últimos movimientos</h2>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {activity.map((item) => (
          <div
            key={item}
            className="rounded-[20px] border border-[rgba(123,136,95,0.12)] bg-[rgba(255,255,255,0.55)] px-4 py-3 text-sm leading-6 text-[var(--foreground)]"
          >
            {item}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
