'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { Building2, PencilLine, Search, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Field, inputClassName, textareaClassName } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { deleteVendorAction, upsertVendorAction } from '@/features/settings/actions';
import { settingsFormInitialState, type SettingsProviderItem } from '@/features/settings/types';

function usageLabel(provider: SettingsProviderItem) {
  const total = provider.expenseCount + provider.invoiceCount;
  if (total === 0) {
    return 'Sin uso todavía';
  }
  return `${provider.expenseCount} gasto${provider.expenseCount === 1 ? '' : 's'}, ${provider.invoiceCount} factura${provider.invoiceCount === 1 ? '' : 's'}`;
}

export function VendorManager({ providers }: { providers: SettingsProviderItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<SettingsProviderItem | null>(null);
  const [state, formAction, pending] = useActionState(upsertVendorAction, settingsFormInitialState);

  useEffect(() => {
    if (state.status === 'success') {
      setEditing(null);
      router.refresh();
    }
  }, [router, state.status]);

  const filteredProviders = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es-ES');
    if (!normalizedQuery) {
      return providers;
    }

    return providers.filter((provider) =>
      [provider.name, provider.email ?? '', provider.phone ?? '', provider.taxId ?? '']
        .join(' ')
        .toLocaleLowerCase('es-ES')
        .includes(normalizedQuery)
    );
  }, [providers, query]);

  return (
    <Card className="grid gap-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Proveedores</h2>
          <p className="text-sm text-[var(--foreground-soft)]">Créelos y mantén su ficha aquí. Luego podrás buscarlos al escribir una factura o un gasto.</p>
        </div>
        <div className="relative w-full md:max-w-[280px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className={inputClassName() + ' pl-10'} placeholder="Buscar proveedor" />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <form action={formAction} className="grid gap-4 rounded-[24px] border border-[rgba(123,136,95,0.12)] bg-[rgba(255,255,255,0.58)] p-4">
          <input type="hidden" name="providerId" value={editing?.id ?? ''} readOnly />
          <Field label="Nombre" error={state.fieldErrors?.name}>
            <input className={inputClassName(Boolean(state.fieldErrors?.name))} name="name" placeholder="Ej. Laboratorios Sierra" defaultValue={editing?.name ?? ''} key={`vendor-name-${editing?.id ?? 'new'}`} />
          </Field>
          <Field label="NIF" error={state.fieldErrors?.taxId}>
            <input className={inputClassName(Boolean(state.fieldErrors?.taxId))} name="taxId" placeholder="Opcional" defaultValue={editing?.taxId ?? ''} key={`vendor-tax-${editing?.id ?? 'new'}`} />
          </Field>
          <Field label="Email" error={state.fieldErrors?.email}>
            <input className={inputClassName(Boolean(state.fieldErrors?.email))} name="email" placeholder="contacto@proveedor.com" defaultValue={editing?.email ?? ''} key={`vendor-email-${editing?.id ?? 'new'}`} />
          </Field>
          <Field label="Teléfono" error={state.fieldErrors?.phone}>
            <input className={inputClassName(Boolean(state.fieldErrors?.phone))} name="phone" placeholder="Opcional" defaultValue={editing?.phone ?? ''} key={`vendor-phone-${editing?.id ?? 'new'}`} />
          </Field>
          <Field label="Notas" error={state.fieldErrors?.notes}>
            <textarea className={textareaClassName(Boolean(state.fieldErrors?.notes))} name="notes" placeholder="Datos útiles para recordar" defaultValue={editing?.notes ?? ''} key={`vendor-notes-${editing?.id ?? 'new'}`} />
          </Field>
          {state.message ? (
            <div className={state.status === 'error' ? 'rounded-[18px] bg-[rgba(155,91,83,0.1)] px-4 py-3 text-sm text-[var(--danger)]' : 'rounded-[18px] bg-[rgba(85,117,82,0.1)] px-4 py-3 text-sm text-[var(--success)]'}>{state.message}</div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 border-t border-[rgba(123,136,95,0.12)] pt-4">
            <Button type="submit" disabled={pending}>{pending ? 'Guardando...' : editing ? 'Guardar proveedor' : 'Crear proveedor'}</Button>
            {editing ? (
              <Button variant="secondary" onClick={() => setEditing(null)} disabled={pending}>Cancelar edición</Button>
            ) : null}
          </div>
        </form>

        <div className="grid gap-3">
          {filteredProviders.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[rgba(123,136,95,0.18)] bg-[rgba(255,255,255,0.46)] px-5 py-6 text-sm text-[var(--foreground-soft)]">
              No hay proveedores que coincidan con tu búsqueda.
            </div>
          ) : (
            filteredProviders.map((provider) => {
              const canDelete = provider.expenseCount + provider.invoiceCount === 0;
              return (
                <div key={provider.id} className="rounded-[24px] border border-[rgba(123,136,95,0.12)] bg-[rgba(255,255,255,0.56)] px-5 py-4 shadow-[0_10px_24px_rgba(60,70,49,0.04)]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-[var(--foreground)]">{provider.name}</h3>
                          <p className="text-xs uppercase tracking-[0.14em] text-[var(--foreground-muted)]">{usageLabel(provider)}</p>
                        </div>
                      </div>
                      <div className="grid gap-1 text-sm text-[var(--foreground-soft)] md:grid-cols-2">
                        <p>{provider.taxId || 'Sin NIF guardado'}</p>
                        <p>{provider.email || 'Sin email'}</p>
                        <p>{provider.phone || 'Sin teléfono'}</p>
                        <p>{provider.notes || 'Sin notas'}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="secondary" onClick={() => setEditing(provider)}>
                        <PencilLine className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <form action={deleteVendorAction}>
                        <input type="hidden" name="providerId" value={provider.id} />
                        <Button variant="ghost" type="submit" disabled={!canDelete} title={canDelete ? 'Eliminar proveedor' : 'No se puede borrar si ya tiene movimientos'}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}
