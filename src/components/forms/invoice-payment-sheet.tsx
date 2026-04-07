'use client';

import { useActionState, useEffect } from 'react';
import { CalendarCheck2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Field, inputClassName, textareaClassName } from '@/components/forms/form-field';
import { Sheet } from '@/components/forms/sheet';
import { Button } from '@/components/ui/button';
import { paymentMethodOptions } from '@/features/expenses/helpers';
import { addInvoicePaymentAction } from '@/features/invoices/actions';
import { invoicePaymentFormInitialState, type InvoiceCatalogs, type InvoiceInstallmentItem, type InvoiceListItem, type InvoicePaymentItem, type InvoicePaymentSheetMode } from '@/features/invoices/types';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function InvoicePaymentSheet({
  open,
  onClose,
  catalogs,
  invoice,
  payment,
  installment,
  returnPath,
  mode = 'create'
}: {
  open: boolean;
  onClose: () => void;
  catalogs: InvoiceCatalogs;
  invoice: InvoiceListItem | null;
  payment?: InvoicePaymentItem | null;
  installment?: InvoiceInstallmentItem | null;
  returnPath: string;
  mode?: InvoicePaymentSheetMode;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(addInvoicePaymentAction, invoicePaymentFormInitialState);

  useEffect(() => {
    if (state.status === 'success') {
      router.refresh();
      onClose();
    }
  }, [onClose, router, state.status]);

  const activePayment = payment ?? null;
  const defaultAccountId = activePayment?.accountId ?? catalogs.accounts[0]?.id ?? '';
  const defaultPaymentDate = activePayment?.paymentDate ?? todayIso();
  const defaultAmount = activePayment ? activePayment.amount.toFixed(2) : installment ? installment.pendingAmount.toFixed(2) : invoice ? invoice.pendingAmount.toFixed(2) : '';
  const defaultMethod = activePayment?.paymentMethod ?? 'transfer';
  const defaultReference = activePayment?.reference ?? '';
  const defaultNotes = activePayment?.notes ?? '';

  const title = mode === 'edit' ? 'Editar pago' : 'Registrar pago';
  const description = invoice
    ? mode === 'edit'
      ? `Edita el pago de la factura ${invoice.invoiceNumber}.`
      : `Factura ${invoice.invoiceNumber} · pendiente ${invoice.pendingAmount.toFixed(2)} €`
    : 'Registra un pago en una cuenta existente.';

  return (
    <Sheet open={open} onClose={onClose} title={title} description={description}>
      {open && invoice ? (
        <form key={`${invoice.id}-${activePayment?.id ?? 'new'}-${installment?.id ?? 'all'}`} action={formAction} className="grid gap-4">
          <input type="hidden" name="paymentId" value={activePayment?.id ?? ''} />
          <input type="hidden" name="invoiceId" value={invoice.id} />
          <input type="hidden" name="returnPath" value={returnPath} />

          <Field label="Cuenta" error={state.fieldErrors?.accountId}>
            <select className={inputClassName(Boolean(state.fieldErrors?.accountId))} name="accountId" defaultValue={defaultAccountId}>
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
                <input className={inputClassName(Boolean(state.fieldErrors?.paymentDate)) + ' pl-11'} type="date" name="paymentDate" defaultValue={defaultPaymentDate} />
              </div>
            </Field>
            <Field label="Importe" error={state.fieldErrors?.amount} hint={installment ? `Pendiente de este vencimiento: ${installment.pendingAmount.toFixed(2)} €` : `Pendiente actual: ${invoice.pendingAmount.toFixed(2)} €`}>
              <input className={inputClassName(Boolean(state.fieldErrors?.amount))} type="number" step="0.01" min="0.01" name="amount" defaultValue={defaultAmount} />
            </Field>
          </div>

          <Field label="Método de pago" error={state.fieldErrors?.paymentMethod}>
            <select className={inputClassName(Boolean(state.fieldErrors?.paymentMethod))} name="paymentMethod" defaultValue={defaultMethod}>
              {paymentMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Referencia" error={state.fieldErrors?.reference}>
            <input className={inputClassName(Boolean(state.fieldErrors?.reference))} name="reference" defaultValue={defaultReference} placeholder="Ej. transferencia mayo" />
          </Field>

          <Field label="Notas" error={state.fieldErrors?.notes}>
            <textarea className={textareaClassName(Boolean(state.fieldErrors?.notes))} name="notes" defaultValue={defaultNotes} placeholder="Detalle opcional del pago" />
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
              {pending ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Registrar pago'}
            </Button>
          </div>
        </form>
      ) : null}
    </Sheet>
  );
}
