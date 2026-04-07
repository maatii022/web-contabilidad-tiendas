import { AnalysisOverview } from '@/components/reports/analysis-overview';
import type { AnalysisSnapshot } from '@/features/reports/queries';

export function ReportsOverview({ data, currency }: { data: AnalysisSnapshot; currency: string }) {
  return <AnalysisOverview data={data} currency={currency} />;
}
