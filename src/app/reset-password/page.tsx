import Link from 'next/link';

import { SectionCard } from '@/components/ui/section-card';

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <SectionCard className="max-w-lg p-8">
        <span className="mb-3 inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-semibold text-[var(--accent-strong)]">
          Acceso seguro
        </span>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">Restablecimiento pendiente de la fase 2</h1>
        <p className="mt-4 text-base leading-7 text-[var(--foreground-soft)]">
          La pantalla de recuperación queda reservada para cuando conectemos el flujo completo de autenticación y correos de Supabase.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
        >
          Volver al inicio de sesión
        </Link>
      </SectionCard>
    </main>
  );
}
