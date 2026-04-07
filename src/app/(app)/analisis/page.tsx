import { AnalysisOverview } from '@/components/reports/analysis-overview';
import { getAnalysisSnapshot } from '@/features/reports/queries';
import { requireAppContext } from '@/lib/app-access';

export default async function AnalisisPage() {
  const appContext = await requireAppContext();
  const data = await getAnalysisSnapshot({
    businessId: appContext.business.id,
    timezone: appContext.business.timezone
  });

  return <AnalysisOverview data={data} currency={appContext.business.currency} />;
}
