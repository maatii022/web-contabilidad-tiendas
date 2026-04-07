import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function Field({
  label,
  error,
  hint,
  children,
  className
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('grid gap-2 text-sm text-[var(--foreground-soft)]', className)}>
      <span className="font-medium text-[var(--foreground)]">{label}</span>
      {children}
      {error ? <span className="text-xs font-medium text-[var(--danger)]">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-[var(--foreground-muted)]">{hint}</span> : null}
    </label>
  );
}

export function inputClassName(hasError = false) {
  return cn(
    'h-11 w-full rounded-2xl border bg-white/80 px-4 text-sm text-[var(--foreground)] transition placeholder:text-[var(--foreground-muted)] focus:border-[rgba(110,127,86,0.28)]',
    hasError ? 'border-[rgba(155,91,83,0.38)]' : 'border-[rgba(123,136,95,0.16)]'
  );
}

export function textareaClassName(hasError = false) {
  return cn(
    'min-h-[96px] w-full rounded-[22px] border bg-white/80 px-4 py-3 text-sm text-[var(--foreground)] transition placeholder:text-[var(--foreground-muted)] focus:border-[rgba(110,127,86,0.28)]',
    hasError ? 'border-[rgba(155,91,83,0.38)]' : 'border-[rgba(123,136,95,0.16)]'
  );
}
