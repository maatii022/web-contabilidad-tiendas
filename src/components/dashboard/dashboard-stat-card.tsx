import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

import { StatusPill, type StatusPillTone } from '@/components/dashboard/status-pill';
import { SectionCard } from '@/components/ui/section-card';
import { cn } from '@/lib/utils';

export function DashboardStatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = 'neutral',
  badge,
  emphasis = false,
  href
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: StatusPillTone;
  badge?: string;
  emphasis?: boolean;
  href?: string;
}) {
  const content = (
    <SectionCard
      className={cn(
        'dashboard-surface relative min-h-[164px] overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(60,70,49,0.08)] md:p-6',
        emphasis && 'metric-glow shadow-[0_24px_44px_rgba(83,99,65,0.14)]',
        href && 'cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--foreground-soft)]">{label}</p>
          <p className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-[var(--foreground)]">{value}</p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(110,127,86,0.14)] text-[var(--accent-strong)] shadow-[0_12px_24px_rgba(83,99,65,0.08)]">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-5 flex items-center gap-2">{badge ? <StatusPill label={badge} tone={tone} /> : null}</div>
      <p className="mt-3 text-sm leading-6 text-[var(--foreground-soft)]">{helper}</p>
    </SectionCard>
  );

  if (!href) return content;
  return <Link href={href} className="block">{content}</Link>;
}
