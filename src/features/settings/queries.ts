import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { SettingsCategoryItem, SettingsProviderItem, SettingsWorkspaceData } from '@/features/settings/types';

export async function getSettingsWorkspaceData(businessId: string): Promise<SettingsWorkspaceData> {
  const supabase = await createClient();

  const [{ data: providersRaw }, { data: categoriesRaw }, { data: expensesRows }, { data: invoicesRows }] = await Promise.all([
    supabase
      .from('vendors')
      .select('id, name, tax_id, email, phone, notes')
      .eq('business_id', businessId)
      .order('name', { ascending: true }),
    supabase
      .from('expense_categories')
      .select('id, name, color, icon, is_active')
      .eq('business_id', businessId)
      .order('name', { ascending: true }),
    supabase.from('expenses').select('vendor_id, category_id').eq('business_id', businessId),
    supabase.from('purchase_invoices').select('vendor_id').eq('business_id', businessId)
  ]);

  const expenseRows = (expensesRows ?? []) as Array<{ vendor_id: string | null; category_id: string }>;
  const invoiceRows = (invoicesRows ?? []) as Array<{ vendor_id: string }>;

  const expenseCountByVendor = new Map<string, number>();
  const invoiceCountByVendor = new Map<string, number>();
  const expenseCountByCategory = new Map<string, number>();

  for (const row of expenseRows) {
    if (row.vendor_id) {
      expenseCountByVendor.set(row.vendor_id, (expenseCountByVendor.get(row.vendor_id) ?? 0) + 1);
    }
    expenseCountByCategory.set(row.category_id, (expenseCountByCategory.get(row.category_id) ?? 0) + 1);
  }

  for (const row of invoiceRows) {
    invoiceCountByVendor.set(row.vendor_id, (invoiceCountByVendor.get(row.vendor_id) ?? 0) + 1);
  }

  const providers: SettingsProviderItem[] = ((providersRaw ?? []) as Array<{
    id: string;
    name: string;
    tax_id: string | null;
    email: string | null;
    phone: string | null;
    notes: string | null;
  }>).map((provider) => ({
    id: provider.id,
    name: provider.name,
    taxId: provider.tax_id,
    email: provider.email,
    phone: provider.phone,
    notes: provider.notes,
    expenseCount: expenseCountByVendor.get(provider.id) ?? 0,
    invoiceCount: invoiceCountByVendor.get(provider.id) ?? 0
  }));

  const categories: SettingsCategoryItem[] = ((categoriesRaw ?? []) as Array<{
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
    is_active: boolean;
  }>).map((category) => ({
    id: category.id,
    name: category.name,
    color: category.color,
    icon: category.icon,
    isActive: category.is_active,
    expenseCount: expenseCountByCategory.get(category.id) ?? 0
  }));

  return {
    providers,
    categories
  };
}
