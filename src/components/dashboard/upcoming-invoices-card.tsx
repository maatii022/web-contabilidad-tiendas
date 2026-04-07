import { CalendarClock } from 'lucide-react';

import { StatusBadge } from '@/components/ui/status-badge';
import { SectionCard } from '@/components/ui/section-card';
import { formatCurrency, formatDate } from '@/lib/utils';

const invoices = [
  {
    id: 1,
    vendor: 'Laboratorios Sierra',
    dueDate: '2026-04-08',
    amount: 1248.5,
    status: 'En 3 días',
    tone: 'warning' as const
  },
  {
    id: 2,
    vendor: 'Distribuciones Verde Salud',
    dueDate: '2026-04-12',
    amount: 684.9,
    status: 'En 7 días',
    tone: 'neutral' as const
  },
  {
    id: 3,
    vendor: 'BioPharm Canarias',
    dueDate: '2026-04-18',
    amount: 1932.4,
    status: 'Planificada',
    tone: 'success' as const
  }
];

export function UpcomingInvoicesCard() {
  return (
    <SectionCard className="h-full p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--foreground-soft)]">Vencimientos</p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">Facturas a vigilar</h2>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          <CalendarClock className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="rounded-[22px] border border-[rgba(123,136,95,0.14)] bg-[rgba(255,255,255,0.62)] p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{invoice.vendor}</p>
                <p className="mt-1 text-sm text-[var(--foreground-soft)]">Vence el {formatDate(invoice.dueDate)}</p>
              </div>
              <StatusBadge label={invoice.status} tone={invoice.tone} />
            </div>
            <p className="mt-4 text-lg font-semibold text-[var(--foreground)]">{formatCurrency(invoice.amount)}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
