import type { Database } from '@/types/database';
import type { AccountOption, VendorOption } from '@/features/expenses/types';

export type InvoiceStatus = Database['public']['Enums']['invoice_status'];

export type InvoiceAttachmentItem = {
  id: string;
  fileName: string;
  url: string | null;
};

export type InvoicePaymentItem = {
  id: string;
  accountId: string;
  accountName: string | null;
  paymentDate: string;
  amount: number;
  paymentMethod: Database['public']['Enums']['payment_method'];
  reference: string | null;
  notes: string | null;
  createdAt: string;
};

export type InvoiceListItem = {
  id: string;
  vendorId: string;
  vendorName: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  pendingAmount: number;
  status: InvoiceStatus;
  notes: string | null;
  createdAt: string;
  attachmentCount: number;
  attachments: InvoiceAttachmentItem[];
  payments: InvoicePaymentItem[];
};

export type InvoiceFilters = {
  query: string;
  status: string;
  vendorId: string;
  dueFrom: string;
  dueTo: string;
};

export type InvoiceCatalogs = {
  vendors: VendorOption[];
  accounts: AccountOption[];
};

export type InvoiceFormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  entityId?: string;
  fieldErrors?: Record<string, string>;
};

export type InvoicePaymentFormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const invoiceFormInitialState: InvoiceFormState = {
  status: 'idle'
};

export const invoicePaymentFormInitialState: InvoicePaymentFormState = {
  status: 'idle'
};

export const invoiceStatusOptions: Array<{ value: InvoiceStatus; label: string }> = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'partially_paid', label: 'Parcial' },
  { value: 'paid', label: 'Pagada' },
  { value: 'cancelled', label: 'Anulada' }
];
