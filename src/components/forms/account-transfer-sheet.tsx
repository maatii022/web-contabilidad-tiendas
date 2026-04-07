'use client';

import { useActionState, useState } from 'react';
import { ArrowRightLeft, CalendarRange } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Field, inputClassName, textareaClassName } from '@/components/forms/form-field';
import { Sheet } from '@/components/forms/sheet';
import { useCloseOnSuccess, useSheetSessionKey } from '@/components/forms/sheet-session';
import { Button } from '@/components/ui/button';
import { createAccountTransferAction } from '@/features/accounts/actions';
import { accountTransferFormInitialState, type CashCatalogs } from '@/features/accounts/types';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function AccountTransferSheet({ open, onClose, catalogs, returnPath, presetSourceAccountId }: { open: boolean; onClose: () => void; catalogs: CashCatalogs; returnPath: string; presetSourceAccountId?: string; }) {
  const sessionKey = useSheetSessionKey(open, presetSourceAccountId ?? 'transfer');

  return (
    <Sheet open={open} onClose={onClose} title="Mover dinero" description="Registra una transferencia interna entre cuentas en una sola acción.">
      {open ? <AccountTransferSheetForm key={`${presetSourceAccountId ?? 'default'}-${sessionKey}`} onClose={onClose} catalogs={catalogs} returnPath={returnPath} presetSourceAccountId={presetSourceAccountId} /> : null}
    </Sheet>
  );
}

function AccountTransferSheetForm({ onClose, catalogs, returnPath, presetSourceAccountId }: { onClose: () => void; catalogs: CashCatalogs; returnPath: string; presetSourceAccountId?: string; }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createAccountTransferAction, accountTransferFormInitialState);
  const defaultSource = presetSourceAccountId || catalogs.accounts[0]?.id || '';
  const [sourceAccountId, setSourceAccountId] = useState(defaultSource);

  useCloseOnSuccess(state.status, () => {
    router.refresh();
    onClose();
  });

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="returnPath" value={returnPath} />

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-end">
        <Field label="Desde" error={state.fieldErrors?.sourceAccountId}>
          <select className={inputClassName(Boolean(state.fieldErrors?.sourceAccountId))} name="sourceAccountId" value={sourceAccountId} onChange={(event) => setSourceAccountId(event.target.value)}>
            {catalogs.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
        </Field>
        <div className="flex justify-center pb-3 text-[var(--accent-strong)]"><ArrowRightLeft className="h-5 w-5" /></div>
        <Field label="Hacia" error={state.fieldErrors?.destinationAccountId}>
          <select className={inputClassName(Boolean(state.fieldErrors?.destinationAccountId))} name="destinationAccountId" defaultValue={catalogs.accounts.find((account) => account.id !== defaultSource)?.id ?? ''}>
            <option value="">Cuenta destino</option>
            {catalogs.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Importe" error={state.fieldErrors?.amount}>
          <input className={inputClassName(Boolean(state.fieldErrors?.amount))} type="number" step="0.01" min="0.01" name="amount" placeholder="0,00" />
        </Field>
        <Field label="Fecha" error={state.fieldErrors?.transferDate}>
          <div className="relative">
            <CalendarRange className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input className={inputClassName(Boolean(state.fieldErrors?.transferDate)) + ' pl-11'} type="date" name="transferDate" defaultValue={todayIso()} />
          </div>
        </Field>
      </div>

      <Field label="Notas" error={state.fieldErrors?.notes}>
        <textarea className={textareaClassName(Boolean(state.fieldErrors?.notes))} name="notes" placeholder="Opcional" />
      </Field>

      {state.message ? <div className={state.status === 'error' ? 'rounded-[18px] bg-[rgba(155,91,83,0.1)] px-4 py-3 text-sm text-[var(--danger)]' : 'rounded-[18px] bg-[rgba(85,117,82,0.1)] px-4 py-3 text-sm text-[var(--success)]'}>{state.message}</div> : null}

      <div className="mt-2 flex items-center justify-end gap-3 border-t border-[rgba(123,136,95,0.12)] pt-4">
        <Button variant="secondary" onClick={onClose} disabled={pending}>Cancelar</Button>
        <Button type="submit" disabled={pending}>{pending ? 'Guardando...' : 'Mover dinero'}</Button>
      </div>
    </form>
  );
}
