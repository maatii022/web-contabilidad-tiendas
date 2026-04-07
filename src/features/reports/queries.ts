import 'server-only';

import { entrySignedAmount } from '@/features/accounts/helpers';
import { parseMoney } from '@/features/expenses/helpers';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type InvoiceSummaryItem = {
  label: string;
  count: number;
  amount: number;
  tone: 'neutral' | 'warning' | 'danger' | 'success' | 'info';
};

type AccountSnapshotItem = {
  id: string;
  name: string;
  balance: number;
  type: Database['public']['Enums']['account_type'];
};

type AnalysisInsight = {
  tone: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  body: string;
};

export type AnalysisChartPoint = {
  key: string;
  label: string;
  expenses: number;
  inflow: number;
  profit: number;
};

export type AnalysisSnapshot = {
  stats: {
    monthlyExpense: number;
    pendingAmount: number;
    overdueAmount: number;
    balance: number;
    currentMonthInflow: number;
    currentMonthOutflow: number;
  };
  chart: {
    monthly: AnalysisChartPoint[];
    annual: AnalysisChartPoint[];
    total: AnalysisChartPoint[];
  };
  highlights: {
    bestMonth: {
      label: string;
      value: number;
    } | null;
    worstMonth: {
      label: string;
      value: number;
    } | null;
    bestTypicalMonth: {
      month: number;
      label: string;
      value: number;
      sampleCount: number;
    } | null;
    worstTypicalMonth: {
      month: number;
      label: string;
      value: number;
      sampleCount: number;
    } | null;
    revenueRecord: {
      label: string;
      value: number;
    } | null;
    profitRecord: {
      label: string;
      value: number;
    } | null;
  };
  categoryBreakdown: Array<{
    label: string;
    value: number;
    color: string | null;
  }>;
  invoiceSummary: InvoiceSummaryItem[];
  accounts: AccountSnapshotItem[];
  insights: AnalysisInsight[];
};

export type ReportsSnapshot = AnalysisSnapshot;

type ExpenseRow = Pick<
  Database['public']['Tables']['expenses']['Row'],
  'expense_date' | 'total_amount' | 'category_id'
>;

type EntryRow = Pick<
  Database['public']['Tables']['account_entries']['Row'],
  'account_id' | 'entry_date' | 'type' | 'amount'
>;

type InvoiceRow = Pick<
  Database['public']['Tables']['purchase_invoices']['Row'],
  'status' | 'total' | 'due_date'
>;

type PaymentRow = Pick<
  Database['public']['Tables']['purchase_invoice_payments']['Row'],
  'payment_date' | 'amount'
>;


type MonthSeasonality = {
  month: number;
  label: string;
  value: number;
  sampleCount: number;
};

const MONTH_LABELS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function getZonedDateParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === 'year')?.value ?? '1970');
  const month = Number(parts.find((part) => part.type === 'month')?.value ?? '01');
  const day = Number(parts.find((part) => part.type === 'day')?.value ?? '01');

  return { year, month, day };
}

function formatMonthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat('es-ES', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC'
  })
    .format(new Date(Date.UTC(year, month - 1, 1)))
    .replace('.', '');
}

function formatDayLabel(year: number, month: number, day: number) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC'
  })
    .format(new Date(Date.UTC(year, month - 1, day)))
    .replace('.', '');
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addToPoint(
  store: Map<string, AnalysisChartPoint>,
  key: string,
  updater: (point: AnalysisChartPoint) => void,
  factory: () => AnalysisChartPoint
) {
  if (!store.has(key)) {
    store.set(key, factory());
  }

  const point = store.get(key);
  if (point) {
    updater(point);
  }
}

function eur(amount: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2
  }).format(amount);
}

function buildHistoricalMonthlySeries(yearMonthKeys: string[]) {
  const sortedKeys = [...new Set(yearMonthKeys)].sort((a, b) => a.localeCompare(b));
  if (sortedKeys.length === 0) return new Map<string, AnalysisChartPoint>();

  const [startYear, startMonth] = sortedKeys[0].split('-').map(Number);
  const [endYear, endMonth] = sortedKeys[sortedKeys.length - 1].split('-').map(Number);

  const store = new Map<string, AnalysisChartPoint>();
  let cursorYear = startYear;
  let cursorMonth = startMonth;

  while (cursorYear < endYear || (cursorYear === endYear && cursorMonth <= endMonth)) {
    const key = `${cursorYear}-${String(cursorMonth).padStart(2, '0')}`;
    store.set(key, {
      key,
      label: formatMonthLabel(cursorYear, cursorMonth),
      expenses: 0,
      inflow: 0,
      profit: 0
    });

    cursorMonth += 1;
    if (cursorMonth > 12) {
      cursorMonth = 1;
      cursorYear += 1;
    }
  }

  return store;
}

function getMonthlySeasonality(points: AnalysisChartPoint[]): MonthSeasonality[] {
  const buckets = new Map<number, { total: number; count: number }>();

  for (const point of points) {
    const month = Number(point.key.slice(5, 7));
    const bucket = buckets.get(month) ?? { total: 0, count: 0 };
    bucket.total += point.profit;
    bucket.count += Math.abs(point.expenses) > 0.009 || Math.abs(point.inflow) > 0.009 ? 1 : 0;
    buckets.set(month, bucket);
  }

  return Array.from(buckets.entries())
    .map(([month, bucket]) => ({
      month,
      label: MONTH_LABELS_ES[month - 1] ?? `mes ${month}`,
      value: bucket.count > 0 ? Number((bucket.total / bucket.count).toFixed(2)) : 0,
      sampleCount: bucket.count
    }))
    .filter((item) => item.sampleCount > 0)
    .sort((a, b) => a.month - b.month);
}

export async function getAnalysisSnapshot({
  businessId,
  timezone
}: {
  businessId: string;
  timezone: string;
}): Promise<AnalysisSnapshot> {
  const supabase = await createClient();
  const { year: currentYear, month: currentMonth } = getZonedDateParts(new Date(), timezone);
  const currentMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const previousDate = new Date(Date.UTC(currentYear, currentMonth - 2, 1));
  const previousMonthPrefix = `${previousDate.getUTCFullYear()}-${String(previousDate.getUTCMonth() + 1).padStart(2, '0')}`;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());

  const [expensesResult, invoicesResult, categoriesResult, accountsResult, entriesResult, invoicePaymentsResult] = await Promise.all([
    supabase.from('expenses').select('expense_date, total_amount, category_id').eq('business_id', businessId).order('expense_date', { ascending: true }),
    supabase.from('purchase_invoices').select('status, total, due_date').eq('business_id', businessId),
    supabase.from('expense_categories').select('id, name, color').eq('business_id', businessId),
    supabase
      .from('accounts')
      .select('id, name, type, initial_balance')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('name', { ascending: true }),
    supabase.from('account_entries').select('account_id, entry_date, type, amount').eq('business_id', businessId),
    supabase.from('purchase_invoice_payments').select('payment_date, amount').eq('business_id', businessId).order('payment_date', { ascending: true })
  ]);

  const expenseRows = (expensesResult.data ?? []) as ExpenseRow[];
  const entryRows = (entriesResult.data ?? []) as EntryRow[];
  const invoiceRows = (invoicesResult.data ?? []) as InvoiceRow[];
  const invoicePaymentRows = (invoicePaymentsResult.data ?? []) as PaymentRow[];
  const categoryMap = new Map((categoriesResult.data ?? []).map((item) => [item.id, item]));

  const monthlyMap = new Map<string, AnalysisChartPoint>();
  const annualMap = new Map<string, AnalysisChartPoint>();
  const yearMonthKeys = new Set<string>([currentMonthPrefix]);
  const categoryTotals = new Map<string, number>();

  const monthDays = daysInMonth(currentYear, currentMonth);
  for (let day = 1; day <= monthDays; day += 1) {
    const key = `${currentMonthPrefix}-${String(day).padStart(2, '0')}`;
    monthlyMap.set(key, {
      key,
      label: formatDayLabel(currentYear, currentMonth, day),
      expenses: 0,
      inflow: 0,
      profit: 0
    });
  }

  for (let month = 1; month <= 12; month += 1) {
    const key = `${currentYear}-${String(month).padStart(2, '0')}`;
    annualMap.set(key, {
      key,
      label: formatMonthLabel(currentYear, month),
      expenses: 0,
      inflow: 0,
      profit: 0
    });
  }

  let monthlyExpense = 0;
  let previousMonthExpense = 0;

  for (const expense of expenseRows) {
    const value = parseMoney(expense.total_amount);
    const year = Number(expense.expense_date.slice(0, 4));
    const month = Number(expense.expense_date.slice(5, 7));
    const day = Number(expense.expense_date.slice(8, 10));
    const annualKey = `${year}-${String(month).padStart(2, '0')}`;
    const dailyKey = `${annualKey}-${String(day).padStart(2, '0')}`;
    yearMonthKeys.add(annualKey);

    if (annualMap.has(annualKey)) {
      addToPoint(
        annualMap,
        annualKey,
        (point) => {
          point.expenses = Number((point.expenses + value).toFixed(2));
          point.profit = Number((point.inflow - point.expenses).toFixed(2));
        },
        () => ({ key: annualKey, label: formatMonthLabel(year, month), expenses: 0, inflow: 0, profit: 0 })
      );
    }

    if (monthlyMap.has(dailyKey)) {
      addToPoint(
        monthlyMap,
        dailyKey,
        (point) => {
          point.expenses = Number((point.expenses + value).toFixed(2));
          point.profit = Number((point.inflow - point.expenses).toFixed(2));
        },
        () => ({ key: dailyKey, label: formatDayLabel(year, month, day), expenses: 0, inflow: 0, profit: 0 })
      );
    }

    const monthPrefix = expense.expense_date.slice(0, 7);
    if (monthPrefix === currentMonthPrefix) {
      monthlyExpense += value;
      categoryTotals.set(expense.category_id, Number(((categoryTotals.get(expense.category_id) ?? 0) + value).toFixed(2)));
    }
    if (monthPrefix === previousMonthPrefix) {
      previousMonthExpense += value;
    }
  }

  for (const payment of invoicePaymentRows) {
    const value = parseMoney(payment.amount);
    const year = Number(payment.payment_date.slice(0, 4));
    const month = Number(payment.payment_date.slice(5, 7));
    const day = Number(payment.payment_date.slice(8, 10));
    const annualKey = `${year}-${String(month).padStart(2, '0')}`;
    const dailyKey = `${annualKey}-${String(day).padStart(2, '0')}`;
    yearMonthKeys.add(annualKey);

    addToPoint(
      annualMap,
      annualKey,
      (point) => {
        point.expenses = Number((point.expenses + value).toFixed(2));
        point.profit = Number((point.inflow - point.expenses).toFixed(2));
      },
      () => ({ key: annualKey, label: formatMonthLabel(year, month), expenses: 0, inflow: 0, profit: 0 })
    );

    if (monthlyMap.has(dailyKey)) {
      addToPoint(
        monthlyMap,
        dailyKey,
        (point) => {
          point.expenses = Number((point.expenses + value).toFixed(2));
          point.profit = Number((point.inflow - point.expenses).toFixed(2));
        },
        () => ({ key: dailyKey, label: formatDayLabel(year, month, day), expenses: 0, inflow: 0, profit: 0 })
      );
    }

    const monthPrefix = payment.payment_date.slice(0, 7);
    if (monthPrefix === currentMonthPrefix) {
      monthlyExpense += value;
    }
    if (monthPrefix === previousMonthPrefix) {
      previousMonthExpense += value;
    }
  }

  let currentMonthInflow = 0;
  let currentMonthOutflow = 0;

  for (const entry of entryRows) {
    const signed = entrySignedAmount({ type: entry.type, amount: entry.amount });
    const inflow = signed > 0 ? signed : 0;
    const outflow = signed < 0 ? Math.abs(signed) : 0;
    const year = Number(entry.entry_date.slice(0, 4));
    const month = Number(entry.entry_date.slice(5, 7));
    const day = Number(entry.entry_date.slice(8, 10));
    const annualKey = `${year}-${String(month).padStart(2, '0')}`;
    const dailyKey = `${annualKey}-${String(day).padStart(2, '0')}`;
    yearMonthKeys.add(annualKey);

    if (annualMap.has(annualKey)) {
      addToPoint(
        annualMap,
        annualKey,
        (point) => {
          point.inflow = Number((point.inflow + inflow).toFixed(2));
          point.profit = Number((point.inflow - point.expenses).toFixed(2));
        },
        () => ({ key: annualKey, label: formatMonthLabel(year, month), expenses: 0, inflow: 0, profit: 0 })
      );
    }

    if (monthlyMap.has(dailyKey)) {
      addToPoint(
        monthlyMap,
        dailyKey,
        (point) => {
          point.inflow = Number((point.inflow + inflow).toFixed(2));
          point.profit = Number((point.inflow - point.expenses).toFixed(2));
        },
        () => ({ key: dailyKey, label: formatDayLabel(year, month, day), expenses: 0, inflow: 0, profit: 0 })
      );
    }

    if (entry.entry_date.slice(0, 7) === currentMonthPrefix) {
      currentMonthInflow += inflow;
      currentMonthOutflow += outflow;
    }
  }

  const historicalMap = buildHistoricalMonthlySeries(Array.from(yearMonthKeys));

  for (const expense of expenseRows) {
    const key = expense.expense_date.slice(0, 7);
    const value = parseMoney(expense.total_amount);
    addToPoint(
      historicalMap,
      key,
      (point) => {
        point.expenses = Number((point.expenses + value).toFixed(2));
        point.profit = Number((point.inflow - point.expenses).toFixed(2));
      },
      () => ({ key, label: key, expenses: 0, inflow: 0, profit: 0 })
    );
  }

  for (const payment of invoicePaymentRows) {
    const key = payment.payment_date.slice(0, 7);
    const value = parseMoney(payment.amount);
    addToPoint(
      historicalMap,
      key,
      (point) => {
        point.expenses = Number((point.expenses + value).toFixed(2));
        point.profit = Number((point.inflow - point.expenses).toFixed(2));
      },
      () => ({ key, label: key, expenses: 0, inflow: 0, profit: 0 })
    );
  }

  for (const entry of entryRows) {
    const key = entry.entry_date.slice(0, 7);
    const signed = entrySignedAmount({ type: entry.type, amount: entry.amount });
    const inflow = signed > 0 ? signed : 0;
    addToPoint(
      historicalMap,
      key,
      (point) => {
        point.inflow = Number((point.inflow + inflow).toFixed(2));
        point.profit = Number((point.inflow - point.expenses).toFixed(2));
      },
      () => ({ key, label: key, expenses: 0, inflow: 0, profit: 0 })
    );
  }

  const totalSeries = Array.from(historicalMap.values()).sort((a, b) => a.key.localeCompare(b.key));

  const categoryBreakdown = Array.from(categoryTotals.entries())
    .map(([categoryId, value]) => ({
      label: categoryMap.get(categoryId)?.name ?? 'Sin categoría',
      value,
      color: categoryMap.get(categoryId)?.color ?? null
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  let pendingAmount = 0;
  let overdueAmount = 0;
  let overdueCount = 0;
  const invoiceSummaryMap = new Map<string, { label: string; count: number; amount: number; tone: InvoiceSummaryItem['tone'] }>([
    ['pending', { label: 'Pendientes', count: 0, amount: 0, tone: 'warning' }],
    ['partially_paid', { label: 'Parciales', count: 0, amount: 0, tone: 'info' }],
    ['paid', { label: 'Pagadas', count: 0, amount: 0, tone: 'success' }],
    ['cancelled', { label: 'Anuladas', count: 0, amount: 0, tone: 'neutral' }],
    ['overdue', { label: 'Vencidas', count: 0, amount: 0, tone: 'danger' }]
  ]);

  for (const invoice of invoiceRows) {
    const total = parseMoney(invoice.total);
    const summary = invoiceSummaryMap.get(invoice.status);

    if (summary) {
      summary.count += 1;
      summary.amount = Number((summary.amount + total).toFixed(2));
    }

    if (invoice.status === 'pending' || invoice.status === 'partially_paid') {
      pendingAmount += total;
      if (invoice.due_date < today) {
        overdueAmount += total;
        overdueCount += 1;
        const overdue = invoiceSummaryMap.get('overdue');
        if (overdue) {
          overdue.count += 1;
          overdue.amount = Number((overdue.amount + total).toFixed(2));
        }
      }
    }
  }

  const accountBase = new Map<string, AccountSnapshotItem>();
  for (const account of accountsResult.data ?? []) {
    accountBase.set(account.id, {
      id: account.id,
      name: account.name,
      balance: parseMoney(account.initial_balance),
      type: account.type
    });
  }

  for (const entry of entryRows) {
    const account = accountBase.get(entry.account_id);
    if (!account) continue;
    account.balance = Number((account.balance + entrySignedAmount({ type: entry.type, amount: entry.amount })).toFixed(2));
  }

  const accounts = Array.from(accountBase.values()).sort((a, b) => b.balance - a.balance);
  const balance = Number(accounts.reduce((sum, account) => sum + account.balance, 0).toFixed(2));

  const topCategory = categoryBreakdown[0];
  const categoryConcentration = topCategory && monthlyExpense > 0 ? (topCategory.value / monthlyExpense) * 100 : 0;
  const monthlyDelta = previousMonthExpense > 0 ? ((monthlyExpense - previousMonthExpense) / previousMonthExpense) * 100 : 0;
  const estimatedRunwayDays = monthlyExpense > 0 ? Math.floor(balance / (monthlyExpense / 30)) : null;

  const activeHistoricalPoints = totalSeries.filter(
    (point) => Math.abs(point.expenses) > 0.009 || Math.abs(point.inflow) > 0.009 || Math.abs(point.profit) > 0.009
  );
  const bestMonthPoint =
    activeHistoricalPoints.length > 0
      ? activeHistoricalPoints.reduce((best, point) => (point.profit > best.profit ? point : best), activeHistoricalPoints[0])
      : null;
  const worstMonthPoint =
    activeHistoricalPoints.length > 0
      ? activeHistoricalPoints.reduce((worst, point) => (point.profit < worst.profit ? point : worst), activeHistoricalPoints[0])
      : null;
  const revenueRecord =
    activeHistoricalPoints.length > 0
      ? activeHistoricalPoints.reduce((best, point) => (point.inflow > best.inflow ? point : best), activeHistoricalPoints[0])
      : null;
  const profitRecord =
    activeHistoricalPoints.length > 0
      ? activeHistoricalPoints.reduce((best, point) => (point.profit > best.profit ? point : best), activeHistoricalPoints[0])
      : null;

  const seasonality = getMonthlySeasonality(totalSeries);
  const bestTypicalMonth = seasonality.length > 0 ? seasonality.reduce((best, item) => (item.value > best.value ? item : best), seasonality[0]) : null;
  const worstTypicalMonth = seasonality.length > 0 ? seasonality.reduce((worst, item) => (item.value < worst.value ? item : worst), seasonality[0]) : null;

  const insights: AnalysisInsight[] = [];

  if (overdueAmount > 0) {
    insights.push({
      tone: 'danger',
      title: 'Hay facturas ya vencidas',
      body: `Tienes ${overdueCount} vencidas por ${eur(overdueAmount)}. Prioriza estas salidas para evitar tensión en caja.`
    });
  }

  if (categoryConcentration >= 45 && topCategory) {
    insights.push({
      tone: 'warning',
      title: 'Demasiada concentración en una categoría',
      body: `${topCategory.label} concentra el ${categoryConcentration.toFixed(0)}% del gasto del mes. Revisa si puedes renegociar o repartir ese peso.`
    });
  }

  if (bestTypicalMonth && bestTypicalMonth.sampleCount >= 2) {
    insights.push({
      tone: 'info',
      title: `${bestTypicalMonth.label[0].toUpperCase() + bestTypicalMonth.label.slice(1)} suele ser el mejor mes del año`,
      body: `Promedia ${eur(bestTypicalMonth.value)} de beneficio con ${bestTypicalMonth.sampleCount} muestras del histórico.`
    });
  }

  if (worstTypicalMonth && worstTypicalMonth.sampleCount >= 2) {
    insights.push({
      tone: 'warning',
      title: `${worstTypicalMonth.label[0].toUpperCase() + worstTypicalMonth.label.slice(1)} suele ser el mes más flojo`,
      body: `Promedia ${eur(worstTypicalMonth.value)} de beneficio. Úsalo para anticiparte con caja y compras.`
    });
  }

  if (monthlyDelta >= 12) {
    insights.push({
      tone: 'warning',
      title: 'El gasto acelera frente al mes anterior',
      body: `El gasto del mes sube un ${monthlyDelta.toFixed(0)}% respecto al mes previo. Revisa qué bloque está empujando esa subida.`
    });
  } else if (previousMonthExpense > 0 && monthlyDelta <= -8) {
    insights.push({
      tone: 'success',
      title: 'Has mejorado el control de gasto',
      body: `El gasto baja un ${Math.abs(monthlyDelta).toFixed(0)}% frente al mes anterior. Mantén ese ritmo para proteger margen.`
    });
  }

  if (estimatedRunwayDays !== null && estimatedRunwayDays < 25) {
    insights.push({
      tone: 'danger',
      title: 'Autonomía de caja ajustada',
      body: `Al ritmo actual, la tesorería cubre unos ${estimatedRunwayDays} días. Conviene contener gasto no esencial o reforzar entradas.`
    });
  } else if (estimatedRunwayDays !== null) {
    insights.push({
      tone: 'info',
      title: 'Cobertura operativa razonable',
      body: `Con el ritmo actual, la tesorería cubriría alrededor de ${estimatedRunwayDays} días. Vigila solo los próximos vencimientos.`
    });
  }

  if (pendingAmount > 0 && pendingAmount > balance * 0.45) {
    insights.push({
      tone: 'warning',
      title: 'El pendiente pesa demasiado sobre la liquidez',
      body: `Las facturas abiertas equivalen a más del 45% del saldo disponible. Escalona pagos y protege caja.`
    });
  }

  if (insights.length === 0) {
    insights.push({
      tone: 'success',
      title: 'Lectura estable',
      body: 'No hay alertas fuertes en este momento. Mantén la vigilancia sobre vencimientos y sobre la evolución del gasto.'
    });
  }

  return {
    stats: {
      monthlyExpense: Number(monthlyExpense.toFixed(2)),
      pendingAmount: Number(pendingAmount.toFixed(2)),
      overdueAmount: Number(overdueAmount.toFixed(2)),
      balance,
      currentMonthInflow: Number(currentMonthInflow.toFixed(2)),
      currentMonthOutflow: Number(currentMonthOutflow.toFixed(2))
    },
    highlights: {
      bestMonth: bestMonthPoint ? { label: bestMonthPoint.label, value: Number(bestMonthPoint.profit.toFixed(2)) } : null,
      worstMonth: worstMonthPoint ? { label: worstMonthPoint.label, value: Number(worstMonthPoint.profit.toFixed(2)) } : null,
      bestTypicalMonth,
      worstTypicalMonth,
      revenueRecord: revenueRecord ? { label: revenueRecord.label, value: Number(revenueRecord.inflow.toFixed(2)) } : null,
      profitRecord: profitRecord ? { label: profitRecord.label, value: Number(profitRecord.profit.toFixed(2)) } : null
    },
    chart: {
      monthly: Array.from(monthlyMap.values()),
      annual: Array.from(annualMap.values()),
      total: totalSeries
    },
    categoryBreakdown,
    invoiceSummary: Array.from(invoiceSummaryMap.values()),
    accounts,
    insights
  };
}
