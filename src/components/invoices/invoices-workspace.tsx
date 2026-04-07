'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, CreditCard, FileText, Pencil, Plus, ReceiptText, Search, Trash2 } from 'lucide-react';

import { InvoicePaymentSheet } from '@/components/forms/invoice-payment-sheet';
import { InvoiceSheet } from '@/components/forms/invoice-sheet';
import { StatusPill } from '@/components/dashboard/status-pill';
import { Button, buttonClassName } from '@/components/ui/button';
import { deleteInvoiceAction, deleteInvoicePaymentAction } from '@/features/invoices/actions';
import type { InvoiceCatalogs, InvoiceFilters, InvoiceInstallmentItem, InvoiceListItem, InvoiceStatus } from '@/features/invoices/types';
import { paymentMethodLabel } from '@/features/expenses/helpers';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

const statusToneMap: Record<InvoiceStatus, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
  pending: 'warning',
  partially_paid: 'info',
  paid: 'success',
  cancelled: 'neutral'
};

const statusLabelMap: Record<InvoiceStatus, string> = {
  pending: 'Pendiente',
  partially_paid: 'Parcial',
  paid: 'Pagada',
  cancelled: 'Anulada'
};

const installmentToneMap: Record<InvoiceInstallmentItem['status'], 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning',
  partially_paid: 'info',
  paid: 'success',
  overdue: 'danger'
};

const installmentLabelMap: Record<InvoiceInstallmentItem['status'], string> = {
  pending: 'Pendiente',
  partially_paid: 'Parcial',
  paid: 'Pagado',
  overdue: 'Vencido'
};

export function InvoicesWorkspace({
  records,
  catalogs,
  filters,
  currency,
  canManage
}: {
  records: InvoiceListItem[];
  catalogs: InvoiceCatalogs;
  filters: InvoiceFilters;
  currency: string;
  canManage: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceListItem | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceListItem | null>(null);
  const highlightedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!filters.highlightedInvoiceId || !highlightedRef.current) return;
    highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [filters.highlightedInvoiceId]);

  const totals = useMemo(() => {
    return records.reduce(
      (acc, row) => {
        acc.total += row.total;
        acc.pending += row.pendingAmount;
        acc.paid += row.paidAmount;
        return acc;
      },
      { total: 0, pending: 0, paid: 0 }
    );
  }, [records]);

  return (
    <div className="grid gap-5">
      <section className="surface-card rounded-[30px] px-5 py-5 md:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Facturas</p>
            <h1 className="mt-1 text-[1.55rem] font-semibold tracking-[-0.05em] text-[var(--foreground)]">Pagos y vencimientos</h1>
          </div>
          {canManage ? (
            <button type="button" className={buttonClassName('primary')} onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />Nueva factura
            </button>
          ) : null}
        </div>

        <form className="mt-5 grid gap-4" method="get">
          <input type="hidden" name="period" value={filters.period} />
          <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1.5fr)_220px_220px_170px_170px]">
            <label className="grid gap-2 text-sm text-[var(--foreground-soft)]">
              <span className="font-medium text-[var(--foreground)]">Buscar</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
                <input
                  name="q"
                  defaultValue={filters.query}
                  className="h-11 w-full rounded-2xl border border-[rgba(123,136,95,0.16)] bg-white/88 pl-11 pr-4 text-sm text-[var(--foreground)]"
                  placeholder="Proveedor, factura o pago"
                />
              </div>
            </label>

            <label className="grid gap-2 text-sm text-[var(--foreground-soft)]">
              <span className="font-medium text-[var(--foreground)]">Estado</span>
              <select
                name="status"
                defaultValue={filters.status}
                className="h-11 rounded-2xl border border-[rgba(123,136,95,0.16)] bg-white/88 px-4 text-sm text-[var(--foreground)]"
              >
                <option value="">Todos</option>
                <option value="open">Pendientes y parciales</option>
                <option value="overdue">Vencidas</option>
                <option value="paid">Pagadas</option>
                <option value="cancelled">Anuladas</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm text-[var(--foreground-soft)]">
              <span className="font-medium text-[var(--foreground)]">Proveedor</span>
              <select
                name="vendor"
                defaultValue={filters.vendorId}
                className="h-11 rounded-2xl border border-[rgba(123,136,95,0.16)] bg-white/88 px-4 text-sm text-[var(--foreground)]"
              >
                <option value="">Todos</option>
                {catalogs.vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-[var(--foreground-soft)]">
              <span className="font-medium text-[var(--foreground)]">Desde</span>
              <input
                type="date"
                name="from"
                defaultValue={filters.dueFrom}
                className="h-11 rounded-2xl border border-[rgba(123,136,95,0.16)] bg-white/88 px-4 text-sm text-[var(--foreground)]"
              />
            </label>

            <label className="grid gap-2 text-sm text-[var(--foreground-soft)]">
              <span className="font-medium text-[var(--foreground)]">Hasta</span>
              <input
                type="date"
                name="to"
                defaultValue={filters.dueTo}
                className="h-11 rounded-2xl border border-[rgba(123,136,95,0.16)] bg-white/88 px-4 text-sm text-[var(--foreground)]"
              />
            </label>
          </div>

          <div className="flex flex-col gap-3 border-t border-[rgba(123,136,95,0.12)] pt-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--foreground-soft)]">
              <a className={buttonClassName(filters.period === 'current-month' ? 'secondary' : 'ghost')} href="/facturas">
                Mes actual
              </a>
              <a className={buttonClassName(filters.period === 'all' ? 'secondary' : 'ghost')} href="/facturas?period=all">
                Todo
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className={buttonClassName('secondary')} type="submit">Aplicar</button>
              <a className={buttonClassName('ghost')} href="/facturas">Limpiar</a>
            </div>
          </div>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="surface-card rounded-[24px] p-5">
          <p className="text-sm text-[var(--foreground-soft)]">Facturas</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{records.length}</p>
        </div>
        <div className="surface-card rounded-[24px] p-5 metric-glow">
          <p className="text-sm text-[var(--foreground-soft)]">Importe total</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{formatCurrency(totals.total, currency)}</p>
        </div>
        <div className="surface-card rounded-[24px] p-5">
          <p className="text-sm text-[var(--foreground-soft)]">Pendiente</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{formatCurrency(totals.pending, currency)}</p>
        </div>
        <div className="surface-card rounded-[24px] p-5">
          <p className="text-sm text-[var(--foreground-soft)]">Pagado</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{formatCurrency(totals.paid, currency)}</p>
        </div>
      </section>

      <section className="surface-card rounded-[30px] p-4 md:p-5">
        {records.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[rgba(123,136,95,0.22)] bg-white/55 px-5 py-10 text-center">
            <p className="text-lg font-semibold text-[var(--foreground)]">No hay facturas con esos filtros.</p>
            <p className="mt-2 text-sm text-[var(--foreground-soft)]">Ajusta el rango o registra la primera factura desde aquí.</p>
            {canManage ? (
              <div className="mt-5">
                <button type="button" className={buttonClassName('primary')} onClick={() => setCreateOpen(true)}>
                  Registrar factura
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-3">
            {records.map((invoice) => {
              const progress = invoice.total > 0 ? Math.min((invoice.paidAmount / invoice.total) * 100, 100) : 0;
              const isHighlighted = invoice.id === filters.highlightedInvoiceId;

              return (
                <article
                  key={invoice.id}
                  ref={isHighlighted ? highlightedRef : null}
                  className={cn(
                    'dashboard-row rounded-[26px] border border-[rgba(123,136,95,0.12)] bg-white/84 p-4 shadow-[0_14px_24px_rgba(60,70,49,0.05)] md:p-5',
                    isHighlighted && 'ring-2 ring-[rgba(110,127,86,0.28)]'
                  )}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="grid gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill label={statusLabelMap[invoice.status]} tone={statusToneMap[invoice.status]} />
                        <span className="text-sm text-[var(--foreground-soft)]">{invoice.vendorName}</span>
                        <span className="text-sm text-[var(--foreground-soft)]">· {invoice.invoiceNumber}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--foreground)]">Próximo vencimiento {formatDate(invoice.nextDueDate)}</h3>
                        <p className="mt-1 text-sm text-[var(--foreground-soft)]">Emitida el {formatDate(invoice.issueDate)} · Total {formatCurrency(invoice.total, currency)}</p>
                      </div>
                      <div className="max-w-xl space-y-2">
                        <div className="h-2 rounded-full bg-[rgba(123,136,95,0.12)]">
                          <div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--foreground-soft)]">
                          <span>Pagado {formatCurrency(invoice.paidAmount, currency)}</span>
                          <span>Pendiente {formatCurrency(invoice.pendingAmount, currency)}</span>
                          <span>{invoice.attachments.length || invoice.attachmentCount} adjuntos</span>
                        </div>
                      </div>
                      {invoice.notes ? <p className="max-w-3xl text-sm leading-6 text-[var(--foreground-soft)]">{invoice.notes}</p> : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-start gap-3 xl:items-end">
                      <p className="text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{formatCurrency(invoice.pendingAmount, currency)}</p>
                      {canManage ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {invoice.status !== 'paid' && invoice.status !== 'cancelled' ? (
                            <Button variant="primary" onClick={() => setPaymentInvoice(invoice)}>
                              <CreditCard className="mr-2 h-4 w-4" />Pago
                            </Button>
                          ) : null}
                          <Button variant="secondary" onClick={() => setEditingInvoice(invoice)}>
                            <Pencil className="mr-2 h-4 w-4" />Editar
                          </Button>
                          <form>
                            <input type="hidden" name="invoiceId" value={invoice.id} />
                            <input type="hidden" name="returnPath" value="/facturas" />
                            <Button type="submit" variant="ghost" className="text-[var(--danger)] hover:bg-[rgba(155,91,83,0.08)] hover:text-[var(--danger)]" formAction={deleteInvoiceAction}>
                              <Trash2 className="mr-2 h-4 w-4" />Borrar
                            </Button>
                          </form>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,360px)]">
                    <div className="rounded-[22px] border border-[rgba(123,136,95,0.12)] bg-[rgba(255,255,255,0.66)] p-4 shadow-[0_10px_18px_rgba(60,70,49,0.03)]">
                      <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                        <CalendarClock className="h-4 w-4 text-[var(--accent-strong)]" />Vencimientos
                      </div>
                      <div className="mt-3 grid gap-2">
                        {invoice.installments.map((installment) => (
                          <div key={installment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[rgba(123,136,95,0.12)] bg-white/82 px-3 py-3">
                            <div>
                              <p className="text-sm font-semibold text-[var(--foreground)]">Pago {installment.sequenceNumber} · {formatDate(installment.dueDate)}</p>
                              <p className="mt-1 text-sm text-[var(--foreground-soft)]">{formatCurrency(installment.pendingAmount, currency)} pendiente de {formatCurrency(installment.amount, currency)}</p>
                            </div>
                            <StatusPill label={installmentLabelMap[installment.status]} tone={installmentToneMap[installment.status]} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-[rgba(123,136,95,0.12)] bg-[rgba(255,255,255,0.66)] p-4 shadow-[0_10px_18px_rgba(60,70,49,0.03)]">
                      <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                        <ReceiptText className="h-4 w-4 text-[var(--accent-strong)]" />Pagos y documentación
                      </div>
                      {invoice.payments.length === 0 ? (
                        <p className="mt-3 text-sm text-[var(--foreground-soft)]">Aún no hay pagos en esta factura.</p>
                      ) : (
                        <div className="mt-3 grid gap-3">
                          {invoice.payments.map((payment) => (
                            <div key={payment.id} className="rounded-[18px] border border-[rgba(123,136,95,0.12)] bg-white/82 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(payment.amount, currency)} · {formatDate(payment.paymentDate)}</p>
                                  <p className="mt-1 text-sm text-[var(--foreground-soft)]">{payment.accountName || 'Cuenta sin nombre'} · {paymentMethodLabel(payment.paymentMethod)}</p>
                                  {payment.reference ? <p className="mt-1 text-sm text-[var(--foreground-soft)]">{payment.reference}</p> : null}
                                  {payment.notes ? <p className="mt-1 text-sm text-[var(--foreground-soft)]">{payment.notes}</p> : null}
                                </div>
                                {canManage ? (
                                  <form>
                                    <input type="hidden" name="paymentId" value={payment.id} />
                                    <input type="hidden" name="returnPath" value="/facturas" />
                                    <Button type="submit" variant="ghost" className="h-9 px-3 text-[var(--danger)] hover:bg-[rgba(155,91,83,0.08)] hover:text-[var(--danger)]" formAction={deleteInvoicePaymentAction}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </form>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {invoice.attachments.length === 0 ? (
                        <p className="mt-4 text-sm text-[var(--foreground-soft)]">Sin adjuntos cargados.</p>
                      ) : (
                        <div className="mt-4 grid gap-2">
                          {invoice.attachments.map((attachment) => (
                            <a key={attachment.id} href={attachment.url ?? '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent-strong)] underline-offset-4 hover:underline">
                              <FileText className="h-4 w-4" />{attachment.fileName}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <InvoiceSheet open={createOpen} onClose={() => setCreateOpen(false)} catalogs={catalogs} returnPath="/facturas" title="Nueva factura" />
      <InvoiceSheet open={Boolean(editingInvoice)} onClose={() => setEditingInvoice(null)} catalogs={catalogs} invoice={editingInvoice} returnPath="/facturas" title="Editar factura" />
      <InvoicePaymentSheet open={Boolean(paymentInvoice)} onClose={() => setPaymentInvoice(null)} catalogs={catalogs} invoice={paymentInvoice} returnPath="/facturas" />
    </div>
  );
}
