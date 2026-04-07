'use client';

import { useActionState, useEffect } from 'react';
import { CalendarCheck2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Field, inputClassName, textareaClassName } from '@/components/forms/form-field';
import { Sheet } from '@/components/forms/sheet';
import { Button } from '@/components/ui/button';
import { paymentMethodOptions } from '@/features/expenses/helpers';
import { addInvoicePaymentAction } from '@/features/invoices/actions';
import { invoicePaymentFormInitialState, type InvoiceCatalogs, type InvoiceListItem } from '@/features/invoices/types';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function InvoicePaymentSheet({
  open,
  onClose,
  catalogs,
  invoice,
  returnPath
}: {
  open: boolean;
  onClose: () => void;
  catalogs: InvoiceCatalogs;
  invoice: InvoiceListItem | null;
  returnPath: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(addInvoicePaymentAction, invoicePaymentFormInitialState);

  useEffect(() => {
    if (state.status === 'success') {
      router.refresh();
      onClose();
    }
  }, [onClose, router, state.status]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Registrar pago"
      description={invoice ? `Factura ${invoice.invoiceNumber} · pendiente ${invoice.pendingAmount.toFixed(2)} €` : 'Registra un pago parcial o total en una cuenta existente.'}
    >
      {open && invoice ? (
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="invoiceId" value={invoice.id} />
          <input type="hidden" name="returnPath" value={returnPath} />

          <Field label="Cuenta" error={state.fieldErrors?.accountId}>
            <select className={inputClassName(Boolean(state.fieldErrors?.accountId))} name="accountId" defaultValue={catalogs.accounts[0]?.id ?? ''}>
              {catalogs.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Fecha" error={state.fieldErrors?.paymentDate}>
              <div className="relative">
                <CalendarCheck2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
                <input className={inputClassName(Boolean(state.fieldErrors?.paymentDate)) + ' pl-11'} type="date" name="paymentDate" defaultValue={todayIso()} />
              </div>
            </Field>
            <Field label="Importe" error={state.fieldErrors?.amount} hint={`Pendiente actual: ${invoice.pendingAmount.toFixed(2)} €`}>
              <input className={inputClassName(Boolean(state.fieldErrors?.amount))} type="number" step="0.01" min="0.01" max={invoice.pendingAmount} name="amount" defaultValue={invoice.pendingAmount.toFixed(2)} />
            </Field>
          </div>

          <Field label="Método de pago" error={state.fieldErrors?.paymentMethod}>
            <select className={inputClassName(Boolean(state.fieldErrors?.paymentMethod))} name="paymentMethod" defaultValue="transfer">
              {paymentMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Referencia" error={state.fieldErrors?.reference}>
            <input className={inputClassName(Boolean(state.fieldErrors?.reference))} name="reference" placeholder="Ej. transferencia mayo" />
          </Field>

          <Field label="Notas" error={state.fieldErrors?.notes}>
            <textarea className={textareaClassName(Boolean(state.fieldErrors?.notes))} name="notes" placeholder="Detalle opcional del pago" />
          </Field>

          {state.message ? (
            <div className={state.status === 'error' ? 'rounded-[18px] bg-[rgba(155,91,83,0.1)] px-4 py-3 text-sm text-[var(--danger)]' : 'rounded-[18px] bg-[rgba(85,117,82,0.1)] px-4 py-3 text-sm text-[var(--success)]'}>
              {state.message}
            </div>
          ) : null}

          <div className="mt-2 flex items-center justify-end gap-3 border-t border-[rgba(123,136,95,0.12)] pt-4">
            <Button variant="secondary" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Guardando...' : 'Registrar pago'}
            </Button>
          </div>
        </form>
      ) : null}
    </Sheet>
  );
}
