import { BriefcaseBusiness, LockKeyhole, Store, UserRoundCheck } from 'lucide-react';

import { CategoryManager } from '@/components/settings/category-manager';
import { VendorManager } from '@/components/settings/vendor-manager';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { getSettingsWorkspaceData } from '@/features/settings/queries';
import { requireAppContext } from '@/lib/app-access';

export default async function ConfiguracionPage() {
  const appContext = await requireAppContext();
  const data = await getSettingsWorkspaceData(appContext.business.id);

  return (
    <div className="page-grid gap-6">
      <PageHeader title="Configuración" description="Gestiona proveedores, categorías y base operativa del negocio." />

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="grid gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)] shadow-[0_10px_18px_rgba(60,70,49,0.08)]">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Negocio activo</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--foreground-soft)]">{appContext.business.name}, {appContext.business.currency}, {appContext.business.timezone}.</p>
            </div>
          </div>
          <p className="text-sm leading-6 text-[var(--foreground-soft)]">Aquí centralizas los catálogos que luego usarás al registrar facturas, gastos y movimientos.</p>
        </Card>

        <Card className="grid gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)] shadow-[0_10px_18px_rgba(60,70,49,0.08)]">
              <UserRoundCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Acceso y membresía</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--foreground-soft)]">{appContext.user.email}, rol {appContext.membership.role}.</p>
            </div>
          </div>
          <p className="text-sm leading-6 text-[var(--foreground-soft)]">Solo miembros activos del negocio pueden ver y editar esta información.</p>
        </Card>

        <Card className="grid gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)] shadow-[0_10px_18px_rgba(60,70,49,0.08)]">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Base segura</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--foreground-soft)]">RLS activo, adjuntos privados y acceso cerrado sin alta pública.</p>
            </div>
          </div>
          <p className="text-sm leading-6 text-[var(--foreground-soft)]">Tu trabajo diario se apoya en estos catálogos, así que mantenerlos ordenados evita errores al registrar datos.</p>
        </Card>
      </section>

      <section className="grid gap-6">
        <VendorManager providers={data.providers} />
        <CategoryManager categories={data.categories} />
        <Card className="grid gap-3 lg:grid-cols-2">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)] shadow-[0_10px_18px_rgba(60,70,49,0.08)]">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Qué controlas desde aquí</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--foreground-soft)]">Proveedores para buscarlos al escribir una factura o un gasto, y categorías para clasificar cada salida correctamente.</p>
            </div>
          </div>
          <div className="rounded-[24px] border border-[rgba(123,136,95,0.12)] bg-[rgba(255,255,255,0.55)] px-5 py-4 text-sm leading-6 text-[var(--foreground-soft)]">
            Si en el futuro abrimos multiusuario o ajustes fiscales, esta será también la base para permisos, datos del negocio y parámetros generales.
          </div>
        </Card>
      </section>
    </div>
  );
}
