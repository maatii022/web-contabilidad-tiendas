'use client';

import { useActionState, useMemo, useState } from 'react';
import { ArrowRightLeft, CalendarRange, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Field, inputClassName, textareaClassName } from '@/components/forms/form-field';
import { Sheet } from '@/components/forms/sheet';
import { useCloseOnSuccess, useSheetSessionKey } from '@/components/forms/sheet-session';
import { Button } from '@/components/ui/button';
import { createCashClosingAction } from '@/features/accounts/actions';
import { cashClosingFormInitialState, type CashCatalogs } from '@/features/accounts/types';
import { formatCurrency } from '@/lib/utils';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

type AllocationRow = {
  id: string;
  accountId: string;
  amount: string;
};

export function CashClosingSheet({
  open,
  onClose,
  catalogs,
  returnPath
}: {
  open: boolean;
  onClose: () => void;
  catalogs: CashCatalogs;
  returnPath: string;
}) {
  const sessionKey = useSheetSessionKey(open, 'cash-closing');

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Cierre de caja"
      description="Registra el cierre del día y reparte el total entre efectivo y bancos."
    >
      {open ? <CashClosingSheetForm key={`cash-closing-${sessionKey}`} onClose={onClose} catalogs={catalogs} returnPath={returnPath} /> : null}
    </Sheet>
  );
}

function normalizeName(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function getDefaultAllocationAccountIds(accounts: CashCatalogs['accounts']) {
  const normalized = accounts.map((account) => ({
    id: account.id,
    type: account.type,
    lowered: normalizeName(account.name)
  }));

  const preferred = [
  normalized.find((account) => account.lowered.includes('sabadell'))?.id,
  normalized.find((account) => account.lowered.includes('santander'))?.id,
  normalized.find((account) => account.lowered.includes('efectivo'))?.id ??
    normalized.find((account) => account.type === 'cash')?.id
]
  .filter((value): value is string => Boolean(value))
  .filter((value, index, array) => array.indexOf(value) === index);

  if (preferred.length >= 3) return preferred;

  const fallbacks = normalized
    .map((account) => account.id)
    .filter((id) => !preferred.includes(id));

  return [...preferred, ...fallbacks].slice(0, 3);
}

function CashClosingSheetForm({ onClose, catalogs, returnPath }: { onClose: () => void; catalogs: CashCatalogs; returnPath: string; }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createCashClosingAction, cashClosingFormInitialState);
  const destinationOptions = catalogs.accounts;
  const defaultRows = getDefaultAllocationAccountIds(destinationOptions);

  const [closingDate, setClosingDate] = useState(todayIso());
  const [total, setTotal] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<AllocationRow[]>(
    defaultRows.length > 0
      ? defaultRows.map((accountId) => ({ id: crypto.randomUUID(), accountId, amount: '' }))
      : [{ id: crypto.randomUUID(), accountId: '', amount: '' }]
  );

  useCloseOnSuccess(state.status, () => {
    router.refresh();
    onClose();
  });

  const totalValue = Number.parseFloat(total.replace(',', '.')) || 0;
  const allocated = useMemo(() => rows.reduce((sum, row) => sum + (Number.parseFloat(row.amount.replace(',', '.')) || 0), 0), [rows]);
  const remaining = Number((totalValue - allocated).toFixed(2));

  function updateRow(id: string, patch: Partial<AllocationRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((current) => [...current, { id: crypto.randomUUID(), accountId: '', amount: '' }]);
  }

  function removeRow(id: string) {
    setRows((current) => (current.length > 1 ? current.filter((row) => row.id !== id) : current));
  }

  function fillRemaining(id: string) {
    if (!Number.isFinite(remaining) || remaining === 0) return;
    updateRow(id, { amount: remaining.toFixed(2) });
  }

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="returnPath" value={returnPath} />

      <div className="grid gap-3 rounded-[24px] border border-[rgba(123,136,95,0.14)] bg-white/66 p-4 text-sm text-[var(--foreground-soft)]">
        <p className="font-medium text-[var(--foreground)]">Caja de tienda</p>
        <p>El cierre pertenece a la operativa diaria de la tienda. Solo repartes el total del día entre efectivo y bancos.</p>
      </div>

      <Field label="Fecha" error={state.fieldErrors?.closingDate}>
        <div className="relative">
          <CalendarRange className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <input className={inputClassName(Boolean(state.fieldErrors?.closingDate)) + ' pl-11'} type="date" name="closingDate" value={closingDate} onChange={(event) => setClosingDate(event.target.value)} />
        </div>
      </Field>

      <Field label="Total del cierre" error={state.fieldErrors?.total} hint="El sistema comprobará que el reparto cuadre al céntimo.">
        <input className={inputClassName(Boolean(state.fieldErrors?.total))} type="number" step="0.01" min="0.01" name="total" value={total} onChange={(event) => setTotal(event.target.value)} placeholder="0,00" />
      </Field>

      <Field label="Reparto del cierre" error={state.fieldErrors?.allocations} hint="Reparte el total del día entre Sabadell, Santander, Efectivo u otras cuentas que uses.">
        <div className="grid gap-3 rounded-[24px] border border-[rgba(123,136,95,0.14)] bg-white/66 p-4">
          {rows.map((row) => (
            <div key={row.id} className="grid gap-3 rounded-[22px] border border-[rgba(123,136,95,0.12)] bg-white/90 p-3 md:grid-cols-[minmax(0,1fr)_140px_auto] md:items-center">
              <select className={inputClassName()} name="allocationAccountId" value={row.accountId} onChange={(event) => updateRow(row.id, { accountId: event.target.value })}>
                <option value="">Cuenta destino</option>
                {destinationOptions.map((account) => {
                  const alreadySelected = rows.some((item) => item.id !== row.id && item.accountId === account.id);
                  return (
                    <option key={account.id} value={account.id} disabled={alreadySelected}>
                      {account.name}
                    </option>
                  );
                })}
              </select>
              <div className="relative">
                <input className={inputClassName()} type="number" step="0.01" min="0.01" name="allocationAmount" value={row.amount} onChange={(event) => updateRow(row.id, { amount: event.target.value })} placeholder="0,00" />
              </div>
              <div className="flex items-center gap-2 md:justify-end">
                <Button variant="ghost" onClick={() => fillRemaining(row.id)} disabled={!totalValue || remaining === 0}>Restante</Button>
                <Button variant="ghost" onClick={() => removeRow(row.id)} disabled={rows.length === 1}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-[rgba(110,127,86,0.08)] px-4 py-3 text-sm">
            <div className="inline-flex items-center gap-2 text-[var(--foreground)]"><ArrowRightLeft className="h-4 w-4 text-[var(--accent-strong)]" />Asignado {formatCurrency(allocated, 'EUR')}</div>
            <div className={remaining === 0 ? 'font-semibold text-[var(--success)]' : 'font-semibold text-[var(--danger)]'}>
              Restante {formatCurrency(remaining, 'EUR')}
            </div>
          </div>

          <div className="flex justify-start">
            <Button variant="secondary" onClick={addRow}><Plus className="mr-2 h-4 w-4" />Añadir otra cuenta</Button>
          </div>
        </div>
      </Field>

      <Field label="Notas" error={state.fieldErrors?.notes}>
        <textarea className={textareaClassName(Boolean(state.fieldErrors?.notes))} name="notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Opcional" />
      </Field>

      {state.message ? <div className={state.status === 'error' ? 'rounded-[18px] bg-[rgba(155,91,83,0.1)] px-4 py-3 text-sm text-[var(--danger)]' : 'rounded-[18px] bg-[rgba(85,117,82,0.1)] px-4 py-3 text-sm text-[var(--success)]'}>{state.message}</div> : null}

      <div className="mt-2 flex items-center justify-end gap-3 border-t border-[rgba(123,136,95,0.12)] pt-4">
        <Button variant="secondary" onClick={onClose} disabled={pending}>Cancelar</Button>
        <Button type="submit" disabled={pending || !totalValue || remaining !== 0}>{pending ? 'Guardando...' : 'Guardar cierre'}</Button>
      </div>
    </form>
  );
}
