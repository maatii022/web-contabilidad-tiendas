import type { Database } from '@/types/database';

export type ExpenseCatalogOption = {
  id: string;
  name: string;
  color?: string | null;
};

export type AccountOption = {
  id: string;
  name: string;
  type: Database['public']['Enums']['account_type'];
};

export type VendorOption = {
  id: string;
  name: string;
};

export type ExpenseCatalogs = {
  categories: ExpenseCatalogOption[];
  accounts: AccountOption[];
  vendors: VendorOption[];
};

export type ExpenseAttachmentItem = {
  id: string;
  fileName: string;
  url: string | null;
};

export type ExpenseListItem = {
  id: string;
  expenseDate: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string | null;
  vendorId: string | null;
  vendorName: string | null;
  accountId: string | null;
  accountName: string | null;
  paymentMethod: Database['public']['Enums']['payment_method'];
  baseAmount: number;
  taxAmount: number;
  totalAmount: number;
  reference: string | null;
  notes: string | null;
  createdAt: string;
  attachmentCount: number;
  attachments: ExpenseAttachmentItem[];
};

export type ExpenseFilters = {
  query: string;
  categoryId: string;
  accountId: string;
  dateFrom: string;
  dateTo: string;
};

export type ExpenseFormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  entityId?: string;
  fieldErrors?: Record<string, string>;
};

export const expenseFormInitialState: ExpenseFormState = {
  status: 'idle'
};
