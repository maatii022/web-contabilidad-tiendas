'use client';

import Link from 'next/link';
import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { CalendarRange, Paperclip, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Field, inputClassName, textareaClassName } from '@/components/forms/form-field';
import { Sheet } from '@/components/forms/sheet';
import { useCloseOnSuccess, useSheetSessionKey } from '@/components/forms/sheet-session';
import { Button } from '@/components/ui/button';
import { upsertInvoiceAction } from '@/features/invoices/actions';
import {
  invoiceFormInitialState,
  invoicePlanOptions,
  type InvoiceCatalogs,
  type InvoiceListItem,
  type InvoicePlan
} from '@/features/invoices/types';
import { cn } from '@/lib/utils';

type DraftInstallment = {
  id: string;
  dueDate: string;
  amount: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function dueDateDefault() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function centsToAmount(cents: number) {
  return (cents / 100).toFixed(2);
}

function splitTotal(total: number, count: number) {
  const totalCents = Math.round(total * 100);
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;

  return Array.from({ length: count }, (_, index) => centsToAmount(base + (index === count - 1 ? remainder : 0)));
}

function planOffsets(plan: InvoicePlan) {
  switch (plan) {
    case 'single':
    case '30':
      return [0];
    case '30/60':
      return [0, 30];
    case '30/60/90':
      return [0, 30, 60];
    case '30/60/90/120':
      return [0, 30, 60, 90];
    default:
      return [0];
  }
}

function inferPlan(invoice?: InvoiceListItem | null): InvoicePlan {
  if (!invoice || invoice.installments.length <= 1) {
    return 'single';
  }

  const count = invoice.installments.length;

  if (count === 2) return '30/60';
  if (count === 3) return '30/60/90';
  if (count === 4) return '30/60/90/120';
  return 'custom';
}

function buildSchedule(total: number, firstDueDate: string, plan: InvoicePlan) {
  const offsets = planOffsets(plan);
  const amounts = splitTotal(total, offsets.length);
  return offsets.map((offset, index) => ({
    id: `${index + 1}`,
    dueDate: addDays(firstDueDate, offset),
    amount: amounts[index]
  }));
}

function initialSchedule(invoice?: InvoiceListItem | null) {
  if (invoice?.installments.length) {
    return invoice.installments.map((item) => ({
      id: item.id,
      dueDate: item.dueDate,
      amount: item.amount.toFixed(2)
    }));
  }

  return buildSchedule(0, dueDateDefault(), 'single');
}

type InvoiceSheetProps = {
  open: boolean;
  onClose: () => void;
  catalogs: InvoiceCatalogs;
  invoice?: InvoiceListItem | null;
  returnPath: string;
  title?: string;
};

export function InvoiceSheet(props: InvoiceSheetProps) {
  const { open, invoice } = props;
  const sessionKey = useSheetSessionKey(open, props.invoice?.id ?? 'new');

  return (
    <Sheet
      open={props.open}
      onClose={props.onClose}
      title={props.title ?? (props.invoice ? 'Editar factura' : 'Nueva factura')}
      description={props.invoice ? 'Actualiza calendario, importes o adjuntos sin salir del panel.' : 'Registra una factura recibida con vencimientos reales y documentación.'}
    >
      {props.open ? <InvoiceSheetForm key={`${props.invoice?.id ?? 'new'}-${sessionKey}`} {...props} /> : null}
    </Sheet>
  );
}

function InvoiceSheetForm({
  onClose,
  catalogs,
  invoice,
  returnPath,
  title
}: Omit<InvoiceSheetProps, 'open'> & { title?: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction, pending] = useActionState(upsertInvoiceAction, invoiceFormInitialState);
  const [vendorName, setVendorName] = useState(invoice?.vendorName ?? '');
  const [invoiceNumber, setInvoiceNumber] = useState(invoice?.invoiceNumber ?? '');
  const [issueDate, setIssueDate] = useState(invoice?.issueDate ?? todayIso());
  const [notes, setNotes] = useState(invoice?.notes ?? '');
  const [total, setTotal] = useState(invoice?.total.toFixed(2) ?? '0.00');
  const [firstDueDate, setFirstDueDate] = useState(invoice?.installments[0]?.dueDate ?? invoice?.dueDate ?? dueDateDefault());
  const [plan, setPlan] = useState<InvoicePlan>(inferPlan(invoice));
  const [installments, setInstallments] = useState<DraftInstallment[]>(initialSchedule(invoice));

  useEffect(() => {
    setVendorName(invoice?.vendorName ?? '');
    setInvoiceNumber(invoice?.invoiceNumber ?? '');
    setIssueDate(invoice?.issueDate ?? todayIso());
    setNotes(invoice?.notes ?? '');
    setTotal(invoice?.total.toFixed(2) ?? '0.00');
    setFirstDueDate(invoice?.installments[0]?.dueDate ?? invoice?.dueDate ?? dueDateDefault());
    setPlan(inferPlan(invoice));
    setInstallments(initialSchedule(invoice));
  }, [invoice]);

  useCloseOnSuccess(state.status, () => {
    router.refresh();
    onClose();
  });

  useEffect(() => {
    if (plan === 'custom') return;
    const numericTotal = Number.parseFloat(total.replace(',', '.')) || 0;
    setInstallments(buildSchedule(numericTotal, firstDueDate || dueDateDefault(), plan));
  }, [firstDueDate, plan, total]);

  const currentTotal = useMemo(() => installments.reduce((sum, item) => sum + (Number.parseFloat(item.amount.replace(',', '.')) || 0), 0), [installments]);

  function updateInstallment(index: number, patch: Partial<DraftInstallment>) {
    setInstallments((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function handlePlanChange(nextPlan: InvoicePlan) {
    setPlan(nextPlan);
    if (nextPlan !== 'custom') {
      const numericTotal = Number.parseFloat(total.replace(',', '.')) || 0;
      setInstallments(buildSchedule(numericTotal, firstDueDate || dueDateDefault(), nextPlan));
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== 'Enter') return;

    const target = event.target as HTMLElement;
    if (target instanceof HTMLButtonElement) return;
    if (target instanceof HTMLInputElement && target.type === 'file') return;

    event.preventDefault();

    const form = formRef.current;
    if (!form) return;

    const focusable = Array.from(
      form.querySelectorAll<HTMLElement>('input:not([type="hidden"]):not([type="file"]), select, textarea, button[type="submit"]')
    ).filter((element) => !element.hasAttribute('disabled'));

    const currentIndex = focusable.indexOf(target);

    if (currentIndex === -1) return;
    const next = focusable[currentIndex + 1];

    if (next) {
      next.focus();
      if (next instanceof HTMLInputElement && ['text', 'number', 'date'].includes(next.type)) {
        next.select?.();
      }
      return;
    }

    form.requestSubmit();
  }

  return (
    <form ref={formRef} key={invoice?.id ?? 'new-invoice'} action={formAction} className="grid gap-4" onKeyDown={handleKeyDown}>
      <input type="hidden" name="invoiceId" defaultValue={invoice?.id ?? ''} />
      <input type="hidden" name="returnPath" value={returnPath} />

      <Field label="Proveedor" error={state.fieldErrors?.vendorName} hint="Escribe para filtrar proveedores ya creados en Configuración.">
        <div className="grid gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input
              list="invoice-vendor-options"
              className={inputClassName(Boolean(state.fieldErrors?.vendorName)) + ' pl-11'}
              name="vendorName"
              placeholder={catalogs.vendors.length ? 'Escribe el nombre del proveedor' : 'Primero crea proveedores en Configuración'}
              value={vendorName}
              onChange={(event) => setVendorName(event.target.value)}
              autoComplete="off"
            />
            <datalist id="invoice-vendor-options">
              {catalogs.vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.name} />
              ))}
            </datalist>
          </div>
          {!catalogs.vendors.length ? (
            <Link href="/configuracion" className="text-xs font-medium text-[var(--accent-strong)] underline-offset-4 hover:underline">
              Crear proveedores en Configuración
            </Link>
          ) : null}
        </div>
      </Field>

      <Field label="Número de factura" error={state.fieldErrors?.invoiceNumber}>
        <input className={inputClassName(Boolean(state.fieldErrors?.invoiceNumber))} name="invoiceNumber" placeholder="Ej. A-2026-041" value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Emisión" error={state.fieldErrors?.issueDate}>
          <div className="relative">
            <CalendarRange className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input className={inputClassName(Boolean(state.fieldErrors?.issueDate)) + ' pl-11'} type="date" name="issueDate" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
          </div>
        </Field>
        <Field label="Primer vencimiento" error={state.fieldErrors?.installments || state.fieldErrors?.dueDate}>
          <div className="relative">
            <CalendarRange className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input
              className={inputClassName(Boolean(state.fieldErrors?.installments || state.fieldErrors?.dueDate)) + ' pl-11'}
              type="date"
              value={firstDueDate}
              onChange={(event) => setFirstDueDate(event.target.value)}
            />
          </div>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Total" error={state.fieldErrors?.total} hint="Solo total final de la factura.">
          <input
            className={inputClassName(Boolean(state.fieldErrors?.total))}
            type="number"
            step="0.01"
            min="0"
            name="total"
            value={total}
            onChange={(event) => setTotal(event.target.value)}
          />
        </Field>
        <Field label="Plan de pagos" hint="Genera vencimientos automáticos desde el primero.">
          <select className={inputClassName()} value={plan} onChange={(event) => handlePlanChange(event.target.value as InvoicePlan)}>
            {invoicePlanOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Vencimientos"
        error={state.fieldErrors?.installments}
        hint="Puedes ajustar fechas e importes antes de guardar."
      >
        <div className="grid gap-3 rounded-[24px] border border-[rgba(123,136,95,0.14)] bg-white/58 p-4">
          {installments.map((installment, index) => (
            <div key={installment.id} className="grid gap-3 rounded-[20px] border border-[rgba(123,136,95,0.12)] bg-white/78 p-3 md:grid-cols-[88px_minmax(0,1fr)_160px] md:items-center">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">Pago {index + 1}</div>
              <input
                type="date"
                name="installmentDueDate"
                className={inputClassName()}
                value={installment.dueDate}
                onChange={(event) => updateInstallment(index, { dueDate: event.target.value })}
              />
              <input
                type="number"
                step="0.01"
                min="0"
                name="installmentAmount"
                className={inputClassName()}
                value={installment.amount}
                onChange={(event) => updateInstallment(index, { amount: event.target.value })}
              />
            </div>
          ))}
          <div className={cn('rounded-[18px] px-4 py-3 text-sm', Math.abs(currentTotal - (Number.parseFloat(total.replace(',', '.')) || 0)) > 0.01 ? 'bg-[rgba(155,91,83,0.1)] text-[var(--danger)]' : 'bg-[rgba(110,127,86,0.12)] text-[var(--accent-strong)]')}>
            Calendario: {currentTotal.toFixed(2)} €
          </div>
        </div>
      </Field>

      <Field label="Notas" error={state.fieldErrors?.notes}>
        <textarea className={textareaClassName(Boolean(state.fieldErrors?.notes))} name="notes" placeholder="Observaciones internas" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </Field>

      <Field label="Adjunto" hint="PDF o imagen, hasta 10 MB.">
        <div className="rounded-[24px] border border-dashed border-[rgba(123,136,95,0.22)] bg-white/60 p-4">
          <div className="flex items-center gap-3 text-sm text-[var(--foreground-soft)]">
            <Paperclip className="h-4 w-4" />
            <span>{invoice ? 'Añadir adjunto adicional' : 'Adjuntar factura o albarán'}</span>
          </div>
          <input className="mt-3 block w-full text-sm text-[var(--foreground-soft)]" type="file" name="attachment" accept="application/pdf,image/jpeg,image/png,image/webp" />
          {invoice && invoice.attachments.length > 0 ? (
            <div className="mt-4 grid gap-2 rounded-[18px] bg-[rgba(110,127,86,0.08)] p-3">
              {invoice.attachments.map((attachment) => (
                <a key={attachment.id} href={attachment.url ?? '#'} target="_blank" rel="noreferrer" className="text-sm font-medium text-[var(--accent-strong)] underline-offset-4 hover:underline">
                  {attachment.fileName}
                </a>
              ))}
            </div>
          ) : null}
        </div>
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
          {pending ? 'Guardando...' : invoice ? 'Guardar cambios' : 'Registrar factura'}
        </Button>
      </div>
    </form>
  );
}
