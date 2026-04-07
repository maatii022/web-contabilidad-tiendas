import { CalendarClock } from 'lucide-react';
import { EmptyDashboardState } from '@/components/dashboard/empty-dashboard-state';
import { StatusPill } from '@/components/dashboard/status-pill';
import { getInvoiceDueLabel, getInvoiceTone } from '@/features/dashboard/mappers';
import type { UpcomingInvoiceItem } from '@/features/dashboard/types';
import { formatCurrency, formatDate } from '@/lib/utils';
export function UpcomingInvoicesList({ items, currency }: { items: UpcomingInvoiceItem[]; currency: string; }) {
  if (items.length === 0) return <EmptyDashboardState icon={CalendarClock} title="No hay facturas próximas a vencer" description="Cuando registres facturas de proveedor con vencimiento, esta lista te avisará de las obligaciones más cercanas." />;
  return <div className="space-y-3">{items.map((item) => <div key={item.id} className="dashboard-row flex flex-col gap-4 rounded-[22px] border border-[rgba(123,136,95,0.12)] bg-[rgba(255,255,255,0.58)] px-4 py-4 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold text-[var(--foreground)]">{item.vendorName}</p><StatusPill label={getInvoiceDueLabel(item.daysUntilDue)} tone={getInvoiceTone(item.daysUntilDue)} /></div><p className="mt-2 text-sm text-[var(--foreground-soft)]">Factura {item.invoiceNumber}, vence el {formatDate(item.dueDate)}</p></div><div className="shrink-0 text-left md:text-right"><p className="text-base font-semibold tracking-[-0.02em] text-[var(--foreground)]">{formatCurrency(item.total, currency)}</p><p className="mt-1 text-sm text-[var(--foreground-soft)]">Pendiente de salida</p></div></div>)}</div>;
}
