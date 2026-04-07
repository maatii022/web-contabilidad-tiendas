import { InvoicesWorkspace } from '@/components/invoices/invoices-workspace';
import { getInvoiceCatalogs, getInvoiceFilters, getInvoiceList } from '@/features/invoices/queries';
import { requireAppContext } from '@/lib/app-access';

export default async function FacturasPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const appContext = await requireAppContext();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const filters = getInvoiceFilters(resolvedSearchParams);
  const [catalogs, records] = await Promise.all([
    getInvoiceCatalogs(appContext.business.id),
    getInvoiceList({ businessId: appContext.business.id, filters })
  ]);

  return (
    <InvoicesWorkspace
      records={records}
      catalogs={catalogs}
      filters={filters}
      currency={appContext.business.currency}
      canManage={['admin', 'manager'].includes(appContext.membership.role)}
    />
  );
}
