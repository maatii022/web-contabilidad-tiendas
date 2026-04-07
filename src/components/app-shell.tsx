import type { ReactNode } from 'react';

import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import type { ActiveAppContext } from '@/lib/app-access';

export function AppShell({ children, appContext }: Readonly<{ children: ReactNode; appContext: ActiveAppContext; }>) {
  return (
    <main className="px-4 py-4 md:px-6 xl:px-8 xl:py-6">
      <div className="mx-auto grid max-w-[1500px] gap-5 xl:grid-cols-[252px_minmax(0,1fr)]">
        <Sidebar businessName={appContext.business.name} businessSlug={appContext.business.slug} />
        <div className="min-w-0">
          <Topbar
            name={appContext.user.name}
            email={appContext.user.email}
            businessName={appContext.business.name}
            role={appContext.membership.role}
            timezone={appContext.business.timezone}
          />
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </main>
  );
}
