import type { AccountBalanceItem, DashboardStats, SummaryInsight, SummaryTone, UpcomingInvoiceItem } from '@/features/dashboard/types';
function pluralize(value: number, singular: string, plural: string) { return value === 1 ? singular : plural; }
export function getInvoiceDueLabel(daysUntilDue: number) { if (daysUntilDue < 0) { const overdueDays = Math.abs(daysUntilDue); return overdueDays === 1 ? 'Vencida ayer' : `Vencida hace ${overdueDays} días`; } if (daysUntilDue === 0) return 'Vence hoy'; if (daysUntilDue === 1) return 'Vence mañana'; return `En ${daysUntilDue} días`; }
export function getInvoiceTone(daysUntilDue: number): SummaryTone { if (daysUntilDue < 0) return 'danger'; if (daysUntilDue <= 3) return 'warning'; return 'neutral'; }
export function getAccountTypeLabel(type: AccountBalanceItem['type']) { switch (type) { case 'bank': return 'Banco'; case 'cash': return 'Caja'; default: return 'Efectivo'; } }
export function buildOperationalSummary({ stats, upcomingInvoices, accountBalances }: { stats: DashboardStats; upcomingInvoices: UpcomingInvoiceItem[]; accountBalances: AccountBalanceItem[]; }): SummaryInsight[] {
  const insights: SummaryInsight[] = [];
  if (stats.overdueInvoices > 0) insights.push({ id: 'overdue', title: `${stats.overdueInvoices} ${pluralize(stats.overdueInvoices, 'factura vencida', 'facturas vencidas')}`, description: 'Conviene revisar pagos pendientes y priorizar las obligaciones ya superadas para evitar tensión operativa.', tone: 'danger' });
  else if (stats.pendingInvoices > 0) insights.push({ id: 'pending', title: `${stats.pendingInvoices} ${pluralize(stats.pendingInvoices, 'factura pendiente', 'facturas pendientes')}`, description: 'No hay vencimientos pasados. El foco debe estar en repartir pagos y mantener visibilidad de la tesorería.', tone: 'warning' });
  else insights.push({ id: 'clear', title: 'Sin facturas críticas ahora mismo', description: 'El negocio no tiene obligaciones abiertas registradas en el panel, así que puedes centrarte en alimentar datos reales.', tone: 'success' });
  if (upcomingInvoices.length > 0) { const firstInvoice = upcomingInvoices[0]; insights.push({ id: 'upcoming', title: `Próximo vencimiento: ${firstInvoice.vendorName}`, description: `${getInvoiceDueLabel(firstInvoice.daysUntilDue)}. Mantén preparada la cuenta desde la que saldrá el pago.`, tone: getInvoiceTone(firstInvoice.daysUntilDue) }); }
  else insights.push({ id: 'calendar', title: 'Calendario de pagos despejado', description: 'No hay facturas dentro de la ventana de 15 días. Cuando empieces a registrar proveedores, aquí verás las alertas reales.', tone: 'success' });
  const primaryAccounts = accountBalances.filter((account) => account.isPrimary);
  const primaryReference = primaryAccounts[0] ?? accountBalances[0] ?? null;
  if (primaryReference) insights.push({ id: 'balance', title: `Cuenta de referencia: ${primaryReference.name}`, description: primaryReference.balance > 0 ? 'La tesorería base ya tiene saldo visible y se está consolidando desde cuentas y movimientos reales.' : 'La cuenta principal está sin saldo visible todavía. Conviene registrar movimientos para que el panel empiece a reflejar caja real.', tone: primaryReference.balance > 0 ? 'success' : 'neutral' });
  return insights;
}
