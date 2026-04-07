'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { LogoMark } from '@/components/logo-mark';
import { navigationItems } from '@/lib/nav';
import { cn } from '@/lib/utils';

export function Sidebar({ businessName, businessSlug }: { businessName: string; businessSlug: string }) {
  const pathname = usePathname();

  return (
    <aside className="glass-panel sticky top-4 hidden h-[calc(100vh-2rem)] min-w-0 flex-col rounded-[30px] border border-[var(--panel-border)] px-4 py-4 xl:flex">
      <div className="flex items-center gap-3 border-b border-[rgba(123,136,95,0.12)] px-2 pb-4">
        <LogoMark />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[var(--foreground)]">{businessName}</p>
          <p className="truncate text-sm text-[var(--foreground-soft)]">{businessSlug}</p>
        </div>
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-1.5">
        {navigationItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 rounded-[20px] px-3 py-3 text-sm font-medium transition',
                isActive
                  ? 'bg-[rgba(110,127,86,0.14)] text-[var(--accent-strong)] shadow-[inset_0_0_0_1px_rgba(110,127,86,0.08)]'
                  : 'text-[var(--foreground-soft)] hover:bg-[rgba(110,127,86,0.08)] hover:text-[var(--foreground)]'
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-2xl transition',
                  isActive
                    ? 'bg-white text-[var(--accent-strong)] shadow-[0_12px_24px_rgba(83,99,65,0.1)]'
                    : 'bg-[rgba(255,255,255,0.68)] text-[var(--foreground-soft)] group-hover:bg-white'
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="rounded-[22px] border border-[rgba(123,136,95,0.14)] bg-[rgba(255,255,255,0.62)] px-4 py-3 text-sm text-[var(--foreground-soft)] shadow-[0_10px_24px_rgba(60,70,49,0.04)]">
        Sesión privada activa
      </div>
    </aside>
  );
}
