import { AlertTriangle, ArrowUpRight, Landmark, Receipt, ShieldCheck, Wallet } from 'lucide-react';

import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import { StatusPill } from '@/components/dashboard/status-pill';
import { InteractiveAnalysisCharts } from '@/components/reports/interactive-analysis-charts';
import type { AnalysisSnapshot } from '@/features/reports/queries';
import { cn, formatCurrency } from '@/lib/utils';

function toneClass(tone: 'success' | 'warning' | 'danger' | 'info') {
  if (tone === 'success') return 'bg-[rgba(85,117,82,0.12)] text-[var(--success)]';
  if (tone === 'warning') return 'bg-[rgba(175,123,53,0.12)] text-[var(--warning)]';
  if (tone === 'danger') return 'bg-[rgba(155,91,83,0.12)] text-[var(--danger)]';
  return 'bg-[rgba(110,127,86,0.12)] text-[var(--accent-strong)]';
}

function InsightCard({
  title,
  body,
  tone
}: {
  title: string;
  body: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
}) {
  return (
    <article className="rounded-[22px] border border-[rgba(123,136,95,0.12)] bg-white/84 p-4 shadow-[0_10px_18px_rgba(60,70,49,0.04)]">
      <div className="flex items-center gap-2">
        <span className={cn('rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]', toneClass(tone))}>
          {tone === 'danger' ? 'Crítico' : tone === 'warning' ? 'Atención' : tone === 'success' ? 'Fuerte' : 'Lectura'}
        </span>
      </div>
      <h3 className="mt-3 text-base font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--foreground-soft)]">{body}</p>
    </article>
  );
}

function HighlightItem({
  label,
  title,
  value,
  helper
}: {
  label: string;
  title: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[22px] border border-[rgba(123,136,95,0.12)] bg-white/82 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">{label}</p>
      <h3 className="mt-3 text-lg font-semibold tracking-[-0.04em] text-[var(--foreground)]">{title}</h3>
      <p className="mt-2 text-base font-semibold text-[var(--accent-strong)]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--foreground-soft)]">{helper}</p>
    </div>
  );
}

export function AnalysisOverview({ data, currency }: { data: AnalysisSnapshot; currency: string }) {
  const maxCategory = Math.max(...data.categoryBreakdown.map((item) => item.value), 1);

  return (
    <div className="grid gap-5 min-w-0">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] min-w-0">
        <div className="surface-card rounded-[30px] px-5 py-5 md:px-6 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Análisis</p>
          <h1 className="mt-1 text-[1.8rem] font-semibold tracking-[-0.055em] text-[var(--foreground)]">Lectura financiera accionable</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--foreground-soft)]">
            Histórico interactivo, pulso del periodo y recomendaciones útiles basadas en tus números reales.
          </p>
        </div>

        <div className="surface-card rounded-[30px] p-5 shadow-[0_18px_34px_rgba(60,70,49,0.08)]">
          <div className="flex items-center gap-3">
            <div className="rounded-[18px] bg-[rgba(110,127,86,0.1)] p-3 text-[var(--accent-strong)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Asesor interno del negocio</p>
              <p className="mt-1 text-sm text-[var(--foreground-soft)]">Consejos generados con reglas sobre tu histórico, la caja y la presión de pagos.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardStatCard label="Gasto del mes" value={formatCurrency(data.stats.monthlyExpense, currency)} helper="Periodo actual" icon={Wallet} badge="Mes actual" tone="info" emphasis />
        <DashboardStatCard label="Pendiente" value={formatCurrency(data.stats.pendingAmount, currency)} helper="Facturas abiertas" icon={Receipt} badge="Cartera" tone="warning" />
        <DashboardStatCard label="Vencido" value={formatCurrency(data.stats.overdueAmount, currency)} helper="Fuera de plazo" icon={AlertTriangle} badge={data.stats.overdueAmount > 0 ? 'Atención' : 'Controlado'} tone={data.stats.overdueAmount > 0 ? 'danger' : 'success'} />
        <DashboardStatCard label="Entradas" value={formatCurrency(data.stats.currentMonthInflow, currency)} helper="Mes actual" icon={ArrowUpRight} badge="Cobros" tone="success" />
        <DashboardStatCard label="Saldo total" value={formatCurrency(data.stats.balance, currency)} helper="Tesorería consolidada" icon={Landmark} badge="Disponible" tone="success" />
      </section>

      <InteractiveAnalysisCharts chart={data.chart} currency={currency} />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] min-w-0">
        <section className="surface-card rounded-[30px] p-5 min-w-0">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Histórico y estacionalidad</p>
            <p className="mt-1 text-sm text-[var(--foreground-soft)]">Qué mes gana, cuál sufre y dónde has marcado tus mejores registros.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <HighlightItem
              label="Mejor mes absoluto"
              title={data.highlights.bestMonth?.label ?? 'Sin datos'}
              value={data.highlights.bestMonth ? formatCurrency(data.highlights.bestMonth.value, currency) : 'Sin actividad suficiente'}
              helper="Mes real con mejor beneficio dentro del histórico disponible."
            />
            <HighlightItem
              label="Peor mes absoluto"
              title={data.highlights.worstMonth?.label ?? 'Sin datos'}
              value={data.highlights.worstMonth ? formatCurrency(data.highlights.worstMonth.value, currency) : 'Sin actividad suficiente'}
              helper="Mes real con peor beneficio dentro del histórico disponible."
            />
            <HighlightItem
              label="Mejor mes típico"
              title={data.highlights.bestTypicalMonth ? `${data.highlights.bestTypicalMonth.label[0].toUpperCase()}${data.highlights.bestTypicalMonth.label.slice(1)} suele ser el mejor mes del año` : 'Sin histórico suficiente'}
              value={data.highlights.bestTypicalMonth ? formatCurrency(data.highlights.bestTypicalMonth.value, currency) : 'Aún no hay patrón estable'}
              helper={data.highlights.bestTypicalMonth ? `Promedio calculado con ${data.highlights.bestTypicalMonth.sampleCount} meses comparables del histórico.` : 'Necesitas más meses con actividad para sacar una tendencia fiable.'}
            />
            <HighlightItem
              label="Mes más flojo"
              title={data.highlights.worstTypicalMonth ? `${data.highlights.worstTypicalMonth.label[0].toUpperCase()}${data.highlights.worstTypicalMonth.label.slice(1)} suele ser el mes más flojo` : 'Sin histórico suficiente'}
              value={data.highlights.worstTypicalMonth ? formatCurrency(data.highlights.worstTypicalMonth.value, currency) : 'Aún no hay patrón estable'}
              helper={data.highlights.worstTypicalMonth ? `Promedio calculado con ${data.highlights.worstTypicalMonth.sampleCount} meses comparables del histórico.` : 'Necesitas más meses con actividad para sacar una tendencia fiable.'}
            />
            <HighlightItem
              label="Récord de ingresos"
              title={data.highlights.revenueRecord?.label ?? 'Sin datos'}
              value={data.highlights.revenueRecord ? formatCurrency(data.highlights.revenueRecord.value, currency) : 'Sin actividad suficiente'}
              helper="Mes con mayor entrada de dinero registrada en el histórico."
            />
            <HighlightItem
              label="Récord de beneficio"
              title={data.highlights.profitRecord?.label ?? 'Sin datos'}
              value={data.highlights.profitRecord ? formatCurrency(data.highlights.profitRecord.value, currency) : 'Sin actividad suficiente'}
              helper="Mes con mejor resultado neto entre ingresos y gastos."
            />
          </div>
        </section>

        <section className="surface-card rounded-[30px] p-5 min-w-0">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Recomendaciones</p>
            <p className="mt-1 text-sm text-[var(--foreground-soft)]">Acciones sugeridas según la caja, el gasto y la presión de pagos.</p>
          </div>
          <div className="grid gap-3">
            {data.insights.map((item, index) => (
              <InsightCard key={`${item.title}-${index}`} title={item.title} body={item.body} tone={item.tone} />
            ))}
          </div>
        </section>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] min-w-0">
        <section className="surface-card rounded-[30px] p-5 min-w-0">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Estado de facturas</p>
            <p className="mt-1 text-sm text-[var(--foreground-soft)]">Cartera y presión de pagos.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {data.invoiceSummary.map((item) => (
              <div key={item.label} className="rounded-[22px] border border-[rgba(123,136,95,0.12)] bg-white/82 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[var(--foreground)]">{item.label}</p>
                      <StatusPill label={`${item.count}`} tone={item.tone} />
                    </div>
                    <p className="mt-1 text-sm text-[var(--foreground-soft)]">{formatCurrency(item.amount, currency)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-card rounded-[30px] p-5 min-w-0">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Saldos por cuenta</p>
            <p className="mt-1 text-sm text-[var(--foreground-soft)]">Dónde está realmente la liquidez.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {data.accounts.map((account) => (
              <div key={account.id} className="rounded-[22px] border border-[rgba(123,136,95,0.12)] bg-white/82 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{account.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--foreground-muted)]">{account.type}</p>
                  </div>
                  <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--foreground)]">{formatCurrency(account.balance, currency)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="surface-card rounded-[30px] p-5 min-w-0">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Gasto por categoría</p>
          <p className="mt-1 text-sm text-[var(--foreground-soft)]">Peso del mes actual por bloques de gasto.</p>
        </div>

        {data.categoryBreakdown.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-[rgba(123,136,95,0.22)] bg-white/55 px-5 py-10 text-center">
            <p className="text-lg font-semibold text-[var(--foreground)]">Aún no hay gasto cargado este mes.</p>
            <p className="mt-2 text-sm text-[var(--foreground-soft)]">Cuando registres operaciones verás aquí la concentración real del negocio.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.categoryBreakdown.map((item) => (
              <div key={item.label} className="rounded-[22px] border border-[rgba(123,136,95,0.12)] bg-white/82 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="font-semibold text-[var(--foreground)]">{item.label}</span>
                  <span className="text-sm text-[var(--foreground-soft)]">{formatCurrency(item.value, currency)}</span>
                </div>
                <div className="h-2 rounded-full bg-[rgba(123,136,95,0.12)]">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.max((item.value / maxCategory) * 100, 8)}%`,
                      background: item.color ?? 'var(--accent)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
