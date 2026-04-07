import type { LucideIcon } from 'lucide-react';

import { SectionCard } from '@/components/ui/section-card';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  emphasis = false
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  emphasis?: boolean;
}) {
  return (
    <SectionCard className={cn('metric-glow min-h-[156px] p-5', emphasis && 'bg-[rgba(255,250,244,0.9)]')}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--foreground-soft)]">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-5 text-sm leading-6 text-[var(--foreground-soft)]">{helper}</p>
    </SectionCard>
  );
}
