import type { Database } from '@/types/database';
import { parseMoney } from '@/features/expenses/helpers';

function normalize(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function currentMonthRange() {
  const now = new Date();
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

  return {
    from: first.toISOString().slice(0, 10),
    to: last.toISOString().slice(0, 10)
  };
}

export function getAccountFilters(searchParams?: Record<string, string | string[] | undefined>) {
  const defaults = currentMonthRange();
  const rawFrom = normalize(searchParams?.from);
  const rawTo = normalize(searchParams?.to);

  return {
    accountId: normalize(searchParams?.account),
    entryType: normalize(searchParams?.type),
    query: normalize(searchParams?.q).trim(),
    dateFrom: rawFrom || defaults.from,
    dateTo: rawTo || defaults.to
  };
}

export function entrySignedAmount({
  type,
  amount
}: {
  type: Database['public']['Enums']['entry_type'];
  amount: string | number | null | undefined;
}) {
  const value = parseMoney(amount);

  if (type === 'expense') {
    return -value;
  }

  return value;
}

export const accountTypeOptions: Array<{
  value: Database['public']['Enums']['account_type'];
  label: string;
}> = [
  { value: 'cash', label: 'Caja' },
  { value: 'bank', label: 'Banco' },
  { value: 'other', label: 'Otra' }
];

export function accountTypeLabel(type: Database['public']['Enums']['account_type']) {
  return accountTypeOptions.find((option) => option.value === type)?.label ?? 'Cuenta';
}

export const entryTypeOptions: Array<{
  value: Database['public']['Enums']['entry_type'];
  label: string;
}> = [
  { value: 'income', label: 'Entrada' },
  { value: 'expense', label: 'Salida' },
  { value: 'adjustment', label: 'Ajuste' }
];

export function entryTypeLabel(type: Database['public']['Enums']['entry_type']) {
  return entryTypeOptions.find((option) => option.value === type)?.label ?? 'Movimiento';
}

export function entrySourceLabel(sourceType: string | null) {
  if (sourceType === 'expense') return 'Desde gasto';
  if (sourceType === 'purchase_invoice_payment') return 'Pago de factura';
  if (sourceType === 'manual') return 'Manual';
  if (sourceType === 'cash_closing') return 'Cierre de caja';
  if (sourceType === 'internal_transfer') return 'Transferencia interna';
  return 'Manual';
}

export function closingMetrics({
  openingBalance,
  entries
}: {
  openingBalance: number;
  entries: Array<{ type: Database['public']['Enums']['entry_type']; amount: string | number | null | undefined }>;
}) {
  let inflowTotal = 0;
  let outflowTotal = 0;
  let adjustmentDelta = 0;

  entries.forEach((entry) => {
    const amount = parseMoney(entry.amount);

    if (entry.type === 'income') {
      inflowTotal += amount;
      return;
    }

    if (entry.type === 'expense') {
      outflowTotal += amount;
      return;
    }

    adjustmentDelta += amount;
  });

  const closingBalance = Number((openingBalance + inflowTotal - outflowTotal + adjustmentDelta).toFixed(2));

  return {
    inflowTotal: Number(inflowTotal.toFixed(2)),
    outflowTotal: Number(outflowTotal.toFixed(2)),
    closingBalance
  };
}
