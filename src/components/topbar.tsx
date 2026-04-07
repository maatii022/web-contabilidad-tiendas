import { Building2, ShieldCheck } from 'lucide-react';

import { LogoutForm } from '@/components/auth/logout-form';
import { getRoleLabel } from '@/lib/app-access';
import type { Database } from '@/types/database';

export function Topbar({
  name,
  email,
  businessName,
  role,
  timezone
}: {
  name: string;
  email: string;
  businessName: string;
  role: Database['public']['Enums']['app_role'];
  timezone: string;
}) {
  const today = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    timeZone: timezone
  }).format(new Date());

  return (
    <header className="glass-panel rounded-[28px] border border-[var(--panel-border)] px-4 py-3 md:px-5 xl:px-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm capitalize text-[var(--foreground-soft)]">{today}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="truncate text-lg font-semibold tracking-[-0.03em] text-[var(--foreground)]">{businessName}</p>
              <span className="rounded-full bg-[rgba(110,127,86,0.1)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
                {getRoleLabel(role)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-end">
          <div className="flex min-w-0 items-center gap-3 rounded-full border border-[rgba(123,136,95,0.14)] bg-[rgba(255,255,255,0.7)] px-3 py-2 shadow-[0_10px_20px_rgba(60,70,49,0.04)]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-white">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--foreground)]">{name}</p>
              <p className="truncate text-xs text-[var(--foreground-soft)]">{email}</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(85,117,82,0.12)] px-4 py-2 text-sm font-semibold text-[var(--success)]">
            <ShieldCheck className="h-4 w-4" />RLS activa
          </div>
          <LogoutForm />
        </div>
      </div>
    </header>
  );
}
