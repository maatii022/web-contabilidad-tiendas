import 'server-only';

import type { CashWorkspaceData, AccountFilters, AccountSummaryItem, AccountEntryListItem, DailyClosingItem } from '@/features/accounts/types';
import { createClient } from '@/lib/supabase/server';
import { parseMoney } from '@/features/expenses/helpers';
import { entrySignedAmount } from '@/features/accounts/helpers';
import type { Database } from '@/types/database';

type AccountRow = Pick<
  Database['public']['Tables']['accounts']['Row'],
  'id' | 'name' | 'type' | 'initial_balance' | 'is_primary' | 'is_active'
>;

type EntryRow = Pick<
  Database['public']['Tables']['account_entries']['Row'],
  'id' | 'account_id' | 'entry_date' | 'type' | 'concept' | 'amount' | 'source_type' | 'source_id' | 'notes' | 'created_at'
>;

type ClosingRow = Pick<
  Database['public']['Tables']['daily_closings']['Row'],
  'id' | 'account_id' | 'closing_date' | 'opening_balance' | 'inflow_total' | 'outflow_total' | 'closing_balance' | 'notes' | 'created_at'
>;

function includesQuery(value: string | null | undefined, query: string) {
  if (!value) {
    return false;
  }

  return value.toLocaleLowerCase('es-ES').includes(query);
}

export async function getCashWorkspaceData({
  businessId,
  filters
}: {
  businessId: string;
  filters: AccountFilters;
}): Promise<CashWorkspaceData> {
  const supabase = await createClient();

  let entriesQuery = supabase
    .from('account_entries')
    .select('id, account_id, entry_date, type, concept, amount, source_type, source_id, notes, created_at')
    .eq('business_id', businessId)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(150);

  if (filters.accountId) {
    entriesQuery = entriesQuery.eq('account_id', filters.accountId);
  }

  if (filters.entryType) {
    entriesQuery = entriesQuery.eq('type', filters.entryType as Database['public']['Enums']['entry_type']);
  }

  if (filters.dateFrom) {
    entriesQuery = entriesQuery.gte('entry_date', filters.dateFrom);
  }

  if (filters.dateTo) {
    entriesQuery = entriesQuery.lte('entry_date', filters.dateTo);
  }

  const [accountsResult, entriesResult, closingsResult] = await Promise.all([
    supabase
      .from('accounts')
      .select('id, name, type, initial_balance, is_primary, is_active')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('name', { ascending: true }),
    entriesQuery,
    supabase
      .from('daily_closings')
      .select('id, account_id, closing_date, opening_balance, inflow_total, outflow_total, closing_balance, notes, created_at')
      .eq('business_id', businessId)
      .order('closing_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(16)
  ]);

  const accounts = (accountsResult.data ?? []) as AccountRow[];
  const allEntriesResult = await supabase
    .from('account_entries')
    .select('account_id, entry_date, type, amount')
    .eq('business_id', businessId);

  const allEntryRows = (allEntriesResult.data ?? []) as Array<Pick<EntryRow, 'account_id' | 'entry_date' | 'type' | 'amount'>>;
  const entryRows = (entriesResult.data ?? []) as EntryRow[];
  const closingRows = (closingsResult.data ?? []) as ClosingRow[];

  const accountNameMap = new Map(accounts.map((account) => [account.id, account.name]));
  const latestClosingByAccount = new Map<string, DailyClosingItem>();

  closingRows.forEach((closing) => {
    if (!latestClosingByAccount.has(closing.account_id)) {
      latestClosingByAccount.set(closing.account_id, {
        id: closing.id,
        accountId: closing.account_id,
        accountName: accountNameMap.get(closing.account_id) ?? 'Cuenta',
        closingDate: closing.closing_date,
        openingBalance: parseMoney(closing.opening_balance),
        inflowTotal: parseMoney(closing.inflow_total),
        outflowTotal: parseMoney(closing.outflow_total),
        closingBalance: parseMoney(closing.closing_balance),
        notes: closing.notes,
        createdAt: closing.created_at
      });
    }
  });

  const accountBalanceMap = new Map<string, number>();
  const accountMovementCountMap = new Map<string, number>();
  const accountLastEntryMap = new Map<string, string>();

  accounts.forEach((account) => {
    accountBalanceMap.set(account.id, parseMoney(account.initial_balance));
    accountMovementCountMap.set(account.id, 0);
  });

  allEntryRows.forEach((entry) => {
    accountBalanceMap.set(entry.account_id, (accountBalanceMap.get(entry.account_id) ?? 0) + entrySignedAmount({ type: entry.type, amount: entry.amount }));
    accountMovementCountMap.set(entry.account_id, (accountMovementCountMap.get(entry.account_id) ?? 0) + 1);
    const currentLast = accountLastEntryMap.get(entry.account_id);
    if (!currentLast || entry.entry_date > currentLast) {
      accountLastEntryMap.set(entry.account_id, entry.entry_date);
    }
  });

  let entries: AccountEntryListItem[] = entryRows.map((entry) => ({
    id: entry.id,
    accountId: entry.account_id,
    accountName: accountNameMap.get(entry.account_id) ?? 'Cuenta',
    entryDate: entry.entry_date,
    type: entry.type,
    concept: entry.concept,
    amount: parseMoney(entry.amount),
    signedAmount: entrySignedAmount({ type: entry.type, amount: entry.amount }),
    sourceType: entry.source_type,
    sourceId: entry.source_id,
    notes: entry.notes,
    createdAt: entry.created_at
  }));

  const textQuery = filters.query.trim().toLocaleLowerCase('es-ES');

  if (textQuery) {
    entries = entries.filter((entry) => {
      return (
        includesQuery(entry.accountName, textQuery) ||
        includesQuery(entry.concept, textQuery) ||
        includesQuery(entry.notes, textQuery) ||
        includesQuery(entry.sourceType, textQuery)
      );
    });
  }

  const closings: DailyClosingItem[] = closingRows.map((closing) => ({
    id: closing.id,
    accountId: closing.account_id,
    accountName: accountNameMap.get(closing.account_id) ?? 'Cuenta',
    closingDate: closing.closing_date,
    openingBalance: parseMoney(closing.opening_balance),
    inflowTotal: parseMoney(closing.inflow_total),
    outflowTotal: parseMoney(closing.outflow_total),
    closingBalance: parseMoney(closing.closing_balance),
    notes: closing.notes,
    createdAt: closing.created_at
  }));

  const accountItems: AccountSummaryItem[] = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    initialBalance: parseMoney(account.initial_balance),
    currentBalance: Number((accountBalanceMap.get(account.id) ?? 0).toFixed(2)),
    isPrimary: account.is_primary,
    isActive: account.is_active,
    movementCount: accountMovementCountMap.get(account.id) ?? 0,
    lastEntryDate: accountLastEntryMap.get(account.id) ?? null,
    latestClosing: latestClosingByAccount.get(account.id) ?? null
  }));

  const totals = entries.reduce(
    (acc, entry) => {
      if (entry.type === 'income') {
        acc.inflow += entry.amount;
      } else if (entry.type === 'expense') {
        acc.outflow += entry.amount;
      } else if (entry.signedAmount >= 0) {
        acc.inflow += entry.signedAmount;
      } else {
        acc.outflow += Math.abs(entry.signedAmount);
      }
      return acc;
    },
    {
      balance: Number(accountItems.reduce((sum, account) => sum + account.currentBalance, 0).toFixed(2)),
      inflow: 0,
      outflow: 0,
      entryCount: entries.length,
      closingCount: closings.length
    }
  );

  return {
    catalogs: {
      accounts: accountItems.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type
      }))
    },
    accounts: accountItems,
    entries,
    closings,
    totals: {
      ...totals,
      inflow: Number(totals.inflow.toFixed(2)),
      outflow: Number(totals.outflow.toFixed(2))
    }
  };
}
