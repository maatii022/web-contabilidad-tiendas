import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function SectionCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn('surface-card rounded-[var(--radius-xl)] p-5 md:p-6', className)}
      {...props}
    />
  );
}
