import type { Database } from '@/types/database';
import type { AccountOption } from '@/features/expenses/types';

export type EntryType = Database['public']['Enums']['entry_type'];
export type AccountType = Database['public']['Enums']['account_type'];

export type AccountFilters = {
  accountId: string;
  entryType: string;
  query: string;
  dateFrom: string;
  dateTo: string;
};

export type CashCatalogs = {
  accounts: AccountOption[];
};

export type AccountSummaryItem = {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  isPrimary: boolean;
  isActive: boolean;
  movementCount: number;
  lastEntryDate: string | null;
  latestClosing: DailyClosingItem | null;
};

export type AccountEntryListItem = {
  id: string;
  accountId: string;
  accountName: string;
  entryDate: string;
  type: EntryType;
  concept: string;
  amount: number;
  signedAmount: number;
  sourceType: string | null;
  sourceId: string | null;
  notes: string | null;
  createdAt: string;
};

export type DailyClosingItem = {
  id: string;
  accountId: string;
  accountName: string;
  closingDate: string;
  openingBalance: number;
  inflowTotal: number;
  outflowTotal: number;
  closingBalance: number;
  notes: string | null;
  createdAt: string;
};

export type CashWorkspaceData = {
  catalogs: CashCatalogs;
  accounts: AccountSummaryItem[];
  entries: AccountEntryListItem[];
  closings: DailyClosingItem[];
  totals: {
    balance: number;
    inflow: number;
    outflow: number;
    entryCount: number;
    closingCount: number;
  };
};

export type AccountFormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  entityId?: string;
  fieldErrors?: Record<string, string>;
};

export type AccountEntryFormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Record<string, string>;
};

export type DailyClosingFormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Record<string, string>;
};

export type CashClosingFormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Record<string, string>;
};

export type AccountTransferFormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const accountFormInitialState: AccountFormState = {
  status: 'idle'
};

export const accountEntryFormInitialState: AccountEntryFormState = {
  status: 'idle'
};

export const dailyClosingFormInitialState: DailyClosingFormState = {
  status: 'idle'
};

export const cashClosingFormInitialState: CashClosingFormState = {
  status: 'idle'
};

export const accountTransferFormInitialState: AccountTransferFormState = {
  status: 'idle'
};
