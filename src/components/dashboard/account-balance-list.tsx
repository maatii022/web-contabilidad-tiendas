import { Landmark } from 'lucide-react';
import { EmptyDashboardState } from '@/components/dashboard/empty-dashboard-state';
import { StatusPill } from '@/components/dashboard/status-pill';
import { getAccountTypeLabel } from '@/features/dashboard/mappers';
import type { AccountBalanceItem } from '@/features/dashboard/types';
import { formatCurrency } from '@/lib/utils';
export function AccountBalanceList({ items, currency }: { items: AccountBalanceItem[]; currency: string; }) {
  if (items.length === 0) return <EmptyDashboardState icon={Landmark} title="No hay cuentas operativas activas" description="Configura caja, banco o efectivo y el panel empezará a consolidar saldos desde sus movimientos." />;
  return <div className="space-y-3">{items.map((item) => <div key={item.id} className="dashboard-row flex items-center justify-between gap-3 rounded-[20px] border border-[rgba(123,136,95,0.12)] bg-[rgba(255,255,255,0.56)] px-4 py-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold text-[var(--foreground)]">{item.name}</p>{item.isPrimary ? <StatusPill label="Principal" tone="info" /> : null}</div><p className="mt-2 text-sm text-[var(--foreground-soft)]">{getAccountTypeLabel(item.type)}</p></div><p className="shrink-0 text-sm font-semibold tracking-[-0.02em] text-[var(--foreground)]">{formatCurrency(item.balance, currency)}</p></div>)}</div>;
}
