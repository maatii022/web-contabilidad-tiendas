'use client';

import { useActionState } from 'react';
import { CalendarRange } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Field, inputClassName, textareaClassName } from '@/components/forms/form-field';
import { Sheet } from '@/components/forms/sheet';
import { useCloseOnSuccess, useSheetSessionKey } from '@/components/forms/sheet-session';
import { Button } from '@/components/ui/button';
import { createDailyClosingAction } from '@/features/accounts/actions';
import { dailyClosingFormInitialState, type CashCatalogs } from '@/features/accounts/types';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function DailyClosingSheet({ open, onClose, catalogs, returnPath, presetAccountId }: { open: boolean; onClose: () => void; catalogs: CashCatalogs; returnPath: string; presetAccountId?: string; }) {
  const sessionKey = useSheetSessionKey(open, presetAccountId ?? 'closing');

  return (
    <Sheet open={open} onClose={onClose} title="Cierre clásico" description="Solo si quieres guardar un cierre manual completo para una cuenta concreta.">
      {open ? <DailyClosingSheetForm key={`${presetAccountId ?? 'default'}-${sessionKey}`} onClose={onClose} catalogs={catalogs} returnPath={returnPath} presetAccountId={presetAccountId} /> : null}
    </Sheet>
  );
}

function DailyClosingSheetForm({ onClose, catalogs, returnPath, presetAccountId }: { onClose: () => void; catalogs: CashCatalogs; returnPath: string; presetAccountId?: string; }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createDailyClosingAction, dailyClosingFormInitialState);

  useCloseOnSuccess(state.status, () => {
    router.refresh();
    onClose();
  });

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="returnPath" value={returnPath} />
      <Field label="Cuenta" error={state.fieldErrors?.accountId}>
        <select className={inputClassName(Boolean(state.fieldErrors?.accountId))} name="accountId" defaultValue={presetAccountId ?? catalogs.accounts[0]?.id ?? ''}>
          {catalogs.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
        </select>
      </Field>
      <Field label="Fecha de cierre" error={state.fieldErrors?.closingDate}>
        <div className="relative">
          <CalendarRange className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <input className={inputClassName(Boolean(state.fieldErrors?.closingDate)) + ' pl-11'} type="date" name="closingDate" defaultValue={todayIso()} />
        </div>
      </Field>
      <Field label="Notas" error={state.fieldErrors?.notes}>
        <textarea className={textareaClassName(Boolean(state.fieldErrors?.notes))} name="notes" placeholder="Incidencias o comprobaciones del cierre" />
      </Field>
      {state.message ? <div className={state.status === 'error' ? 'rounded-[18px] bg-[rgba(155,91,83,0.1)] px-4 py-3 text-sm text-[var(--danger)]' : 'rounded-[18px] bg-[rgba(85,117,82,0.1)] px-4 py-3 text-sm text-[var(--success)]'}>{state.message}</div> : null}
      <div className="mt-2 flex items-center justify-end gap-3 border-t border-[rgba(123,136,95,0.12)] pt-4">
        <Button variant="secondary" onClick={onClose} disabled={pending}>Cancelar</Button>
        <Button type="submit" disabled={pending}>{pending ? 'Guardando...' : 'Registrar cierre'}</Button>
      </div>
    </form>
  );
}
