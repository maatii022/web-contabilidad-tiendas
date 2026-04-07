import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { ExpenseCatalogs, ExpenseFilters, ExpenseListItem } from '@/features/expenses/types';
import { parseMoney } from '@/features/expenses/helpers';

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

export function getExpenseFilters(searchParams?: Record<string, string | string[] | undefined>): ExpenseFilters {
  const defaults = currentMonthRange();
  const rawFrom = normalizeFilter(searchParams?.from);
  const rawTo = normalizeFilter(searchParams?.to);

  return {
    query: normalizeFilter(searchParams?.q).trim(),
    categoryId: normalizeFilter(searchParams?.category),
    accountId: normalizeFilter(searchParams?.account),
    dateFrom: rawFrom || defaults.from,
    dateTo: rawTo || defaults.to
  };
}

export async function getExpenseCatalogs(businessId: string): Promise<ExpenseCatalogs> {
  const supabase = await createClient();

  const [categoriesResult, accountsResult, vendorsResult] = await Promise.all([
    supabase
      .from('expense_categories')
      .select('id, name, color')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase
      .from('accounts')
      .select('id, name, type')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('name', { ascending: true }),
    supabase
      .from('vendors')
      .select('id, name')
      .eq('business_id', businessId)
      .order('name', { ascending: true })
  ]);

  return {
    categories: categoriesResult.data ?? [],
    accounts: accountsResult.data ?? [],
    vendors: vendorsResult.data ?? []
  };
}

export async function getExpenseList({
  businessId,
  filters
}: {
  businessId: string;
  filters: ExpenseFilters;
}): Promise<ExpenseListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from('expenses')
    .select(
      'id, category_id, vendor_id, account_id, expense_date, base_amount, tax_amount, total_amount, payment_method, reference, notes, attachment_count, created_at'
    )
    .eq('business_id', businessId)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }

  if (filters.accountId) {
    query = query.eq('account_id', filters.accountId);
  }

  if (filters.dateFrom) {
    query = query.gte('expense_date', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('expense_date', filters.dateTo);
  }

  const { data: expenses } = await query;
  const items = expenses ?? [];

  const categoryIds = [...new Set(items.map((item) => item.category_id))];
  const vendorIds = [...new Set(items.map((item) => item.vendor_id).filter(Boolean))] as string[];
  const accountIds = [...new Set(items.map((item) => item.account_id).filter(Boolean))] as string[];
  const expenseIds = items.map((item) => item.id);

  const [categoriesResult, vendorsResult, accountsResult, attachmentsResult] = await Promise.all([
    categoryIds.length > 0
      ? supabase.from('expense_categories').select('id, name, color').in('id', categoryIds)
      : Promise.resolve({ data: [] }),
    vendorIds.length > 0
      ? supabase.from('vendors').select('id, name').in('id', vendorIds)
      : Promise.resolve({ data: [] }),
    accountIds.length > 0
      ? supabase.from('accounts').select('id, name').in('id', accountIds)
      : Promise.resolve({ data: [] }),
    expenseIds.length > 0
      ? supabase
          .from('attachments')
          .select('id, entity_id, file_name, storage_path')
          .eq('business_id', businessId)
          .eq('entity_type', 'expense')
          .in('entity_id', expenseIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] })
  ]);

  const categoryMap = new Map((categoriesResult.data ?? []).map((item) => [item.id, item]));
  const vendorMap = new Map((vendorsResult.data ?? []).map((item) => [item.id, item.name]));
  const accountMap = new Map((accountsResult.data ?? []).map((item) => [item.id, item.name]));

  const attachmentUrlMap = new Map<string, string | null>();
  const attachmentPaths = (attachmentsResult.data ?? []).map((item) => item.storage_path);

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

  const attachmentsByExpense = new Map<string, ExpenseListItem['attachments']>();

  for (const attachment of attachmentsResult.data ?? []) {
    const current = attachmentsByExpense.get(attachment.entity_id) ?? [];
    current.push({
      id: attachment.id,
      fileName: attachment.file_name,
      url: attachmentUrlMap.get(attachment.storage_path) ?? null
    });
    attachmentsByExpense.set(attachment.entity_id, current);
  }

  let rows: ExpenseListItem[] = items.map((item) => ({
    id: item.id,
    expenseDate: item.expense_date,
    categoryId: item.category_id,
    categoryName: categoryMap.get(item.category_id)?.name ?? 'Sin categoría',
    categoryColor: categoryMap.get(item.category_id)?.color ?? null,
    vendorId: item.vendor_id,
    vendorName: item.vendor_id ? vendorMap.get(item.vendor_id) ?? null : null,
    accountId: item.account_id,
    accountName: item.account_id ? accountMap.get(item.account_id) ?? null : null,
    paymentMethod: item.payment_method,
    baseAmount: parseMoney(item.base_amount),
    taxAmount: parseMoney(item.tax_amount),
    totalAmount: parseMoney(item.total_amount),
    reference: item.reference,
    notes: item.notes,
    createdAt: item.created_at,
    attachmentCount: item.attachment_count,
    attachments: attachmentsByExpense.get(item.id) ?? []
  }));

  const textQuery = filters.query.trim().toLocaleLowerCase('es-ES');

  if (textQuery) {
    rows = rows.filter((row) =>
      includesQuery(row.categoryName, textQuery) ||
      includesQuery(row.vendorName, textQuery) ||
      includesQuery(row.accountName, textQuery) ||
      includesQuery(row.reference, textQuery) ||
      includesQuery(row.notes, textQuery)
    );
  }

  return rows;
}
