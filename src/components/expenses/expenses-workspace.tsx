'use client';

import { useMemo, useState } from 'react';
import { FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react';

import { ExpenseSheet } from '@/components/forms/expense-sheet';
import { Button, buttonClassName } from '@/components/ui/button';
import { deleteExpenseAction } from '@/features/expenses/actions';
import { paymentMethodLabel } from '@/features/expenses/helpers';
import type { ExpenseCatalogs, ExpenseFilters, ExpenseListItem } from '@/features/expenses/types';
import { formatCurrency, formatDate } from '@/lib/utils';

function totalAttachmentsLabel(count: number) {
  if (count <= 0) return 'Sin adjuntos';
  if (count === 1) return '1 adjunto';
  return `${count} adjuntos`;
}

export function ExpensesWorkspace({
  records,
  catalogs,
  filters,
  currency,
  canManage
}: {
  records: ExpenseListItem[];
  catalogs: ExpenseCatalogs;
  filters: ExpenseFilters;
  currency: string;
  canManage: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseListItem | null>(null);

  const totals = useMemo(() => {
    return records.reduce(
      (acc, row) => {
        acc.total += row.totalAmount;
        acc.tax += row.taxAmount;
        return acc;
      },
      { total: 0, tax: 0 }
    );
  }, [records]);

  return (
    <div className="grid gap-5">
      <section className="surface-card rounded-[30px] px-5 py-5 md:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Gastos</p>
            <h1 className="mt-1 text-[1.55rem] font-semibold tracking-[-0.05em] text-[var(--foreground)]">Registro diario</h1>
          </div>
          {canManage ? (
            <button type="button" className={buttonClassName('primary')} onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />Nuevo gasto
            </button>
          ) : null}
        </div>

        <form className="mt-5 grid gap-4" method="get">
          <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1.5fr)_220px_220px_170px_170px]">
            <label className="grid gap-2 text-sm text-[var(--foreground-soft)]">
              <span className="font-medium text-[var(--foreground)]">Buscar</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
                <input
                  name="q"
                  defaultValue={filters.query}
                  className="h-11 w-full rounded-2xl border border-[rgba(123,136,95,0.16)] bg-white/88 pl-11 pr-4 text-sm text-[var(--foreground)]"
                  placeholder="Proveedor, referencia o nota"
                />
              </div>
            </label>

            <label className="grid gap-2 text-sm text-[var(--foreground-soft)]">
              <span className="font-medium text-[var(--foreground)]">Categoría</span>
              <select
                name="category"
                defaultValue={filters.categoryId}
                className="h-11 rounded-2xl border border-[rgba(123,136,95,0.16)] bg-white/88 px-4 text-sm text-[var(--foreground)]"
              >
                <option value="">Todas</option>
                {catalogs.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-[var(--foreground-soft)]">
              <span className="font-medium text-[var(--foreground)]">Cuenta</span>
              <select
                name="account"
                defaultValue={filters.accountId}
                className="h-11 rounded-2xl border border-[rgba(123,136,95,0.16)] bg-white/88 px-4 text-sm text-[var(--foreground)]"
              >
                <option value="">Todas</option>
                {catalogs.accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-[var(--foreground-soft)]">
              <span className="font-medium text-[var(--foreground)]">Desde</span>
              <input
                type="date"
                name="from"
                defaultValue={filters.dateFrom}
                className="h-11 rounded-2xl border border-[rgba(123,136,95,0.16)] bg-white/88 px-4 text-sm text-[var(--foreground)]"
              />
            </label>

            <label className="grid gap-2 text-sm text-[var(--foreground-soft)]">
              <span className="font-medium text-[var(--foreground)]">Hasta</span>
              <input
                type="date"
                name="to"
                defaultValue={filters.dateTo}
                className="h-11 rounded-2xl border border-[rgba(123,136,95,0.16)] bg-white/88 px-4 text-sm text-[var(--foreground)]"
              />
            </label>
          </div>

          <div className="flex flex-col gap-3 border-t border-[rgba(123,136,95,0.12)] pt-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-[var(--foreground-soft)]">Entras viendo el mes actual y luego puedes abrir cualquier periodo.</p>
            <div className="flex flex-wrap items-center gap-2">
              <button className={buttonClassName('secondary')} type="submit">Aplicar</button>
              <a className={buttonClassName('ghost')} href="/gastos">Limpiar</a>
            </div>
          </div>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="surface-card rounded-[24px] p-5">
          <p className="text-sm text-[var(--foreground-soft)]">Resultados</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{records.length}</p>
        </div>
        <div className="surface-card rounded-[24px] p-5 metric-glow">
          <p className="text-sm text-[var(--foreground-soft)]">Total filtrado</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{formatCurrency(totals.total, currency)}</p>
        </div>
        <div className="surface-card rounded-[24px] p-5">
          <p className="text-sm text-[var(--foreground-soft)]">Impuestos filtrados</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{formatCurrency(totals.tax, currency)}</p>
        </div>
      </section>

      <section className="surface-card rounded-[30px] p-4 md:p-5">
        {records.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[rgba(123,136,95,0.22)] bg-white/55 px-5 py-10 text-center">
            <p className="text-lg font-semibold text-[var(--foreground)]">No hay gastos con esos filtros.</p>
            <p className="mt-2 text-sm text-[var(--foreground-soft)]">Prueba otro rango o registra el primer gasto desde aquí.</p>
            {canManage ? (
              <div className="mt-5">
                <button type="button" className={buttonClassName('primary')} onClick={() => setCreateOpen(true)}>
                  Registrar gasto
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-3">
            {records.map((expense) => (
              <article key={expense.id} className="dashboard-row rounded-[26px] border border-[rgba(123,136,95,0.12)] bg-white/84 p-4 shadow-[0_14px_24px_rgba(60,70,49,0.05)] md:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="grid gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[rgba(110,127,86,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">{expense.categoryName}</span>
                      <span className="text-sm text-[var(--foreground-soft)]">{formatDate(expense.expenseDate)}</span>
                      <span className="text-sm text-[var(--foreground-soft)]">{paymentMethodLabel(expense.paymentMethod)}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--foreground)]">{expense.reference || expense.vendorName || 'Gasto sin referencia'}</h3>
                      <p className="mt-1 text-sm text-[var(--foreground-soft)]">
                        {expense.vendorName || 'Sin proveedor'}
                        {expense.accountName ? ` · ${expense.accountName}` : ''}
                      </p>
                    </div>
                    {expense.notes ? <p className="max-w-3xl text-sm leading-6 text-[var(--foreground-soft)]">{expense.notes}</p> : null}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--foreground-soft)]">
                      <span>{totalAttachmentsLabel(expense.attachmentCount)}</span>
                      {expense.attachments.slice(0, 2).map((attachment) =>
                        attachment.url ? (
                          <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[var(--accent-strong)] underline-offset-4 hover:underline">
                            <FileText className="h-4 w-4" />{attachment.fileName}
                          </a>
                        ) : (
                          <span key={attachment.id} className="inline-flex items-center gap-2 text-[var(--foreground-soft)]">
                            <FileText className="h-4 w-4" />{attachment.fileName}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
                    <p className="text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{formatCurrency(expense.totalAmount, currency)}</p>
                    {canManage ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="secondary" onClick={() => setEditingExpense(expense)}>
                          <Pencil className="mr-2 h-4 w-4" />Editar
                        </Button>
                        <form>
                          <input type="hidden" name="expenseId" value={expense.id} />
                          <input type="hidden" name="returnPath" value="/gastos" />
                          <Button type="submit" variant="ghost" className="text-[var(--danger)] hover:bg-[rgba(155,91,83,0.08)] hover:text-[var(--danger)]" formAction={deleteExpenseAction}>
                            <Trash2 className="mr-2 h-4 w-4" />Borrar
                          </Button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <ExpenseSheet open={createOpen} onClose={() => setCreateOpen(false)} catalogs={catalogs} returnPath="/gastos" title="Nuevo gasto" />
      <ExpenseSheet open={Boolean(editingExpense)} onClose={() => setEditingExpense(null)} catalogs={catalogs} expense={editingExpense} returnPath="/gastos" title="Editar gasto" />
    </div>
  );
}
