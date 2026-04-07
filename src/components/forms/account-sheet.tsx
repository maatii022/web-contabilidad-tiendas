'use client';

import { useActionState, useEffect } from 'react';
import { Landmark } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Field, inputClassName } from '@/components/forms/form-field';
import { Sheet } from '@/components/forms/sheet';
import { Button } from '@/components/ui/button';
import { accountTypeOptions } from '@/features/accounts/helpers';
import { upsertAccountAction } from '@/features/accounts/actions';
import { accountFormInitialState, type AccountFormState, type AccountSummaryItem } from '@/features/accounts/types';

export function AccountSheet({
  open,
  onClose,
  account,
  returnPath
}: {
  open: boolean;
  onClose: () => void;
  account?: AccountSummaryItem | null;
  returnPath: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(upsertAccountAction, accountFormInitialState);

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
      title={account ? 'Editar cuenta' : 'Nueva cuenta'}
      description={account ? 'Actualiza nombre, tipo o saldo inicial sin tocar los movimientos existentes.' : 'Crea una cuenta operativa para caja, banco o efectivo.'}
    >
      {open ? (
        <form key={account?.id ?? 'new-account'} action={formAction} className="grid gap-4">
          <input type="hidden" name="accountId" defaultValue={account?.id ?? ''} />
          <input type="hidden" name="returnPath" value={returnPath} />

          <Field label="Nombre" error={state.fieldErrors?.name}>
            <div className="relative">
              <Landmark className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
              <input className={inputClassName(Boolean(state.fieldErrors?.name)) + ' pl-11'} name="name" placeholder="Ej. Banco principal" defaultValue={account?.name ?? ''} />
            </div>
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tipo" error={state.fieldErrors?.type}>
              <select className={inputClassName(Boolean(state.fieldErrors?.type))} name="type" defaultValue={account?.type ?? 'bank'}>
                {accountTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Saldo inicial" error={state.fieldErrors?.initialBalance} hint="Puedes usar negativo si partes con desfase.">
              <input className={inputClassName(Boolean(state.fieldErrors?.initialBalance))} type="number" step="0.01" name="initialBalance" defaultValue={account?.initialBalance ?? 0} />
            </Field>
          </div>

          <label className="flex items-start gap-3 rounded-[22px] border border-[rgba(123,136,95,0.16)] bg-white/70 px-4 py-4 text-sm text-[var(--foreground-soft)]">
            <input className="mt-1 h-4 w-4 accent-[var(--accent)]" type="checkbox" name="isPrimary" defaultChecked={Boolean(account?.isPrimary)} />
            <span>
              <span className="block font-medium text-[var(--foreground)]">Usar como cuenta principal</span>
              <span className="mt-1 block">Se mostrará antes en dashboard y caja.</span>
            </span>
          </label>

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
              {pending ? 'Guardando...' : account ? 'Guardar cambios' : 'Crear cuenta'}
            </Button>
          </div>
        </form>
      ) : null}
    </Sheet>
  );
}
