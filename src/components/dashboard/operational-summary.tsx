import { ShieldCheck } from 'lucide-react';
import { EmptyDashboardState } from '@/components/dashboard/empty-dashboard-state';
import { StatusPill } from '@/components/dashboard/status-pill';
import type { SummaryInsight } from '@/features/dashboard/types';
export function OperationalSummary({ items }: { items: SummaryInsight[]; }) {
  if (items.length === 0) return <EmptyDashboardState icon={ShieldCheck} title="Aún no hay resumen operativo" description="El panel generará prioridades automáticamente en cuanto existan facturas, movimientos y cuentas activas." />;
  return <div className="space-y-3">{items.map((item) => <div key={item.id} className="dashboard-row rounded-[20px] border border-[rgba(123,136,95,0.12)] bg-[rgba(255,255,255,0.56)] px-4 py-4"><div className="flex items-center gap-2"><p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p><StatusPill label="Prioridad" tone={item.tone} /></div><p className="mt-2 text-sm leading-6 text-[var(--foreground-soft)]">{item.description}</p></div>)}</div>;
}
