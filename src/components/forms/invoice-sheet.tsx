'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { CalendarRange, Paperclip, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Field, inputClassName, textareaClassName } from '@/components/forms/form-field';
import { Sheet } from '@/components/forms/sheet';
import { Button } from '@/components/ui/button';
import { upsertInvoiceAction } from '@/features/invoices/actions';
import { invoiceFormInitialState, type InvoiceCatalogs, type InvoiceListItem } from '@/features/invoices/types';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function dueDateDefault() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

export function InvoiceSheet({
  open,
  onClose,
  catalogs,
  invoice,
  returnPath,
  title
}: {
  open: boolean;
  onClose: () => void;
  catalogs: InvoiceCatalogs;
  invoice?: InvoiceListItem | null;
  returnPath: string;
  title?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(upsertInvoiceAction, invoiceFormInitialState);

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
      title={title ?? (invoice ? 'Editar factura' : 'Nueva factura')}
      description={invoice ? 'Actualiza fechas, importes o adjuntos sin salir del panel.' : 'Registra una factura recibida con su vencimiento y documentación.'}
    >
      {open ? (
        <form key={invoice?.id ?? 'new-invoice'} action={formAction} className="grid gap-4">
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
                  defaultValue={invoice?.vendorName ?? ''}
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
            <input className={inputClassName(Boolean(state.fieldErrors?.invoiceNumber))} name="invoiceNumber" placeholder="Ej. A-2026-041" defaultValue={invoice?.invoiceNumber ?? ''} />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Emisión" error={state.fieldErrors?.issueDate}>
              <div className="relative">
                <CalendarRange className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
                <input className={inputClassName(Boolean(state.fieldErrors?.issueDate)) + ' pl-11'} type="date" name="issueDate" defaultValue={invoice?.issueDate ?? todayIso()} />
              </div>
            </Field>
            <Field label="Vencimiento" error={state.fieldErrors?.dueDate}>
              <div className="relative">
                <CalendarRange className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
                <input className={inputClassName(Boolean(state.fieldErrors?.dueDate)) + ' pl-11'} type="date" name="dueDate" defaultValue={invoice?.dueDate ?? dueDateDefault()} />
              </div>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Base" error={state.fieldErrors?.subtotal}>
              <input className={inputClassName(Boolean(state.fieldErrors?.subtotal))} type="number" step="0.01" min="0" name="subtotal" defaultValue={invoice?.subtotal ?? 0} />
            </Field>
            <Field label="Impuestos" error={state.fieldErrors?.taxAmount}>
              <input className={inputClassName(Boolean(state.fieldErrors?.taxAmount))} type="number" step="0.01" min="0" name="taxAmount" defaultValue={invoice?.taxAmount ?? 0} />
            </Field>
          </div>

          <Field label="Notas" error={state.fieldErrors?.notes}>
            <textarea className={textareaClassName(Boolean(state.fieldErrors?.notes))} name="notes" placeholder="Observaciones internas" defaultValue={invoice?.notes ?? ''} />
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
      ) : null}
    </Sheet>
  );
}
