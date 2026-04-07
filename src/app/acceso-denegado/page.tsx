import { ShieldAlert } from 'lucide-react';

import { LogoutForm } from '@/components/auth/logout-form';
import { LogoMark } from '@/components/logo-mark';

export default function AccessDeniedPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-16">
      <section className="glass-panel w-full rounded-[36px] border border-[var(--panel-border)] p-8 md:p-10">
        <div className="flex items-center gap-4">
          <LogoMark />
          <div>
            <p className="text-base font-semibold text-[var(--foreground)]">Parafarm Neroli</p>
            <p className="text-sm text-[var(--foreground-soft)]">Acceso privado con membresía obligatoria</p>
          </div>
        </div>

        <div className="mt-8 flex h-14 w-14 items-center justify-center rounded-3xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          <ShieldAlert className="h-6 w-6" />
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
          Tu usuario existe, pero todavía no tiene acceso a ningún negocio.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--foreground-soft)]">
          Esto suele pasar cuando el usuario existe en Supabase Auth, pero todavía no está vinculado a la tienda en business_users.
        </p>

        <div className="mt-8 rounded-[28px] border border-[rgba(123,136,95,0.14)] bg-[rgba(255,255,255,0.58)] p-6">
          <ol className="space-y-3 text-sm leading-6 text-[var(--foreground-soft)]">
            <li>1. Crea o verifica el usuario en Supabase Auth.</li>
            <li>2. Ejecuta la migración de fase 2.</li>
            <li>3. Ejecuta el script bootstrap y asigna ese usuario a la tienda como admin.</li>
            <li>4. Vuelve a entrar con esa misma cuenta.</li>
          </ol>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <LogoutForm />
        </div>
      </section>
    </main>
  );
}
