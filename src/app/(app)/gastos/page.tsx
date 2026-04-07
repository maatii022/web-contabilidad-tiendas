import { ExpensesWorkspace } from '@/components/expenses/expenses-workspace';
import { getExpenseCatalogs, getExpenseFilters, getExpenseList } from '@/features/expenses/queries';
import { requireAppContext } from '@/lib/app-access';

export default async function GastosPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const appContext = await requireAppContext();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const filters = getExpenseFilters(resolvedSearchParams);
  const [catalogs, records] = await Promise.all([
    getExpenseCatalogs(appContext.business.id),
    getExpenseList({ businessId: appContext.business.id, filters })
  ]);

  return (
    <ExpensesWorkspace
      records={records}
      catalogs={catalogs}
      filters={filters}
      currency={appContext.business.currency}
      canManage={['admin', 'manager'].includes(appContext.membership.role)}
    />
  );
}
