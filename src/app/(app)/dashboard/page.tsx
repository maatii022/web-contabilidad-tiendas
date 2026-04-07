import { Landmark, Receipt, TriangleAlert, WalletCards } from 'lucide-react';

import { AccountBalanceList } from '@/components/dashboard/account-balance-list';
import { DashboardSection } from '@/components/dashboard/dashboard-section';
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import { OperationalSummary } from '@/components/dashboard/operational-summary';
import { RecentActivityList } from '@/components/dashboard/recent-activity-list';
import { UpcomingInvoicesList } from '@/components/dashboard/upcoming-invoices-list';
import { DashboardQuickActions } from '@/components/forms/dashboard-quick-actions';
import { PageHeader } from '@/components/page-header';
import { getDashboardSnapshot } from '@/features/dashboard/queries';
import { getExpenseCatalogs } from '@/features/expenses/queries';
import { requireAppContext } from '@/lib/app-access';
import { formatCurrency } from '@/lib/utils';

export default async function DashboardPage() {
  const appContext = await requireAppContext();
  const [dashboard, catalogs] = await Promise.all([
    getDashboardSnapshot({
      businessId: appContext.business.id,
      timezone: appContext.business.timezone
    }),
    getExpenseCatalogs(appContext.business.id)
  ]);

  const canManage = ['admin', 'manager'].includes(appContext.membership.role);

  return (
    <div className="page-grid gap-5 xl:gap-6">
      <PageHeader
        title="Resumen del negocio"
        description="Operativa rápida, tesorería y vencimientos en un solo panel."
        actions={<DashboardQuickActions catalogs={catalogs} canManage={canManage} />}
      />

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <DashboardStatCard
          label="Gasto del mes"
          value={formatCurrency(dashboard.stats.monthlyExpenses, appContext.business.currency)}
          helper="Mes actual"
          icon={WalletCards}
          tone="info"
          badge="Actual"
          emphasis
        />
        <DashboardStatCard
          label="Facturas pendientes"
          value={String(dashboard.stats.pendingInvoices)}
          helper="Pendientes y parciales"
          icon={Receipt}
          tone={dashboard.stats.pendingInvoices > 0 ? 'warning' : 'success'}
          badge={dashboard.stats.pendingInvoices > 0 ? 'Abiertas' : 'Limpio'}
        />
        <DashboardStatCard
          label="Facturas vencidas"
          value={String(dashboard.stats.overdueInvoices)}
          helper="Fuera de plazo"
          icon={TriangleAlert}
          tone={dashboard.stats.overdueInvoices > 0 ? 'danger' : 'success'}
          badge={dashboard.stats.overdueInvoices > 0 ? 'Atención' : 'Controlado'}
        />
        <DashboardStatCard
          label="Saldo disponible"
          value={formatCurrency(dashboard.stats.totalBalance, appContext.business.currency)}
          helper={`${dashboard.stats.activeAccounts} cuentas activas`}
          icon={Landmark}
          tone="success"
          badge="Tesorería"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_360px] xl:items-start">
        <div className="space-y-5">
          <DashboardSection title="Facturas a vigilar" description="Próximos 15 días.">
            <UpcomingInvoicesList items={dashboard.upcomingInvoices} currency={appContext.business.currency} />
          </DashboardSection>
          <DashboardSection title="Últimos movimientos" description="Caja y banco.">
            <RecentActivityList items={dashboard.recentActivity} currency={appContext.business.currency} />
          </DashboardSection>
        </div>
        <div className="space-y-5">
          <DashboardSection title="Saldos" description="Balance por cuenta activa.">
            <AccountBalanceList items={dashboard.accountBalances} currency={appContext.business.currency} />
          </DashboardSection>
          <DashboardSection title="Resumen operativo" description="Lectura rápida del día.">
            <OperationalSummary items={dashboard.summary} />
          </DashboardSection>
        </div>
      </section>
    </div>
  );
}
