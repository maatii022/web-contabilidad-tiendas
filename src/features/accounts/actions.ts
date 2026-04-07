'use server';

import { z } from 'zod';

import { getTextEntry, toDecimalString } from '@/features/expenses/helpers';
import { closingMetrics, pickStoreCashAccount } from '@/features/accounts/helpers';
import type { AccountEntryFormState, AccountFormState, DailyClosingFormState, CashClosingFormState, AccountTransferFormState } from '@/features/accounts/types';
import { getReturnPath, refreshCorePaths, requireManageContext } from '@/features/operations/shared';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

const accountTypes = ['cash', 'bank', 'other'] as const;
const entryTypes = ['income', 'expense', 'adjustment'] as const;

const accountSchema = z.object({
  accountId: z.string().uuid('Cuenta inválida.').optional().or(z.literal('')),
  name: z.string().min(2, 'Indica un nombre.').max(80, 'Nombre demasiado largo.'),
  type: z.enum(accountTypes, { message: 'Tipo de cuenta inválido.' }),
  initialBalance: z.coerce.number().min(-9999999, 'Saldo inicial inválido.').max(9999999, 'Saldo inicial demasiado alto.'),
  isPrimary: z.union([z.literal('on'), z.literal('')]).optional()
});

const entrySchema = z.object({
  accountId: z.string().uuid('Selecciona una cuenta.'),
  entryDate: z.string().min(1, 'Indica la fecha.'),
  type: z.enum(entryTypes, { message: 'Tipo de movimiento inválido.' }),
  concept: z.string().min(2, 'Describe el movimiento.').max(120, 'Concepto demasiado largo.'),
  amount: z.coerce.number().refine((value) => value !== 0, 'El importe no puede ser cero.'),
  notes: z.string().max(800, 'Las notas son demasiado largas.').optional().or(z.literal(''))
});

const closingSchema = z.object({
  accountId: z.string().uuid('Selecciona una cuenta.'),
  closingDate: z.string().min(1, 'Indica la fecha de cierre.'),
  notes: z.string().max(800, 'Las notas son demasiado largas.').optional().or(z.literal(''))
});

function buildFieldErrors(error: z.ZodError) {
  return error.issues.reduce<Record<string, string>>((acc, issue) => {
    const field = typeof issue.path[0] === 'string' ? issue.path[0] : 'form';
    if (!acc[field]) {
      acc[field] = issue.message;
    }
    return acc;
  }, {});
}

function refreshCashPaths(returnPath: string) {
  refreshCorePaths(returnPath || '/caja');
}

function buildRawFieldErrors(entries: Array<[string, string]>) {
  return entries.reduce<Record<string, string>>((acc, [field, message]) => {
    if (!acc[field]) acc[field] = message;
    return acc;
  }, {});
}

async function fetchBusinessAccounts(businessId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('accounts')
    .select('id, name, type, is_primary, initial_balance')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('is_primary', { ascending: false })
    .order('name', { ascending: true });

  return data ?? [];
}

export async function upsertAccountAction(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  try {
    const appContext = await requireManageContext();
    const supabase = await createClient();
    const returnPath = getReturnPath(formData);

    const parsed = accountSchema.safeParse({
      accountId: getTextEntry(formData, 'accountId'),
      name: getTextEntry(formData, 'name'),
      type: getTextEntry(formData, 'type'),
      initialBalance: getTextEntry(formData, 'initialBalance'),
      isPrimary: getTextEntry(formData, 'isPrimary')
    });

    if (!parsed.success) {
      return {
        status: 'error',
        message: 'Revisa los campos marcados.',
        fieldErrors: buildFieldErrors(parsed.error)
      };
    }

    const values = parsed.data;
    const payload = {
      business_id: appContext.business.id,
      name: values.name,
      type: values.type,
      initial_balance: toDecimalString(values.initialBalance),
      is_primary: values.isPrimary === 'on',
      is_active: true
    };

    if (values.isPrimary === 'on') {
      await supabase.from('accounts').update({ is_primary: false }).eq('business_id', appContext.business.id);
    }

    let persistedAccountId = values.accountId || '';

    if (values.accountId) {
      const { error } = await supabase
        .from('accounts')
        .update(payload)
        .eq('id', values.accountId)
        .eq('business_id', appContext.business.id);

      if (error) {
        return {
          status: 'error',
          message: 'No se pudo actualizar la cuenta.'
        };
      }

      persistedAccountId = values.accountId;
    } else {
      const { data, error } = await supabase.from('accounts').insert(payload).select('id').single();

      if (error || !data) {
        return {
          status: 'error',
          message: 'No se pudo crear la cuenta.'
        };
      }

      persistedAccountId = data.id;
    }

    refreshCashPaths(returnPath);

    return {
      status: 'success',
      entityId: persistedAccountId,
      message: values.accountId ? 'Cuenta actualizada.' : 'Cuenta creada.'
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'No se pudo guardar la cuenta.'
    };
  }
}

export async function createAccountEntryAction(
  _prevState: AccountEntryFormState,
  formData: FormData
): Promise<AccountEntryFormState> {
  try {
    const appContext = await requireManageContext();
    const supabase = await createClient();
    const returnPath = getReturnPath(formData);

    const parsed = entrySchema.safeParse({
      accountId: getTextEntry(formData, 'accountId'),
      entryDate: getTextEntry(formData, 'entryDate'),
      type: getTextEntry(formData, 'type'),
      concept: getTextEntry(formData, 'concept'),
      amount: getTextEntry(formData, 'amount'),
      notes: getTextEntry(formData, 'notes')
    });

    if (!parsed.success) {
      return {
        status: 'error',
        message: 'Revisa los campos marcados.',
        fieldErrors: buildFieldErrors(parsed.error)
      };
    }

    const values = parsed.data;
    const normalizedAmount = values.type === 'adjustment' ? values.amount : Math.abs(values.amount);

    const { error } = await supabase.from('account_entries').insert({
      business_id: appContext.business.id,
      account_id: values.accountId,
      entry_date: values.entryDate,
      type: values.type,
      concept: values.concept,
      amount: toDecimalString(normalizedAmount),
      source_type: 'manual',
      notes: getTextEntry(formData, 'notes') || null,
      created_by: appContext.user.id
    });

    if (error) {
      return {
        status: 'error',
        message: 'No se pudo registrar el movimiento.'
      };
    }

    refreshCashPaths(returnPath);

    return {
      status: 'success',
      message: 'Movimiento registrado.'
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'No se pudo registrar el movimiento.'
    };
  }
}

export async function createDailyClosingAction(
  _prevState: DailyClosingFormState,
  formData: FormData
): Promise<DailyClosingFormState> {
  try {
    const appContext = await requireManageContext();
    const supabase = await createClient();
    const returnPath = getReturnPath(formData);

    const parsed = closingSchema.safeParse({
      accountId: getTextEntry(formData, 'accountId'),
      closingDate: getTextEntry(formData, 'closingDate'),
      notes: getTextEntry(formData, 'notes')
    });

    if (!parsed.success) {
      return {
        status: 'error',
        message: 'Revisa los campos marcados.',
        fieldErrors: buildFieldErrors(parsed.error)
      };
    }

    const values = parsed.data;
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, initial_balance')
      .eq('business_id', appContext.business.id)
      .eq('id', values.accountId)
      .single();

    if (accountError || !account) {
      return {
        status: 'error',
        message: 'No se encontró la cuenta.'
      };
    }

    const [beforeEntriesResult, sameDayEntriesResult, existingClosingResult] = await Promise.all([
      supabase
        .from('account_entries')
        .select('type, amount')
        .eq('business_id', appContext.business.id)
        .eq('account_id', values.accountId)
        .lt('entry_date', values.closingDate),
      supabase
        .from('account_entries')
        .select('type, amount')
        .eq('business_id', appContext.business.id)
        .eq('account_id', values.accountId)
        .eq('entry_date', values.closingDate),
      supabase
        .from('daily_closings')
        .select('id')
        .eq('business_id', appContext.business.id)
        .eq('account_id', values.accountId)
        .eq('closing_date', values.closingDate)
        .maybeSingle()
    ]);

    const priorEntries = (beforeEntriesResult.data ?? []) as Array<Pick<Database['public']['Tables']['account_entries']['Row'], 'type' | 'amount'>>;
    const sameDayEntries = (sameDayEntriesResult.data ?? []) as Array<Pick<Database['public']['Tables']['account_entries']['Row'], 'type' | 'amount'>>;

    const openingBalance = priorEntries.reduce((sum, entry) => {
      if (entry.type === 'expense') {
        return sum - Number.parseFloat(String(entry.amount ?? 0));
      }

      return sum + Number.parseFloat(String(entry.amount ?? 0));
    }, Number.parseFloat(String(account.initial_balance ?? 0)));

    const metrics = closingMetrics({ openingBalance, entries: sameDayEntries });

    const payload = {
      business_id: appContext.business.id,
      account_id: values.accountId,
      closing_date: values.closingDate,
      opening_balance: toDecimalString(openingBalance),
      inflow_total: toDecimalString(metrics.inflowTotal),
      outflow_total: toDecimalString(metrics.outflowTotal),
      closing_balance: toDecimalString(metrics.closingBalance),
      notes: getTextEntry(formData, 'notes') || null,
      created_by: appContext.user.id
    };

    if (existingClosingResult.data?.id) {
      const { error } = await supabase
        .from('daily_closings')
        .update(payload)
        .eq('id', existingClosingResult.data.id)
        .eq('business_id', appContext.business.id);

      if (error) {
        return {
          status: 'error',
          message: 'No se pudo actualizar el cierre.'
        };
      }
    } else {
      const { error } = await supabase.from('daily_closings').insert(payload);

      if (error) {
        return {
          status: 'error',
          message: 'No se pudo registrar el cierre.'
        };
      }
    }

    refreshCashPaths(returnPath);

    return {
      status: 'success',
      message: existingClosingResult.data?.id ? 'Cierre actualizado.' : 'Cierre registrado.'
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'No se pudo registrar el cierre.'
    };
  }
}


export async function createCashClosingAction(
  _prevState: CashClosingFormState,
  formData: FormData
): Promise<CashClosingFormState> {
  try {
    const appContext = await requireManageContext();
    const supabase = await createClient();
    const returnPath = getReturnPath(formData);

    const closingDate = getTextEntry(formData, 'closingDate');
    const total = Number.parseFloat(getTextEntry(formData, 'total').replace(',', '.'));
    const notes = getTextEntry(formData, 'notes');
    const allocationAccountIds = formData.getAll('allocationAccountId').map((value) => (typeof value === 'string' ? value.trim() : ''));
    const allocationAmounts = formData.getAll('allocationAmount').map((value) => (typeof value === 'string' ? value.trim() : ''));

    const errors: Array<[string, string]> = [];
    if (!closingDate) errors.push(['closingDate', 'Indica la fecha del cierre.']);
    if (!Number.isFinite(total) || total <= 0) errors.push(['total', 'Indica un total válido.']);

    const allocations = allocationAccountIds.map((accountId, index) => ({
      accountId,
      amount: Number.parseFloat((allocationAmounts[index] ?? '').replace(',', '.'))
    })).filter((item) => item.accountId || Number.isFinite(item.amount));

    if (allocations.length === 0) {
      errors.push(['allocations', 'Reparte el cierre entre al menos una cuenta.']);
    }

    allocations.forEach((item, index) => {
      if (!item.accountId) errors.push(['allocations', `Falta la cuenta destino en la línea ${index + 1}.`]);
      if (!Number.isFinite(item.amount) || item.amount <= 0) errors.push(['allocations', `Indica un importe válido en la línea ${index + 1}.`]);
    });

    const allocationTotal = allocations.reduce((sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0), 0);
    if (Math.abs(allocationTotal - (Number.isFinite(total) ? total : 0)) > 0.01) {
      errors.push(['allocations', 'El reparto debe cuadrar exactamente con el total del cierre.']);
    }

    if (errors.length) {
      return { status: 'error', message: 'Revisa el cierre antes de guardarlo.', fieldErrors: buildRawFieldErrors(errors) };
    }

    const accounts = await fetchBusinessAccounts(appContext.business.id);
    const sourceAccount = pickStoreCashAccount(accounts);
    if (!sourceAccount) {
      return { status: 'error', message: 'Necesitas al menos una cuenta activa para registrar el cierre.' };
    }

    const { data: existingClosing } = await supabase
      .from('daily_closings')
      .select('id')
      .eq('business_id', appContext.business.id)
      .eq('account_id', sourceAccount.id)
      .eq('closing_date', closingDate)
      .maybeSingle();

    if (existingClosing?.id) {
      return { status: 'error', message: 'Ya existe un cierre guardado para esa cuenta y fecha.' };
    }

    const [priorEntriesResult, sameDayEntriesResult] = await Promise.all([
      supabase.from('account_entries').select('type, amount').eq('business_id', appContext.business.id).eq('account_id', sourceAccount.id).lt('entry_date', closingDate),
      supabase.from('account_entries').select('type, amount').eq('business_id', appContext.business.id).eq('account_id', sourceAccount.id).eq('entry_date', closingDate)
    ]);

    const priorEntries = priorEntriesResult.data ?? [];
    const sameDayEntries = sameDayEntriesResult.data ?? [];
    const openingBalance = priorEntries.reduce((sum, entry) => {
      if (entry.type === 'expense') return sum - Number.parseFloat(String(entry.amount ?? 0));
      return sum + Number.parseFloat(String(entry.amount ?? 0));
    }, Number.parseFloat(String(sourceAccount.initial_balance ?? 0)));

    const syntheticEntries = [...sameDayEntries, { type: 'income' as const, amount: total }];
    const metrics = closingMetrics({ openingBalance, entries: syntheticEntries });

    const { data: closingRow, error: closingError } = await supabase
      .from('daily_closings')
      .insert({
        business_id: appContext.business.id,
        account_id: sourceAccount.id,
        closing_date: closingDate,
        opening_balance: toDecimalString(openingBalance),
        inflow_total: toDecimalString(metrics.inflowTotal),
        outflow_total: toDecimalString(metrics.outflowTotal),
        closing_balance: toDecimalString(metrics.closingBalance),
        notes: notes || null,
        created_by: appContext.user.id
      })
      .select('id')
      .single();

    if (closingError || !closingRow) {
      return { status: 'error', message: 'No se pudo guardar el cierre.' };
    }

    const entryPayload = allocations.map((item) => ({
      business_id: appContext.business.id,
      account_id: item.accountId,
      entry_date: closingDate,
      type: 'income' as const,
      concept: 'Cierre de caja · Tienda',
      amount: toDecimalString(item.amount),
      source_type: 'cash_closing',
      source_id: closingRow.id,
      notes: notes || null,
      created_by: appContext.user.id
    }));

    const { error: entriesError } = await supabase.from('account_entries').insert(entryPayload);
    if (entriesError) {
      await supabase.from('daily_closings').delete().eq('id', closingRow.id).eq('business_id', appContext.business.id);
      return { status: 'error', message: 'No se pudo repartir el cierre entre las cuentas.' };
    }

    refreshCashPaths(returnPath);
    return { status: 'success', message: 'Cierre repartido y guardado.' };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'No se pudo guardar el cierre.' };
  }
}

export async function createAccountTransferAction(
  _prevState: AccountTransferFormState,
  formData: FormData
): Promise<AccountTransferFormState> {
  try {
    const appContext = await requireManageContext();
    const supabase = await createClient();
    const returnPath = getReturnPath(formData);

    const sourceAccountId = getTextEntry(formData, 'sourceAccountId');
    const destinationAccountId = getTextEntry(formData, 'destinationAccountId');
    const transferDate = getTextEntry(formData, 'transferDate');
    const amount = Number.parseFloat(getTextEntry(formData, 'amount').replace(',', '.'));
    const notes = getTextEntry(formData, 'notes');

    const errors: Array<[string, string]> = [];
    if (!sourceAccountId) errors.push(['sourceAccountId', 'Selecciona la cuenta de origen.']);
    if (!destinationAccountId) errors.push(['destinationAccountId', 'Selecciona la cuenta de destino.']);
    if (sourceAccountId && destinationAccountId && sourceAccountId === destinationAccountId) errors.push(['destinationAccountId', 'El destino debe ser distinto al origen.']);
    if (!transferDate) errors.push(['transferDate', 'Indica la fecha.']);
    if (!Number.isFinite(amount) || amount <= 0) errors.push(['amount', 'Indica un importe válido.']);

    if (errors.length) {
      return { status: 'error', message: 'Revisa la transferencia antes de guardarla.', fieldErrors: buildRawFieldErrors(errors) };
    }

    const transferId = crypto.randomUUID();
    const concept = 'Transferencia interna';
    const payload = [
      {
        business_id: appContext.business.id,
        account_id: sourceAccountId,
        entry_date: transferDate,
        type: 'expense' as const,
        concept,
        amount: toDecimalString(amount),
        source_type: 'internal_transfer',
        source_id: transferId,
        notes: notes || null,
        created_by: appContext.user.id
      },
      {
        business_id: appContext.business.id,
        account_id: destinationAccountId,
        entry_date: transferDate,
        type: 'income' as const,
        concept,
        amount: toDecimalString(amount),
        source_type: 'internal_transfer',
        source_id: transferId,
        notes: notes || null,
        created_by: appContext.user.id
      }
    ];

    const { error } = await supabase.from('account_entries').insert(payload);
    if (error) {
      return { status: 'error', message: 'No se pudo registrar la transferencia.' };
    }

    refreshCashPaths(returnPath);
    return { status: 'success', message: 'Transferencia guardada.' };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'No se pudo registrar la transferencia.' };
  }
}

export async function deactivateAccountAction(formData: FormData) {
  const appContext = await requireManageContext();
  const supabase = await createClient();
  const accountId = getTextEntry(formData, 'accountId');
  const returnPath = getReturnPath(formData);

  if (!accountId) {
    throw new Error('Falta la cuenta.');
  }

  const { data: account } = await supabase
    .from('accounts')
    .select('id, is_primary')
    .eq('business_id', appContext.business.id)
    .eq('id', accountId)
    .maybeSingle();

  if (!account) {
    throw new Error('No se encontró la cuenta.');
  }

  const { error } = await supabase
    .from('accounts')
    .update({ is_active: false, is_primary: false })
    .eq('business_id', appContext.business.id)
    .eq('id', accountId);

  if (error) {
    throw new Error('No se pudo desactivar la cuenta.');
  }

  if (account.is_primary) {
    const { data: replacement } = await supabase
      .from('accounts')
      .select('id')
      .eq('business_id', appContext.business.id)
      .eq('is_active', true)
      .neq('id', accountId)
      .order('name', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (replacement?.id) {
      await supabase
        .from('accounts')
        .update({ is_primary: true })
        .eq('business_id', appContext.business.id)
        .eq('id', replacement.id);
    }
  }

  refreshCashPaths(returnPath);
}

export async function deleteAccountAction(formData: FormData) {
  const appContext = await requireManageContext();
  const supabase = await createClient();
  const accountId = getTextEntry(formData, 'accountId');
  const returnPath = getReturnPath(formData);

  if (!accountId) {
    throw new Error('Falta la cuenta.');
  }

  const [entriesCount, expensesCount, paymentsCount, closingsCount] = await Promise.all([
    supabase.from('account_entries').select('id', { count: 'exact', head: true }).eq('business_id', appContext.business.id).eq('account_id', accountId),
    supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('business_id', appContext.business.id).eq('account_id', accountId),
    supabase.from('purchase_invoice_payments').select('id', { count: 'exact', head: true }).eq('business_id', appContext.business.id).eq('account_id', accountId),
    supabase.from('daily_closings').select('id', { count: 'exact', head: true }).eq('business_id', appContext.business.id).eq('account_id', accountId)
  ]);

  const relatedCount =
    (entriesCount.count ?? 0) +
    (expensesCount.count ?? 0) +
    (paymentsCount.count ?? 0) +
    (closingsCount.count ?? 0);

  if (relatedCount > 0) {
    throw new Error('La cuenta ya tiene historial. Desactívala en lugar de borrarla.');
  }

  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('business_id', appContext.business.id)
    .eq('id', accountId);

  if (error) {
    throw new Error('No se pudo eliminar la cuenta.');
  }

  refreshCashPaths(returnPath);
}

export async function deleteAccountEntryAction(formData: FormData) {
  const appContext = await requireManageContext();
  const supabase = await createClient();
  const entryId = getTextEntry(formData, 'entryId');
  const returnPath = getReturnPath(formData);

  if (!entryId) {
    throw new Error('Falta el movimiento a eliminar.');
  }

  const { data: entry } = await supabase
    .from('account_entries')
    .select('source_type')
    .eq('business_id', appContext.business.id)
    .eq('id', entryId)
    .maybeSingle();

  if (!entry || (entry.source_type && entry.source_type !== 'manual')) {
    throw new Error('Solo puedes borrar movimientos manuales desde caja y banco.');
  }

  const { error } = await supabase
    .from('account_entries')
    .delete()
    .eq('business_id', appContext.business.id)
    .eq('id', entryId);

  if (error) {
    throw new Error('No se pudo eliminar el movimiento.');
  }

  refreshCashPaths(returnPath);
}
