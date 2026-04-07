'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Landmark,
  Pencil,
  Plus,
  Search,
  ShieldMinus,
  Trash2,
  Wallet
} from 'lucide-react';

import { AccountEntrySheet } from '@/components/forms/account-entry-sheet';
import { AccountSheet } from '@/components/forms/account-sheet';
import { AccountTransferSheet } from '@/components/forms/account-transfer-sheet';
import { CashClosingSheet } from '@/components/forms/cash-closing-sheet';
import { Button, buttonClassName } from '@/components/ui/button';
import { deactivateAccountAction, deleteAccountAction, deleteAccountEntryAction } from '@/features/accounts/actions';
import { accountTypeLabel, entrySourceLabel, entryTypeLabel } from '@/features/accounts/helpers';
import type { AccountFilters, AccountSummaryItem, CashWorkspaceData } from '@/features/accounts/types';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

function amountTone(signedAmount: number) {
  if (signedAmount > 0) return 'text-[var(--success)]';
  if (signedAmount < 0) return 'text-[var(--danger)]';
  return 'text-[var(--foreground)]';
}

function buildBaseHref(filters: AccountFilters) {
  const params = new URLSearchParams();
  if (filters.accountId) params.set('account', filters.accountId);
  if (filters.entryType) params.set('type', filters.entryType);
  if (filters.query) params.set('q', filters.query);
  if (filters.dateFrom) params.set('from', filters.dateFrom);
  if (filters.dateTo) params.set('to', filters.dateTo);
  const query = params.toString();
  return query ? `/caja?${query}` : '/caja';
}

function buildAccountHref(accountId: string, filters: AccountFilters) {
  return buildBaseHref({ ...filters, accountId });
}

export function AccountsWorkspace({ data, filters, currency, canManage }: { data: CashWorkspaceData; filters: AccountFilters; currency: string; canManage: boolean; }) {
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountSummaryItem | null>(null);
  const [entryOpen, setEntryOpen] = useState(false);
  const [closingOpen, setClosingOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const selectedAccount = useMemo(() => data.accounts.find((account) => account.id === filters.accountId) ?? data.accounts[0] ?? null, [data.accounts, filters.accountId]);
  const primaryAccount = useMemo(() => data.accounts.find((account) => account.isPrimary) ?? selectedAccount, [data.accounts, selectedAccount]);

  return (
    <div className="grid gap-5">
      <section className="surface-card rounded-[32px] p-5 md:p-6 shadow-[0_22px_42px_rgba(60,70,49,0.08)]">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div className="grid gap-2">
            <p className="text-sm font-medium text-[var(--foreground-soft)]">Caja y banco</p>
            <h1 className="text-[1.9rem] font-semibold tracking-[-0.05em] text-[var(--foreground)]">Operativa diaria de caja</h1>
            <p className="text-sm text-[var(--foreground-soft)]">Cierra caja, reparte cobros y mueve dinero entre cuentas sin rellenar de más.</p>
          </div>
          {canManage ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" className={buttonClassName('primary')} onClick={() => setClosingOpen(true)}>
                <Wallet className="mr-2 h-4 w-4" />Cierre de caja
              </button>
              <button type="button" className={buttonClassName('secondary')} onClick={() => setTransferOpen(true)}>
                <ArrowRightLeft className="mr-2 h-4 w-4" />Mover dinero
              </button>
              <button type="button" className={buttonClassName('secondary')} onClick={() => setEntryOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />Ajuste manual
              </button>
              <button type="button" className={buttonClassName('ghost')} onClick={() => setCreateAccountOpen(true)}>
                <Landmark className="mr-2 h-4 w-4" />Nueva cuenta
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_360px]">
          <div className="rounded-[30px] border border-[rgba(123,136,95,0.16)] bg-[linear-gradient(180deg,rgba(110,127,86,0.14),rgba(255,255,255,0.9))] p-5 shadow-[0_20px_34px_rgba(60,70,49,0.09)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--foreground-soft)]">Saldo total</p>
                <p className="mt-2 text-[2.9rem] font-semibold tracking-[-0.07em] text-[var(--foreground)]">{formatCurrency(data.totals.balance, currency)}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[rgba(85,117,82,0.12)] px-3 py-1.5 text-xs font-semibold text-[var(--success)]">Entradas {formatCurrency(data.totals.inflow, currency)}</span>
                  <span className="rounded-full bg-[rgba(155,91,83,0.12)] px-3 py-1.5 text-xs font-semibold text-[var(--danger)]">Salidas {formatCurrency(data.totals.outflow, currency)}</span>
                </div>
              </div>
              <div className="rounded-[22px] bg-white/82 p-3 text-[var(--accent-strong)] shadow-[0_12px_24px_rgba(60,70,49,0.06)]"><Wallet className="h-6 w-6" /></div>
            </div>
          </div>

          <div className="grid gap-3 rounded-[30px] border border-[rgba(123,136,95,0.16)] bg-white/84 p-5 shadow-[0_16px_28px_rgba(60,70,49,0.06)]">
            <div>
              <p className="text-sm font-medium text-[var(--foreground-soft)]">Flujo rápido</p>
              <p className="mt-1 text-sm text-[var(--foreground-soft)]">Usa la cuenta principal por defecto y cambia solo cuando haga falta.</p>
            </div>
            <div className="grid gap-2">
              <button type="button" className={buttonClassName('primary', 'justify-start rounded-[22px]')} onClick={() => setClosingOpen(true)}>
                <Wallet className="mr-2 h-4 w-4" />Registrar cierre y repartirlo
              </button>
              <button type="button" className={buttonClassName('secondary', 'justify-start rounded-[22px]')} onClick={() => setTransferOpen(true)}>
                <ArrowRightLeft className="mr-2 h-4 w-4" />Mover desde efectivo o caja
              </button>
              <button type="button" className={buttonClassName('ghost', 'justify-start rounded-[22px]')} onClick={() => setEntryOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />Ajuste puntual
              </button>
            </div>
            {primaryAccount ? <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">Cuenta principal: {primaryAccount.name}</p> : null}
          </div>
        </div>

        <div className="mt-5 flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          <a href="/caja" className={cn('bank-chip min-w-[180px] rounded-[24px] px-4 py-4 transition', !filters.accountId && 'border-[rgba(110,127,86,0.3)] shadow-[0_16px_30px_rgba(83,99,65,0.12)]')}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">Vista global</p>
            <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">Todas las cuentas</p>
            <p className="mt-3 text-sm text-[var(--foreground-soft)]">{data.accounts.length} activas</p>
          </a>
          {data.accounts.map((account) => (
            <a key={account.id} href={buildAccountHref(account.id, filters)} className={cn('bank-chip min-w-[220px] rounded-[24px] px-4 py-4 transition', account.id === selectedAccount?.id && 'border-[rgba(110,127,86,0.3)] shadow-[0_16px_30px_rgba(83,99,65,0.12)]')}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{account.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--foreground-muted)]">{accountTypeLabel(account.type)}</p>
                </div>
                {account.isPrimary ? <span className="rounded-full bg-[rgba(110,127,86,0.1)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">Principal</span> : null}
              </div>
              <p className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">{formatCurrency(account.currentBalance, currency)}</p>
            </a>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <section className="surface-card rounded-[30px] p-4 md:p-5 shadow-[0_18px_34px_rgba(60,70,49,0.06)]">
          <form className="mb-4 grid gap-3" method="get">
            {filters.accountId ? <input type="hidden" name="account" value={filters.accountId} /> : null}
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_160px_160px]">
              <label className="grid gap-2 text-sm text-[var(--foreground-soft)]">
                <span className="font-medium text-[var(--foreground)]">Buscar</span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
                  <input name="q" defaultValue={filters.query} className="h-11 w-full rounded-2xl border border-[rgba(123,136,95,0.16)] bg-white/88 pl-11 pr-4 text-sm text-[var(--foreground)]" placeholder="Concepto, nota u origen" />
                </div>
              </label>
              <label className="grid gap-2 text-sm text-[var(--foreground-soft)]">
                <span className="font-medium text-[var(--foreground)]">Tipo</span>
                <select name="type" defaultValue={filters.entryType} className="h-11 rounded-2xl border border-[rgba(123,136,95,0.16)] bg-white/88 px-4 text-sm text-[var(--foreground)]">
                  <option value="">Todos</option>
                  <option value="income">Entradas</option>
                  <option value="expense">Salidas</option>
                  <option value="adjustment">Ajustes</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm text-[var(--foreground-soft)]">
                <span className="font-medium text-[var(--foreground)]">Desde</span>
                <input type="date" name="from" defaultValue={filters.dateFrom} className="h-11 rounded-2xl border border-[rgba(123,136,95,0.16)] bg-white/88 px-4 text-sm text-[var(--foreground)]" />
              </label>
              <label className="grid gap-2 text-sm text-[var(--foreground-soft)]">
                <span className="font-medium text-[var(--foreground)]">Hasta</span>
                <input type="date" name="to" defaultValue={filters.dateTo} className="h-11 rounded-2xl border border-[rgba(123,136,95,0.16)] bg-white/88 px-4 text-sm text-[var(--foreground)]" />
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(123,136,95,0.12)] pt-4">
              <p className="text-sm text-[var(--foreground-soft)]">Ves el mes actual al entrar. Filtra solo cuando lo necesites.</p>
              <div className="flex gap-2">
                <button className={buttonClassName('secondary')} type="submit">Aplicar</button>
                <a className={buttonClassName('ghost')} href={filters.accountId ? `/caja?account=${filters.accountId}` : '/caja'}>Limpiar</a>
              </div>
            </div>
          </form>

          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[var(--foreground-soft)]">Movimientos</p>
              <p className="mt-1 text-sm text-[var(--foreground-soft)]">Aquí verás cierres repartidos, transferencias y ajustes.</p>
            </div>
            <span className="rounded-full bg-[rgba(110,127,86,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">{data.totals.entryCount} registros</span>
          </div>

          {data.entries.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[rgba(123,136,95,0.22)] bg-white/55 px-4 py-10 text-center">
              <p className="text-lg font-semibold text-[var(--foreground)]">Todavía no hay movimientos.</p>
              <p className="mt-2 text-sm text-[var(--foreground-soft)]">Empieza con un cierre de caja o mueve dinero entre cuentas.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {data.entries.map((entry) => (
                <article key={entry.id} className="dashboard-row rounded-[24px] border border-[rgba(123,136,95,0.12)] bg-white/86 p-4 shadow-[0_14px_24px_rgba(60,70,49,0.05)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid gap-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[rgba(110,127,86,0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">{entryTypeLabel(entry.type)}</span>
                        <span className="text-xs uppercase tracking-[0.14em] text-[var(--foreground-muted)]">{entry.accountName}</span>
                        <span className="text-sm text-[var(--foreground-soft)]">{formatDate(entry.entryDate)}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-[var(--foreground)]">{entry.concept}</h3>
                      <p className="text-sm text-[var(--foreground-soft)]">{entrySourceLabel(entry.sourceType)}</p>
                      {entry.notes ? <p className="text-sm leading-6 text-[var(--foreground-soft)]">{entry.notes}</p> : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-3">
                      <p className={cn('text-2xl font-semibold tracking-[-0.04em]', amountTone(entry.signedAmount))}>{entry.signedAmount > 0 ? '+' : ''}{formatCurrency(entry.signedAmount, currency)}</p>
                      {canManage && entry.sourceType === 'manual' ? (
                        <form>
                          <input type="hidden" name="entryId" value={entry.id} />
                          <input type="hidden" name="returnPath" value={buildBaseHref(filters)} />
                          <Button type="submit" variant="ghost" className="h-10 px-3 text-[var(--danger)] hover:bg-[rgba(155,91,83,0.08)] hover:text-[var(--danger)]" formAction={deleteAccountEntryAction}><Trash2 className="mr-2 h-4 w-4" />Borrar</Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-5">
          <section className="surface-card rounded-[30px] p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--foreground-soft)]">Cuentas</p>
                <p className="mt-1 text-sm text-[var(--foreground-soft)]">Edita, desactiva o elimina las que aún no tengan historial.</p>
              </div>
            </div>
            <div className="grid gap-3">
              {data.accounts.map((account) => {
                const canDelete = account.movementCount === 0 && !account.latestClosing;
                return (
                  <article key={account.id} className="rounded-[24px] border border-[rgba(123,136,95,0.12)] bg-white/84 p-4 shadow-[0_12px_22px_rgba(60,70,49,0.04)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-[var(--foreground)]">{account.name}</p>{account.isPrimary ? <span className="rounded-full bg-[rgba(110,127,86,0.1)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">Principal</span> : null}</div>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--foreground-muted)]">{accountTypeLabel(account.type)}</p>
                        <p className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{formatCurrency(account.currentBalance, currency)}</p>
                        <p className="mt-1 text-sm text-[var(--foreground-soft)]">{account.movementCount} movimientos{account.lastEntryDate ? ` · último ${formatDate(account.lastEntryDate)}` : ''}</p>
                      </div>
                    </div>
                    {canManage ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => setEditingAccount(account)}><Pencil className="mr-2 h-4 w-4" />Editar</Button>
                        {!canDelete ? (
                          <form>
                            <input type="hidden" name="accountId" value={account.id} />
                            <input type="hidden" name="returnPath" value={buildBaseHref(filters)} />
                            <Button type="submit" variant="ghost" formAction={deactivateAccountAction}><ShieldMinus className="mr-2 h-4 w-4" />Desactivar</Button>
                          </form>
                        ) : (
                          <form>
                            <input type="hidden" name="accountId" value={account.id} />
                            <input type="hidden" name="returnPath" value={buildBaseHref(filters)} />
                            <Button type="submit" variant="ghost" className="text-[var(--danger)] hover:bg-[rgba(155,91,83,0.08)] hover:text-[var(--danger)]" formAction={deleteAccountAction}><Trash2 className="mr-2 h-4 w-4" />Eliminar</Button>
                          </form>
                        )}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="surface-card rounded-[30px] p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--foreground-soft)]">Últimos cierres</p>
                <p className="mt-1 text-sm text-[var(--foreground-soft)]">Resumen de los cierres guardados recientemente.</p>
              </div>
            </div>
            {data.closings.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-[rgba(123,136,95,0.22)] bg-white/55 px-4 py-8 text-center">
                <p className="text-sm font-semibold text-[var(--foreground)]">Todavía no hay cierres.</p>
                <p className="mt-2 text-sm text-[var(--foreground-soft)]">Usa el botón de cierre de caja para empezar.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {data.closings.slice(0, 6).map((closing) => (
                  <article key={closing.id} className="rounded-[22px] border border-[rgba(123,136,95,0.12)] bg-white/82 p-4 shadow-[0_12px_22px_rgba(60,70,49,0.04)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">{closing.accountName}</p>
                        <p className="mt-1 text-sm text-[var(--foreground-soft)]">{formatDate(closing.closingDate)}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div><p className="text-[var(--foreground-soft)]">Apertura</p><p className="mt-1 font-semibold text-[var(--foreground)]">{formatCurrency(closing.openingBalance, currency)}</p></div>
                      <div><p className="text-[var(--foreground-soft)]">Cierre</p><p className="mt-1 font-semibold text-[var(--foreground)]">{formatCurrency(closing.closingBalance, currency)}</p></div>
                      <div className="inline-flex items-center gap-2 text-[var(--success)]"><ArrowUpRight className="h-4 w-4" />{formatCurrency(closing.inflowTotal, currency)}</div>
                      <div className="inline-flex items-center gap-2 text-[var(--danger)]"><ArrowDownLeft className="h-4 w-4" />{formatCurrency(closing.outflowTotal, currency)}</div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <AccountSheet open={createAccountOpen} onClose={() => setCreateAccountOpen(false)} returnPath={buildBaseHref(filters)} />
      <AccountSheet open={Boolean(editingAccount)} onClose={() => setEditingAccount(null)} account={editingAccount} returnPath={buildBaseHref(filters)} />
      <CashClosingSheet open={closingOpen} onClose={() => setClosingOpen(false)} catalogs={data.catalogs} returnPath={buildBaseHref(filters)} />
      <AccountTransferSheet open={transferOpen} onClose={() => setTransferOpen(false)} catalogs={data.catalogs} presetSourceAccountId={selectedAccount?.id ?? filters.accountId} returnPath={buildBaseHref(filters)} />
      <AccountEntrySheet open={entryOpen} onClose={() => setEntryOpen(false)} catalogs={data.catalogs} presetAccountId={selectedAccount?.id ?? filters.accountId} returnPath={buildBaseHref(filters)} />
    </div>
  );
}
