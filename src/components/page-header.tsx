import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  actions,
  eyebrow
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[26px] border border-[rgba(123,136,95,0.12)] bg-[rgba(255,255,255,0.52)] px-4 py-4 shadow-[0_12px_28px_rgba(60,70,49,0.04)] md:flex-row md:items-center md:justify-between md:px-5">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[1.7rem] font-semibold tracking-[-0.045em] text-[var(--foreground)] md:text-[2.05rem]">
          {title}
        </h1>
        {description ? <p className="mt-1 text-sm text-[var(--foreground-soft)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </div>
  );
}
