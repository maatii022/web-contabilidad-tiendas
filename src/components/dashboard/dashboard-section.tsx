import type { ReactNode } from 'react';

import { SectionCard } from '@/components/ui/section-card';
import { cn } from '@/lib/utils';

export function DashboardSection({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  contentClassName
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <SectionCard className={cn('p-5 md:p-6', className)}>
      <div className="flex flex-col gap-3 border-b border-[rgba(123,136,95,0.1)] pb-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">{eyebrow}</p> : null}
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{title}</h2>
          {description ? <p className="mt-1 text-sm text-[var(--foreground-soft)]">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn('mt-5', contentClassName)}>{children}</div>
    </SectionCard>
  );
}
