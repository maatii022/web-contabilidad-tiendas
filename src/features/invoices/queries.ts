import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { parseMoney } from '@/features/expenses/helpers';
import type { Database } from '@/types/database';
import type { InvoiceCatalogs, InvoiceFilters, InvoiceInstallmentItem, InvoiceListItem, InvoiceStatus } from '@/features/invoices/types';

type VendorRow = Pick<Database['public']['Tables']['vendors']['Row'], 'id' | 'name'>;
type AccountRow = Pick<Database['public']['Tables']['accounts']['Row'], 'id' | 'name' | 'type'>;
type InvoiceRow = Pick<
  Database['public']['Tables']['purchase_invoices']['Row'],
  'id' | 'vendor_id' | 'invoice_number' | 'issue_date' | 'due_date' | 'subtotal' | 'tax_amount' | 'total' | 'status' | 'notes' | 'attachment_count' | 'created_at'
>;
type PaymentRow = Pick<
  Database['public']['Tables']['purchase_invoice_payments']['Row'],
  'id' | 'invoice_id' | 'account_id' | 'payment_date' | 'amount' | 'payment_method' | 'reference' | 'notes' | 'created_at'
>;
type AttachmentRow = Pick<
  Database['public']['Tables']['attachments']['Row'],
  'id' | 'entity_id' | 'file_name' | 'storage_path'
>;
type InstallmentRow = Database['public']['Tables']['purchase_invoice_installments']['Row'];

function normalizeFilter(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function includesQuery(value: string | null | undefined, query: string) {
  if (!value) {
    return false;
  }

  return value.toLocaleLowerCase('es-ES').includes(query);
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

export function getInvoiceFilters(searchParams?: Record<string, string | string[] | undefined>): InvoiceFilters {
  const defaults = currentMonthRange();
  const rawPeriod = normalizeFilter(searchParams?.period);
  const period = rawPeriod === 'current-month' ? 'current-month' : 'all';
  const rawFrom = normalizeFilter(searchParams?.from);
  const rawTo = normalizeFilter(searchParams?.to);

  return {
    query: normalizeFilter(searchParams?.q).trim(),
    status: normalizeFilter(searchParams?.status),
    vendorId: normalizeFilter(searchParams?.vendor),
    dueFrom: period === 'current-month' ? rawFrom || defaults.from : rawFrom,
    dueTo: period === 'current-month' ? rawTo || defaults.to : rawTo,
    period,
    highlightedInvoiceId: normalizeFilter(searchParams?.invoice)
  };
}

export async function getInvoiceCatalogs(businessId: string): Promise<InvoiceCatalogs> {
  const supabase = await createClient();

  const [vendorsResult, accountsResult] = await Promise.all([
    supabase.from('vendors').select('id, name').eq('business_id', businessId).order('name', { ascending: true }),
    supabase
      .from('accounts')
      .select('id, name, type')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('name', { ascending: true })
  ]);

  return {
    vendors: (vendorsResult.data ?? []) as VendorRow[],
    accounts: (accountsResult.data ?? []) as AccountRow[]
  };
}

export async function getInvoiceList({
  businessId,
  filters
}: {
  businessId: string;
  filters: InvoiceFilters;
}): Promise<InvoiceListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from('purchase_invoices')
    .select('id, vendor_id, invoice_number, issue_date, due_date, subtotal, tax_amount, total, status, notes, attachment_count, created_at')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (filters.vendorId) {
    query = query.eq('vendor_id', filters.vendorId);
  }

  if (filters.status && !['open', 'overdue'].includes(filters.status)) {
    query = query.eq('status', filters.status as InvoiceStatus);
  }

  const { data: invoicesData } = await query;
  const items = (invoicesData ?? []) as InvoiceRow[];

  const vendorIds = [...new Set(items.map((item) => item.vendor_id))];
  const invoiceIds = items.map((item) => item.id);

  const [vendorsResult, attachmentsResult, paymentsResult, installmentsResult] = await Promise.all([
    vendorIds.length > 0 ? supabase.from('vendors').select('id, name').in('id', vendorIds) : Promise.resolve({ data: [] as VendorRow[] }),
    invoiceIds.length > 0
      ? supabase
          .from('attachments')
          .select('id, entity_id, file_name, storage_path')
          .eq('business_id', businessId)
          .eq('entity_type', 'purchase_invoice')
          .in('entity_id', invoiceIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as AttachmentRow[] }),
    invoiceIds.length > 0
      ? supabase
          .from('purchase_invoice_payments')
          .select('id, invoice_id, account_id, payment_date, amount, payment_method, reference, notes, created_at')
          .eq('business_id', businessId)
          .in('invoice_id', invoiceIds)
          .order('payment_date', { ascending: false })
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as PaymentRow[] }),
    invoiceIds.length > 0
      ? supabase
          .from('purchase_invoice_installments')
          .select('id, business_id, invoice_id, sequence_number, due_date, amount, paid_amount, status, created_at, updated_at')
          .eq('business_id', businessId)
          .in('invoice_id', invoiceIds)
          .order('sequence_number', { ascending: true })
      : Promise.resolve({ data: [] as InstallmentRow[] })
  ]);

  const vendorMap = new Map(((vendorsResult.data ?? []) as VendorRow[]).map((item) => [item.id, item.name]));

  const attachmentUrlMap = new Map<string, string | null>();
  const attachmentRows = (attachmentsResult.data ?? []) as AttachmentRow[];
  const attachmentPaths = attachmentRows.map((item) => item.storage_path);

  if (attachmentPaths.length > 0) {
    const signedUrls = await Promise.all(
      attachmentPaths.map(async (path) => {
        const { data } = await supabase.storage.from('private-documents').createSignedUrl(path, 60 * 30);
        return { path, url: data?.signedUrl ?? null };
      })
    );

    signedUrls.forEach((item) => {
      attachmentUrlMap.set(item.path, item.url);
    });
  }

  const attachmentsByInvoice = new Map<string, InvoiceListItem['attachments']>();

  for (const attachment of attachmentRows) {
    const current = attachmentsByInvoice.get(attachment.entity_id) ?? [];
    current.push({
      id: attachment.id,
      fileName: attachment.file_name,
      url: attachmentUrlMap.get(attachment.storage_path) ?? null
    });
    attachmentsByInvoice.set(attachment.entity_id, current);
  }

  const paymentRows = (paymentsResult.data ?? []) as PaymentRow[];
  const accountIds = [...new Set(paymentRows.map((item) => item.account_id))];
  const accountsResult = accountIds.length > 0 ? await supabase.from('accounts').select('id, name').in('id', accountIds) : { data: [] as Pick<AccountRow, 'id' | 'name'>[] };
  const accountMap = new Map(((accountsResult.data ?? []) as Pick<AccountRow, 'id' | 'name'>[]).map((item) => [item.id, item.name]));

  const paymentsByInvoice = new Map<string, InvoiceListItem['payments']>();
  const paidAmountMap = new Map<string, number>();

  for (const payment of paymentRows) {
    const amount = parseMoney(payment.amount);
    const currentPayments = paymentsByInvoice.get(payment.invoice_id) ?? [];
    currentPayments.push({
      id: payment.id,
      accountId: payment.account_id,
      accountName: accountMap.get(payment.account_id) ?? null,
      paymentDate: payment.payment_date,
      amount,
      paymentMethod: payment.payment_method,
      reference: payment.reference,
      notes: payment.notes,
      createdAt: payment.created_at
    });
    paymentsByInvoice.set(payment.invoice_id, currentPayments);
    paidAmountMap.set(payment.invoice_id, (paidAmountMap.get(payment.invoice_id) ?? 0) + amount);
  }

  const installmentsByInvoice = new Map<string, InvoiceInstallmentItem[]>();
  const installmentRows = (installmentsResult.data ?? []) as InstallmentRow[];

  for (const installment of installmentRows) {
    const current = installmentsByInvoice.get(installment.invoice_id) ?? [];
    const amount = parseMoney(installment.amount);
    const paidAmount = parseMoney(installment.paid_amount);
    current.push({
      id: installment.id,
      sequenceNumber: installment.sequence_number,
      dueDate: installment.due_date,
      amount,
      paidAmount,
      pendingAmount: Math.max(amount - paidAmount, 0),
      status: installment.status as InvoiceInstallmentItem['status']
    });
    installmentsByInvoice.set(installment.invoice_id, current);
  }

  let rows: InvoiceListItem[] = items.map((item) => {
    const total = parseMoney(item.total);
    const paidAmount = paidAmountMap.get(item.id) ?? 0;
    const installments = installmentsByInvoice.get(item.id) ?? [];
    const nextInstallment = installments.find((installment) => installment.status !== 'paid') ?? installments[0] ?? null;

    return {
      id: item.id,
      vendorId: item.vendor_id,
      vendorName: vendorMap.get(item.vendor_id) ?? 'Proveedor sin nombre',
      invoiceNumber: item.invoice_number,
      issueDate: item.issue_date,
      dueDate: nextInstallment?.dueDate ?? item.due_date,
      nextDueDate: nextInstallment?.dueDate ?? item.due_date,
      subtotal: parseMoney(item.subtotal),
      taxAmount: parseMoney(item.tax_amount),
      total,
      paidAmount,
      pendingAmount: Math.max(total - paidAmount, 0),
      status: item.status,
      notes: item.notes,
      createdAt: item.created_at,
      attachmentCount: item.attachment_count,
      attachments: attachmentsByInvoice.get(item.id) ?? [],
      installments,
      payments: paymentsByInvoice.get(item.id) ?? []
    };
  });

  if (filters.period !== 'all' && (filters.dueFrom || filters.dueTo)) {
    rows = rows.filter((row) => {
      const dueDates = row.installments.length > 0 ? row.installments.map((installment) => installment.dueDate) : [row.nextDueDate];
      return dueDates.some((dueDate) => {
        if (filters.dueFrom && dueDate < filters.dueFrom) return false;
        if (filters.dueTo && dueDate > filters.dueTo) return false;
        return true;
      });
    });
  } else if (filters.period === 'all' && (filters.dueFrom || filters.dueTo)) {
    rows = rows.filter((row) => {
      const dueDates = row.installments.length > 0 ? row.installments.map((installment) => installment.dueDate) : [row.nextDueDate];
      return dueDates.some((dueDate) => {
        if (filters.dueFrom && dueDate < filters.dueFrom) return false;
        if (filters.dueTo && dueDate > filters.dueTo) return false;
        return true;
      });
    });
  }

  if (filters.status === 'open') {
    rows = rows.filter((row) => ['pending', 'partially_paid'].includes(row.status));
  }

  if (filters.status === 'overdue') {
    rows = rows.filter((row) => row.installments.some((installment) => installment.status === 'overdue'));
  }

  const textQuery = filters.query.trim().toLocaleLowerCase('es-ES');

  if (textQuery) {
    rows = rows.filter((row) => {
      return (
        includesQuery(row.vendorName, textQuery) ||
        includesQuery(row.invoiceNumber, textQuery) ||
        includesQuery(row.notes, textQuery) ||
        row.payments.some((payment) => includesQuery(payment.reference, textQuery) || includesQuery(payment.accountName, textQuery))
      );
    });
  }

  rows.sort((left, right) => left.nextDueDate.localeCompare(right.nextDueDate));

  return rows;
}
