import { LockKeyhole, ShieldCheck, Sparkles, UserCog } from 'lucide-react';
import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/auth/login-form';
import { MfaCallout } from '@/components/auth/mfa-callout';
import { LogoMark } from '@/components/logo-mark';
import { SectionCard } from '@/components/ui/section-card';
import { getCurrentUser } from '@/lib/auth';
import { sanitizeNextPath } from '@/lib/utils';

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect('/dashboard');
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = sanitizeNextPath(firstValue(resolvedSearchParams?.next));

  return (
    <main className="px-4 py-6 md:px-6 xl:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1440px] gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard className="relative overflow-hidden border-none bg-[linear-gradient(180deg,rgba(255,251,246,0.94)_0%,rgba(248,242,232,0.88)_100%)] p-8 md:p-10">
          <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top_left,rgba(110,127,86,0.20),transparent_48%)]" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center gap-4">
              <LogoMark />
              <div>
                <p className="text-lg font-semibold text-[var(--foreground)]">Parafarm Neroli</p>
                <p className="text-sm text-[var(--foreground-soft)]">Control contable privado para tienda</p>
              </div>
            </div>

            <div className="mt-10 max-w-2xl">
              <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                Acceso seguro
              </span>
              <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-[var(--foreground)] md:text-5xl">
                Control contable privado, claro y seguro para la tienda.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-[var(--foreground-soft)] md:text-lg">
                Accede con una cuenta autorizada. El acceso público está desactivado y los datos quedan protegidos por autenticación, roles y políticas de acceso.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-[rgba(123,136,95,0.14)] bg-[rgba(255,255,255,0.6)] p-5">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-[var(--accent-strong)]" />
                  <p className="text-sm font-semibold text-[var(--foreground)]">Entorno claro</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground-soft)]">
                  Interfaz limpia, legible y preparada para el trabajo diario.
                </p>
              </div>
              <div className="rounded-[24px] border border-[rgba(123,136,95,0.14)] bg-[rgba(255,255,255,0.6)] p-5">
                <div className="flex items-center gap-3">
                  <LockKeyhole className="h-5 w-5 text-[var(--accent-strong)]" />
                  <p className="text-sm font-semibold text-[var(--foreground)]">Acceso privado</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground-soft)]">
                  Solo entran usuarios autorizados y vinculados al negocio.
                </p>
              </div>
            </div>

            <div className="mt-auto grid gap-4 pt-8 md:grid-cols-2">
              <div className="rounded-[24px] border border-[rgba(123,136,95,0.14)] bg-[rgba(255,255,255,0.62)] p-5">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-[var(--success)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">MFA disponible</p>
                    <p className="text-sm text-[var(--foreground-soft)]">Recomendado para admin</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[24px] border border-[rgba(123,136,95,0.14)] bg-[rgba(255,255,255,0.62)] p-5">
                <div className="flex items-center gap-3">
                  <UserCog className="h-5 w-5 text-[var(--accent-strong)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">Roles preparados</p>
                    <p className="text-sm text-[var(--foreground-soft)]">Admin, gestor y lectura</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard className="self-center p-8 md:p-10">
          <span className="inline-flex rounded-full bg-[rgba(255,255,255,0.76)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
            Área privada
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">Iniciar sesión</h2>
          <p className="mt-3 text-base leading-7 text-[var(--foreground-soft)]">
            Usa una cuenta autorizada por el administrador. El acceso público queda desactivado desde el planteamiento de producto.
          </p>

          <LoginForm nextPath={nextPath} />
          <div className="mt-6">
            <MfaCallout />
          </div>
        </SectionCard>
      </div>
    </main>
  );
}
