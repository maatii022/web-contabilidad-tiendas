import { LogOut } from 'lucide-react';

import { logoutAction } from '@/app/(app)/actions';

export function LogoutForm() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="inline-flex h-10 items-center gap-2 rounded-full border border-[rgba(123,136,95,0.16)] bg-[rgba(255,255,255,0.74)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white"
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </button>
    </form>
  );
}
