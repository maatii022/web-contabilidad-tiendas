'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { CalendarClock, Paperclip, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Field, inputClassName, textareaClassName } from '@/components/forms/form-field';
import { Sheet } from '@/components/forms/sheet';
import { useCloseOnSuccess, useSheetSessionKey } from '@/components/forms/sheet-session';
import { Button } from '@/components/ui/button';
import { paymentMethodOptions } from '@/features/expenses/helpers';
import { upsertExpenseAction } from '@/features/expenses/actions';
import { expenseFormInitialState, type ExpenseCatalogs, type ExpenseListItem } from '@/features/expenses/types';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function ExpenseSheet({ open, onClose, catalogs, expense, returnPath, title }: { open: boolean; onClose: () => void; catalogs: ExpenseCatalogs; expense?: ExpenseListItem | null; returnPath: string; title?: string; }) {
  const sessionKey = useSheetSessionKey(open, expense?.id ?? 'new');
  return (
    <Sheet open={open} onClose={onClose} title={title ?? (expense ? 'Editar gasto' : 'Nuevo gasto')} description={expense ? 'Actualiza importe, cuenta o adjunto sin salir del panel.' : 'Registra un gasto y, si procede, deja el movimiento reflejado en la cuenta elegida.'}>
      {open ? <ExpenseSheetForm key={`${expense?.id ?? 'new'}-${sessionKey}`} onClose={onClose} catalogs={catalogs} expense={expense} returnPath={returnPath} /> : null}
    </Sheet>
  );
}

function ExpenseSheetForm({ onClose, catalogs, expense, returnPath }: { onClose: () => void; catalogs: ExpenseCatalogs; expense?: ExpenseListItem | null; returnPath: string; }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(upsertExpenseAction, expenseFormInitialState);
  useCloseOnSuccess(state.status, () => { router.refresh(); onClose(); });
  const hasCategories = catalogs.categories.length > 0;

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="expenseId" defaultValue={expense?.id ?? ''} />
      <input type="hidden" name="returnPath" value={returnPath} />

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Fecha" error={state.fieldErrors?.expenseDate}>
          <div className="relative">
            <CalendarClock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input className={inputClassName(Boolean(state.fieldErrors?.expenseDate)) + ' pl-11'} type="date" name="expenseDate" defaultValue={expense?.expenseDate ?? todayIso()} />
          </div>
        </Field>
        <Field label="Categoría" error={state.fieldErrors?.categoryId} hint={hasCategories ? undefined : 'Créala en Configuración antes de registrar el gasto.'}>
          <div className="grid gap-2">
            <select className={inputClassName(Boolean(state.fieldErrors?.categoryId))} name="categoryId" defaultValue={expense?.categoryId ?? catalogs.categories[0]?.id ?? ''} disabled={!hasCategories}>
              {hasCategories ? catalogs.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>) : <option value="">Sin categorías</option>}
            </select>
            {!hasCategories ? <Link href="/configuracion" className="text-xs font-medium text-[var(--accent-strong)] underline-offset-4 hover:underline">Crear categorías en Configuración</Link> : null}
          </div>
        </Field>
      </div>

      <Field label="Proveedor" error={state.fieldErrors?.vendorName} hint="Opcional. Escribe para filtrar proveedores ya guardados.">
        <div className="grid gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input list="expense-vendor-options" className={inputClassName(Boolean(state.fieldErrors?.vendorName)) + ' pl-11'} name="vendorName" placeholder={catalogs.vendors.length ? 'Escribe el nombre del proveedor' : 'No hay proveedores todavía'} defaultValue={expense?.vendorName ?? ''} autoComplete="off" />
            <datalist id="expense-vendor-options">{catalogs.vendors.map((vendor) => <option key={vendor.id} value={vendor.name} />)}</datalist>
          </div>
          {!catalogs.vendors.length ? <Link href="/configuracion" className="text-xs font-medium text-[var(--accent-strong)] underline-offset-4 hover:underline">Crear proveedores en Configuración</Link> : null}
        </div>
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Cuenta" error={state.fieldErrors?.accountId} hint="Opcional. Si la eliges, el movimiento impacta en saldo.">
          <select className={inputClassName(Boolean(state.fieldErrors?.accountId))} name="accountId" defaultValue={expense?.accountId ?? ''}>
            <option value="">Sin cuenta</option>
            {catalogs.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
        </Field>
        <Field label="Método de pago" error={state.fieldErrors?.paymentMethod}>
          <select className={inputClassName(Boolean(state.fieldErrors?.paymentMethod))} name="paymentMethod" defaultValue={expense?.paymentMethod ?? 'card'}>
            {paymentMethodOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Base" error={state.fieldErrors?.baseAmount}>
          <input className={inputClassName(Boolean(state.fieldErrors?.baseAmount))} type="number" step="0.01" min="0" name="baseAmount" defaultValue={expense?.baseAmount?.toFixed(2) ?? '0.00'} />
        </Field>
        <Field label="Total" error={state.fieldErrors?.totalAmount} hint="Si no pones impuesto, total y base pueden coincidir.">
          <input className={inputClassName(Boolean(state.fieldErrors?.totalAmount))} type="number" step="0.01" min="0" name="totalAmount" defaultValue={expense?.totalAmount?.toFixed(2) ?? '0.00'} />
        </Field>
      </div>

      <Field label="Notas" error={state.fieldErrors?.notes}>
        <textarea className={textareaClassName(Boolean(state.fieldErrors?.notes))} name="notes" placeholder="Concepto breve para identificar el gasto" defaultValue={expense?.notes ?? ''} />
      </Field>

      <Field label="Adjunto" error={state.fieldErrors?.attachment} hint="PDF o imagen, hasta 10 MB.">
        <div className="rounded-[24px] border border-dashed border-[rgba(123,136,95,0.22)] bg-white/60 p-4">
          <div className="flex items-center gap-3 text-sm text-[var(--foreground-soft)]"><Paperclip className="h-4 w-4" /><span>{expense ? 'Añadir adjunto adicional' : 'Adjuntar ticket o factura'}</span></div>
          <input className="mt-3 block w-full text-sm text-[var(--foreground-soft)]" type="file" name="attachment" accept="application/pdf,image/jpeg,image/png,image/webp" />
          {expense && expense.attachments.length > 0 ? <div className="mt-4 grid gap-2 rounded-[18px] bg-[rgba(110,127,86,0.08)] p-3">{expense.attachments.map((attachment) => <a key={attachment.id} href={attachment.url ?? '#'} target="_blank" rel="noreferrer" className="text-sm font-medium text-[var(--accent-strong)] underline-offset-4 hover:underline">{attachment.fileName}</a>)}</div> : null}
        </div>
      </Field>

      {state.message ? <div className={state.status === 'error' ? 'rounded-[18px] bg-[rgba(155,91,83,0.1)] px-4 py-3 text-sm text-[var(--danger)]' : 'rounded-[18px] bg-[rgba(85,117,82,0.1)] px-4 py-3 text-sm text-[var(--success)]'}>{state.message}</div> : null}

      <div className="mt-2 flex items-center justify-end gap-3 border-t border-[rgba(123,136,95,0.12)] pt-4">
        <Button variant="secondary" onClick={onClose} disabled={pending}>Cancelar</Button>
        <Button type="submit" disabled={pending || !hasCategories}>{pending ? 'Guardando...' : expense ? 'Guardar cambios' : 'Registrar gasto'}</Button>
      </div>
    </form>
  );
}
