'use client';

import { useActionState, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Field, inputClassName, textareaClassName } from '@/components/forms/form-field';
import { Sheet } from '@/components/forms/sheet';
import { Button } from '@/components/ui/button';
import { createAccountEntryAction } from '@/features/accounts/actions';
import { entryTypeOptions } from '@/features/accounts/helpers';
import { accountEntryFormInitialState, type CashCatalogs } from '@/features/accounts/types';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function AccountEntrySheet({
  open,
  onClose,
  catalogs,
  returnPath,
  presetAccountId
}: {
  open: boolean;
  onClose: () => void;
  catalogs: CashCatalogs;
  returnPath: string;
  presetAccountId?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createAccountEntryAction, accountEntryFormInitialState);

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
      title="Nuevo movimiento"
      description="Registra una entrada, salida o ajuste manual en la cuenta elegida."
    >
      {open ? (
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="returnPath" value={returnPath} />

          <Field label="Cuenta" error={state.fieldErrors?.accountId}>
            <select className={inputClassName(Boolean(state.fieldErrors?.accountId))} name="accountId" defaultValue={presetAccountId ?? catalogs.accounts[0]?.id ?? ''}>
              {catalogs.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Fecha" error={state.fieldErrors?.entryDate}>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
                <input className={inputClassName(Boolean(state.fieldErrors?.entryDate)) + ' pl-11'} type="date" name="entryDate" defaultValue={todayIso()} />
              </div>
            </Field>
            <Field label="Tipo" error={state.fieldErrors?.type} hint="En ajuste puedes usar importe positivo o negativo.">
              <select className={inputClassName(Boolean(state.fieldErrors?.type))} name="type" defaultValue="income">
                {entryTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Concepto" error={state.fieldErrors?.concept}>
            <input className={inputClassName(Boolean(state.fieldErrors?.concept))} name="concept" placeholder="Ej. ingreso de mostrador" />
          </Field>

          <Field label="Importe" error={state.fieldErrors?.amount}>
            <input className={inputClassName(Boolean(state.fieldErrors?.amount))} type="number" step="0.01" name="amount" placeholder="0,00" />
          </Field>

          <Field label="Notas" error={state.fieldErrors?.notes}>
            <textarea className={textareaClassName(Boolean(state.fieldErrors?.notes))} name="notes" placeholder="Detalle opcional" />
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
              {pending ? 'Guardando...' : 'Registrar movimiento'}
            </Button>
          </div>
        </form>
      ) : null}
    </Sheet>
  );
}
