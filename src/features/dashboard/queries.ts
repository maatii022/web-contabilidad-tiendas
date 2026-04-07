import 'server-only';
import { buildOperationalSummary } from '@/features/dashboard/mappers';
import type { AccountBalanceItem, DashboardSnapshot, InvoiceStatus, RecentActivityItem, UpcomingInvoiceItem } from '@/features/dashboard/types';
import { createClient } from '@/lib/supabase/server';
const pendingInvoiceStatuses: InvoiceStatus[] = ['pending', 'partially_paid'];
function parseMoney(value: string | number | null | undefined) { if (typeof value === 'number') return Number.isFinite(value) ? value : 0; if (typeof value === 'string') { const parsed = Number.parseFloat(value); return Number.isFinite(parsed) ? parsed : 0; } return 0; }
function getTodayParts(timezone: string) { const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }); const parts = formatter.formatToParts(new Date()); const year = parts.find((part) => part.type === 'year')?.value ?? '2026'; const month = parts.find((part) => part.type === 'month')?.value ?? '01'; const day = parts.find((part) => part.type === 'day')?.value ?? '01'; return { year: Number(year), month: Number(month), day: Number(day) }; }
function toIsoDateString(year: number, month: number, day: number) { return `${String(year)}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`; }
function getDateWindow(timezone: string) { const { year, month, day } = getTodayParts(timezone); const today = toIsoDateString(year, month, day); const monthStart = toIsoDateString(year, month, 1); const nextMonthYear = month === 12 ? year + 1 : year; const nextMonth = month === 12 ? 1 : month + 1; const nextMonthStart = toIsoDateString(nextMonthYear, nextMonth, 1); const dueHorizonDate = new Date(Date.UTC(year, month - 1, day + 15)); const dueHorizon = toIsoDateString(dueHorizonDate.getUTCFullYear(), dueHorizonDate.getUTCMonth() + 1, dueHorizonDate.getUTCDate()); return { today, monthStart, nextMonthStart, dueHorizon }; }
function diffDays(dateA: string, dateB: string) { const [yearA, monthA, dayA] = dateA.split('-').map(Number); const [yearB, monthB, dayB] = dateB.split('-').map(Number); return Math.round((Date.UTC(yearA, monthA - 1, dayA) - Date.UTC(yearB, monthB - 1, dayB)) / 86400000); }
export async function getDashboardSnapshot({ businessId, timezone }: { businessId: string; timezone: string; }): Promise<DashboardSnapshot> {
  const supabase = await createClient();
  const { today, monthStart, nextMonthStart, dueHorizon } = getDateWindow(timezone);
  const [accountsResult, balanceEntriesResult, recentEntriesResult, expensesResult, pendingInvoicesResult, overdueInvoicesResult, dueSoonInvoicesResult] = await Promise.all([
    supabase.from('accounts').select('id, name, type, initial_balance, is_primary, is_active').eq('business_id', businessId).eq('is_active', true).order('is_primary', { ascending: false }).order('name', { ascending: true }),
    supabase.from('account_entries').select('account_id, type, amount').eq('business_id', businessId),
    supabase.from('account_entries').select('id, account_id, entry_date, type, amount, concept, created_at').eq('business_id', businessId).order('entry_date', { ascending: false }).order('created_at', { ascending: false }).limit(7),
    supabase.from('expenses').select('total_amount').eq('business_id', businessId).gte('expense_date', monthStart).lt('expense_date', nextMonthStart),
    supabase.from('purchase_invoices').select('*', { count: 'exact', head: true }).eq('business_id', businessId).in('status', pendingInvoiceStatuses),
    supabase.from('purchase_invoices').select('*', { count: 'exact', head: true }).eq('business_id', businessId).lt('due_date', today).in('status', pendingInvoiceStatuses),
    supabase.from('purchase_invoices').select('id, vendor_id, invoice_number, due_date, total, status').eq('business_id', businessId).gte('due_date', today).lte('due_date', dueHorizon).in('status', pendingInvoiceStatuses).order('due_date', { ascending: true }).limit(6)
  ]);
  const accounts = accountsResult.data ?? [];
  const balanceEntries = balanceEntriesResult.data ?? [];
  const recentEntries = recentEntriesResult.data ?? [];
  const monthlyExpenses = (expensesResult.data ?? []).reduce((sum, expense) => sum + parseMoney(expense.total_amount), 0);
  const pendingInvoices = pendingInvoicesResult.count ?? 0;
  const overdueInvoices = overdueInvoicesResult.count ?? 0;
  const dueSoonInvoicesRaw = dueSoonInvoicesResult.data ?? [];
  const vendorIds = [...new Set(dueSoonInvoicesRaw.map((invoice) => invoice.vendor_id))];
  const recentAccountIds = [...new Set(recentEntries.map((entry) => entry.account_id))];
  const relatedAccountIds = [...new Set([...accounts.map((account) => account.id), ...recentAccountIds])];
  const vendorMap = new Map<string, string>();
  if (vendorIds.length > 0) { const { data: vendors } = await supabase.from('vendors').select('id, name').in('id', vendorIds); (vendors ?? []).forEach((vendor) => { vendorMap.set(vendor.id, vendor.name); }); }
  const accountNameMap = new Map<string, string>();
  if (relatedAccountIds.length > 0) { const { data: relatedAccounts } = await supabase.from('accounts').select('id, name').in('id', relatedAccountIds); (relatedAccounts ?? []).forEach((account) => { accountNameMap.set(account.id, account.name); }); }
  const accountDeltas = new Map<string, number>();
  balanceEntries.forEach((entry) => { const currentValue = accountDeltas.get(entry.account_id) ?? 0; const amount = parseMoney(entry.amount); const signedAmount = entry.type === 'expense' ? -amount : amount; accountDeltas.set(entry.account_id, currentValue + signedAmount); });
  const accountBalances: AccountBalanceItem[] = accounts.map((account) => ({ id: account.id, name: account.name, type: account.type, isPrimary: account.is_primary, balance: parseMoney(account.initial_balance) + (accountDeltas.get(account.id) ?? 0) })).sort((left, right) => left.isPrimary !== right.isPrimary ? (left.isPrimary ? -1 : 1) : right.balance - left.balance);
  const totalBalance = accountBalances.reduce((sum, account) => sum + account.balance, 0);
  const upcomingInvoices: UpcomingInvoiceItem[] = dueSoonInvoicesRaw.map((invoice) => ({ id: invoice.id, vendorName: vendorMap.get(invoice.vendor_id) ?? 'Proveedor sin nombre', invoiceNumber: invoice.invoice_number, dueDate: invoice.due_date, total: parseMoney(invoice.total), status: invoice.status, daysUntilDue: diffDays(invoice.due_date, today) }));
  const recentActivity: RecentActivityItem[] = recentEntries.map((entry) => ({ id: entry.id, accountName: accountNameMap.get(entry.account_id) ?? 'Cuenta sin nombre', concept: entry.concept, entryDate: entry.entry_date, amount: parseMoney(entry.amount), type: entry.type }));
  const stats = { monthlyExpenses, pendingInvoices, overdueInvoices, dueSoonInvoices: upcomingInvoices.length, totalBalance, activeAccounts: accountBalances.length };
  return { stats, upcomingInvoices, recentActivity, accountBalances, summary: buildOperationalSummary({ stats, upcomingInvoices, accountBalances }) };
}
