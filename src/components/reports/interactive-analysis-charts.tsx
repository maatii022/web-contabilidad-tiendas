'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BarChart3 } from 'lucide-react';

import type { AnalysisChartPoint, AnalysisSnapshot } from '@/features/reports/queries';
import { cn, formatCurrency } from '@/lib/utils';

type ViewMode = 'monthly' | 'annual' | 'total';
type MetricMode = 'expenses' | 'inflow' | 'profit';

const viewLabels: Record<ViewMode, string> = {
  monthly: 'Mensual',
  annual: 'Anual',
  total: 'Histórico'
};

const metricLabels: Record<MetricMode, string> = {
  expenses: 'Gastos',
  inflow: 'Ingresos',
  profit: 'Beneficio'
};

function metricTone(metric: MetricMode, negative = false) {
  if (metric === 'expenses') return 'var(--warning)';
  if (metric === 'inflow') return 'var(--success)';
  if (metric === 'profit' && negative) return 'var(--danger)';
  return 'var(--accent)';
}

function getMetricValue(point: AnalysisChartPoint, metric: MetricMode) {
  if (metric === 'expenses') return point.expenses;
  if (metric === 'inflow') return point.inflow;
  return point.profit;
}

function defaultSelectedIndex(series: AnalysisChartPoint[], metric: MetricMode) {
  const lastNonZero = [...series].reverse().findIndex((item) => Math.abs(getMetricValue(item, metric)) > 0.009);
  if (lastNonZero === -1) {
    return Math.max(series.length - 1, 0);
  }

  return series.length - 1 - lastNonZero;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function ChartPill({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-4 py-2 text-sm font-medium transition',
        active
          ? 'bg-[var(--accent)] text-white shadow-[0_12px_22px_rgba(83,99,65,0.18)]'
          : 'bg-white/80 text-[var(--foreground-soft)] hover:bg-white hover:text-[var(--foreground)]'
      )}
    >
      {children}
    </button>
  );
}

export function InteractiveAnalysisCharts({
  chart,
  currency
}: {
  chart: AnalysisSnapshot['chart'];
  currency: string;
}) {
  const [view, setView] = useState<ViewMode>('annual');
  const [metric, setMetric] = useState<MetricMode>('expenses');

  const series = chart[view];
  const [selectedIndex, setSelectedIndex] = useState(() => defaultSelectedIndex(series, metric));

  useEffect(() => {
    setSelectedIndex(defaultSelectedIndex(chart[view], metric));
  }, [chart, view, metric]);

  const values = useMemo(() => series.map((point) => getMetricValue(point, metric)), [metric, series]);
  const selectedPoint = series[selectedIndex] ?? series[series.length - 1] ?? null;
  const selectedValue = selectedPoint ? getMetricValue(selectedPoint, metric) : 0;
  const maxAbsValue = Math.max(...values.map((value) => Math.abs(value)), 1);
  const hasNegative = values.some((value) => value < 0);
  const isSignedMetric = metric === 'profit' || hasNegative;
  const totalValue = values.reduce((sum, value) => sum + value, 0);
  const averageValue = average(values);
  const peakPoint = series.reduce<AnalysisChartPoint | null>((best, point) => {
    if (!best) return point;
    return getMetricValue(point, metric) > getMetricValue(best, metric) ? point : best;
  }, null);
  const peakValue = peakPoint ? getMetricValue(peakPoint, metric) : 0;
  const variation = selectedIndex > 0 ? selectedValue - values[selectedIndex - 1] : 0;

  return (
    <section className="surface-card min-w-0 overflow-hidden rounded-[30px] p-5 md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Gráfico general</p>
          <h2 className="mt-1 text-[1.55rem] font-semibold tracking-[-0.05em] text-[var(--foreground)]">Vista dinámica del negocio</h2>
          <p className="mt-2 text-sm text-[var(--foreground-soft)]">Selecciona horizonte y métrica para leer cómo se mueve la tienda.</p>
        </div>

        <div className="grid gap-3 xl:max-w-[520px] xl:justify-items-end">
          <div className="flex flex-wrap gap-2 xl:justify-end">
            {(['monthly', 'annual', 'total'] as ViewMode[]).map((option) => (
              <ChartPill key={option} active={view === option} onClick={() => setView(option)}>
                {viewLabels[option]}
              </ChartPill>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 xl:justify-end">
            {(['expenses', 'inflow', 'profit'] as MetricMode[]).map((option) => (
              <ChartPill key={option} active={metric === option} onClick={() => setMetric(option)}>
                {metricLabels[option]}
              </ChartPill>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[22px] border border-[rgba(123,136,95,0.14)] bg-white/82 p-4">
          <p className="text-sm text-[var(--foreground-soft)]">Periodo seleccionado</p>
          <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{formatCurrency(totalValue, currency)}</p>
        </div>
        <div className="rounded-[22px] border border-[rgba(123,136,95,0.14)] bg-white/82 p-4">
          <p className="text-sm text-[var(--foreground-soft)]">Media</p>
          <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{formatCurrency(averageValue, currency)}</p>
        </div>
        <div className="rounded-[22px] border border-[rgba(123,136,95,0.14)] bg-white/82 p-4">
          <p className="text-sm text-[var(--foreground-soft)]">Pico</p>
          <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{formatCurrency(peakValue, currency)}</p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">{peakPoint?.label ?? 'Sin datos'}</p>
        </div>
        <div className="rounded-[22px] border border-[rgba(123,136,95,0.14)] bg-white/82 p-4">
          <p className="text-sm text-[var(--foreground-soft)]">Tramo activo</p>
          <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{selectedPoint?.label ?? 'Sin datos'}</p>
          <p className={cn('mt-1 text-xs font-medium', variation >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]')}>
            {selectedIndex > 0 ? `${variation >= 0 ? '+' : ''}${formatCurrency(variation, currency)} vs anterior` : 'Punto inicial de la serie'}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-[28px] border border-[rgba(123,136,95,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,251,246,0.92))] p-5 shadow-[0_18px_32px_rgba(60,70,49,0.06)] min-w-0 overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">{viewLabels[view]} · {metricLabels[metric]}</p>
            <p className="mt-1 text-sm text-[var(--foreground-soft)]">Pulsa una barra para ver el valor exacto de ese tramo.</p>
          </div>
          <BarChart3 className="h-5 w-5 shrink-0 text-[var(--foreground-muted)]" />
        </div>

        <div className="mt-6 overflow-x-auto pb-2 no-scrollbar">
          <div className="relative px-2" style={{ minWidth: `${Math.max(series.length * 42 + 120, 760)}px` }}>
            <div className="relative h-[300px]">
              {isSignedMetric ? <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-[rgba(123,136,95,0.16)]" /> : <div className="pointer-events-none absolute inset-x-0 bottom-11 h-px bg-[rgba(123,136,95,0.08)]" />}

              <div className="absolute inset-x-0 top-0 bottom-11 flex items-end gap-3">
                {series.map((point, index) => {
                  const value = getMetricValue(point, metric);
                  const isActive = index === selectedIndex;
                  const maxHeight = isSignedMetric ? 34 : 72;
                  const scaledHeight = Math.max((Math.abs(value) / maxAbsValue) * maxHeight, Math.abs(value) > 0 ? 6 : 2);
                  const color = metricTone(metric, value < 0);
                  const bubbleClass = cn(
                    'absolute left-1/2 z-10 -translate-x-1/2 rounded-full border border-[rgba(123,136,95,0.16)] bg-white px-3 py-1 text-xs font-semibold tracking-[-0.02em] shadow-[0_10px_18px_rgba(60,70,49,0.08)] transition-all duration-300 ease-out whitespace-nowrap',
                    isActive ? 'opacity-100' : 'pointer-events-none opacity-0'
                  );

                  return (
                    <button
                      key={point.key}
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      className={cn(
                        'group relative flex h-full shrink-0 flex-col items-center justify-end text-center transition-all duration-300 ease-out',
                        isActive ? 'w-[92px]' : 'w-[28px]'
                      )}
                      title={`${point.label}: ${formatCurrency(value, currency)}`}
                    >
                      <div className="relative h-full w-full overflow-visible">
                        {isActive ? (
                          <div
                            className={bubbleClass}
                            style={
                              value < 0 && isSignedMetric
                                ? { top: `calc(50% + ${scaledHeight}% + 12px)` }
                                : isSignedMetric
                                  ? { bottom: `calc(50% + ${scaledHeight}% + 12px)` }
                                  : { bottom: `calc(11px + ${scaledHeight}% + 12px)` }
                            }
                          >
                            {formatCurrency(value, currency)}
                          </div>
                        ) : null}

                        {isSignedMetric ? (
                          value >= 0 ? (
                            <div
                              className={cn(
                                'absolute bottom-1/2 left-1/2 -translate-x-1/2 rounded-t-[18px] transition-all duration-300 ease-out',
                                isActive ? 'w-8 shadow-[0_12px_20px_rgba(83,99,65,0.15)]' : 'w-4 opacity-85 group-hover:opacity-100'
                              )}
                              style={{ height: `${scaledHeight}%`, background: color }}
                            />
                          ) : (
                            <div
                              className={cn(
                                'absolute top-1/2 left-1/2 -translate-x-1/2 rounded-b-[18px] transition-all duration-300 ease-out',
                                isActive ? 'w-8 shadow-[0_12px_20px_rgba(83,99,65,0.15)]' : 'w-4 opacity-85 group-hover:opacity-100'
                              )}
                              style={{ height: `${scaledHeight}%`, background: color }}
                            />
                          )
                        ) : (
                          <div
                            className={cn(
                              'absolute bottom-11 left-1/2 -translate-x-1/2 rounded-t-[18px] transition-all duration-300 ease-out',
                              isActive ? 'w-8 shadow-[0_12px_20px_rgba(83,99,65,0.15)]' : 'w-4 opacity-85 group-hover:opacity-100'
                            )}
                            style={{ height: `${scaledHeight}%`, background: color }}
                          />
                        )}
                      </div>

                      <p className={cn('mt-3 text-[11px] font-semibold uppercase tracking-[0.14em]', isActive ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)]')}>
                        {point.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-[22px] border border-[rgba(123,136,95,0.14)] bg-white/82 p-4">
          <p className="text-sm text-[var(--foreground-soft)]">Tramo activo</p>
          <p className="mt-2 text-base font-semibold text-[var(--foreground)]">{selectedPoint?.label ?? 'Sin datos disponibles'}</p>
          <p className={cn('mt-2 text-xl font-semibold tracking-[-0.04em]', selectedValue >= 0 ? 'text-[var(--foreground)]' : 'text-[var(--danger)]')}>
            {formatCurrency(selectedValue, currency)}
          </p>
        </div>
        <div className="rounded-[22px] border border-[rgba(123,136,95,0.14)] bg-white/82 p-4">
          <p className="text-sm text-[var(--foreground-soft)]">Ritmo medio</p>
          <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{formatCurrency(averageValue, currency)}</p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">Promedio de la serie actual</p>
        </div>
        <div className="rounded-[22px] border border-[rgba(123,136,95,0.14)] bg-white/82 p-4">
          <p className="text-sm text-[var(--foreground-soft)]">Variación</p>
          <p className={cn('mt-2 text-xl font-semibold tracking-[-0.04em]', variation >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]')}>
            {selectedIndex > 0 ? `${variation >= 0 ? '+' : ''}${formatCurrency(variation, currency)}` : '—'}
          </p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">Respecto al tramo anterior</p>
        </div>
      </div>
    </section>
  );
}
