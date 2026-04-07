import { AccountsWorkspace } from '@/components/accounts/accounts-workspace';
import { getAccountFilters } from '@/features/accounts/helpers';
import { getCashWorkspaceData } from '@/features/accounts/queries';
import { requireAppContext } from '@/lib/app-access';

export default async function CajaPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const appContext = await requireAppContext();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const filters = getAccountFilters(resolvedSearchParams);
  const data = await getCashWorkspaceData({
    businessId: appContext.business.id,
    filters
  });

  return <AccountsWorkspace data={data} filters={filters} currency={appContext.business.currency} canManage={['admin', 'manager'].includes(appContext.membership.role)} />;
}
