import type { Database } from '@/types/database';
import type { AccountOption, VendorOption } from '@/features/expenses/types';

export type InvoiceStatus = Database['public']['Enums']['invoice_status'];
export type InvoiceInstallmentStatus = 'pending' | 'partially_paid' | 'paid' | 'overdue';
export type InvoicePlan = 'single' | '30' | '30/60' | '30/60/90' | '30/60/90/120' | 'custom';

export type InvoiceAttachmentItem = {
  id: string;
  fileName: string;
  url: string | null;
};

export type InvoiceInstallmentItem = {
  id: string;
  sequenceNumber: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  status: InvoiceInstallmentStatus;
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
  installments: InvoiceInstallmentItem[];
  nextDueDate: string;
  payments: InvoicePaymentItem[];
};

export type InvoiceFilters = {
  query: string;
  status: string;
  vendorId: string;
  dueFrom: string;
  dueTo: string;
  period: 'current-month' | 'all';
  highlightedInvoiceId: string;
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

export const invoicePlanOptions: Array<{ value: InvoicePlan; label: string; parts: number }> = [
  { value: 'single', label: 'Pago único', parts: 1 },
  { value: '30', label: '30 días', parts: 1 },
  { value: '30/60', label: '30 / 60', parts: 2 },
  { value: '30/60/90', label: '30 / 60 / 90', parts: 3 },
  { value: '30/60/90/120', label: '30 / 60 / 90 / 120', parts: 4 },
  { value: 'custom', label: 'Personalizado', parts: 0 }
];
