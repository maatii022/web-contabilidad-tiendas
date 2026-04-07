import { ShieldCheck } from 'lucide-react';

export function MfaCallout() {
  return (
    <div className="rounded-[24px] border border-[rgba(123,136,95,0.14)] bg-[rgba(255,255,255,0.55)] p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(85,117,82,0.12)] text-[var(--success)]">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Autenticación reforzada</p>
          <p className="text-sm text-[var(--foreground-soft)]">La fase 2 ya deja la base lista para activar MFA en la cuenta administradora.</p>
        </div>
      </div>
    </div>
  );
}
