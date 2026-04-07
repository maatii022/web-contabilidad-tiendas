import type { ReactNode } from 'react';

import { AppShell } from '@/components/app-shell';
import { requireAppContext } from '@/lib/app-access';

export default async function PrivateLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const appContext = await requireAppContext();

  return <AppShell appContext={appContext}>{children}</AppShell>;
}
