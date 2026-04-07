'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { CircleOff, PencilLine, Search, Tags, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Field, inputClassName } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { deleteCategoryAction, toggleCategoryActiveAction, upsertCategoryAction } from '@/features/settings/actions';
import { settingsFormInitialState, type SettingsCategoryItem } from '@/features/settings/types';

export function CategoryManager({ categories }: { categories: SettingsCategoryItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<SettingsCategoryItem | null>(null);
  const [state, formAction, pending] = useActionState(upsertCategoryAction, settingsFormInitialState);

  useEffect(() => {
    if (state.status === 'success') {
      setEditing(null);
      router.refresh();
    }
  }, [router, state.status]);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es-ES');
    if (!normalizedQuery) {
      return categories;
    }
    return categories.filter((category) => category.name.toLocaleLowerCase('es-ES').includes(normalizedQuery));
  }, [categories, query]);

  return (
    <Card className="grid gap-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Categorías de gasto</h2>
          <p className="text-sm text-[var(--foreground-soft)]">Controla aquí los tipos de gasto que verás al registrar un movimiento.</p>
        </div>
        <div className="relative w-full md:max-w-[260px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className={inputClassName() + ' pl-10'} placeholder="Buscar categoría" />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <form action={formAction} className="grid gap-4 rounded-[24px] border border-[rgba(123,136,95,0.12)] bg-[rgba(255,255,255,0.58)] p-4">
          <input type="hidden" name="categoryId" value={editing?.id ?? ''} readOnly />
          <Field label="Nombre" error={state.fieldErrors?.name}>
            <input className={inputClassName(Boolean(state.fieldErrors?.name))} name="name" placeholder="Ej. Proveedores" defaultValue={editing?.name ?? ''} key={`category-name-${editing?.id ?? 'new'}`} />
          </Field>
          <Field label="Color" error={state.fieldErrors?.color} hint="Hexadecimal, por ejemplo #7b885f.">
            <input className={inputClassName(Boolean(state.fieldErrors?.color))} name="color" placeholder="#7b885f" defaultValue={editing?.color ?? '#7b885f'} key={`category-color-${editing?.id ?? 'new'}`} />
          </Field>
          <Field label="Icono interno" error={state.fieldErrors?.icon} hint="Opcional, para mantener consistencia futura.">
            <input className={inputClassName(Boolean(state.fieldErrors?.icon))} name="icon" placeholder="Ej. tags" defaultValue={editing?.icon ?? ''} key={`category-icon-${editing?.id ?? 'new'}`} />
          </Field>
          {state.message ? (
            <div className={state.status === 'error' ? 'rounded-[18px] bg-[rgba(155,91,83,0.1)] px-4 py-3 text-sm text-[var(--danger)]' : 'rounded-[18px] bg-[rgba(85,117,82,0.1)] px-4 py-3 text-sm text-[var(--success)]'}>{state.message}</div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 border-t border-[rgba(123,136,95,0.12)] pt-4">
            <Button type="submit" disabled={pending}>{pending ? 'Guardando...' : editing ? 'Guardar categoría' : 'Crear categoría'}</Button>
            {editing ? <Button variant="secondary" onClick={() => setEditing(null)} disabled={pending}>Cancelar edición</Button> : null}
          </div>
        </form>

        <div className="grid gap-3">
          {filteredCategories.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[rgba(123,136,95,0.18)] bg-[rgba(255,255,255,0.46)] px-5 py-6 text-sm text-[var(--foreground-soft)]">
              No hay categorías que coincidan con tu búsqueda.
            </div>
          ) : (
            filteredCategories.map((category) => {
              const canDelete = category.expenseCount === 0;
              return (
                <div key={category.id} className="rounded-[24px] border border-[rgba(123,136,95,0.12)] bg-[rgba(255,255,255,0.56)] px-5 py-4 shadow-[0_10px_24px_rgba(60,70,49,0.04)]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-[0_10px_18px_rgba(60,70,49,0.08)]" style={{ backgroundColor: category.color ?? '#7b885f' }}>
                          <Tags className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-[var(--foreground)]">{category.name}</h3>
                          <p className="text-xs uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
                            {category.isActive ? 'Activa' : 'Inactiva'} · {category.expenseCount} gasto{category.expenseCount === 1 ? '' : 's'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="secondary" onClick={() => setEditing(category)}>
                        <PencilLine className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <form action={toggleCategoryActiveAction}>
                        <input type="hidden" name="categoryId" value={category.id} />
                        <input type="hidden" name="nextState" value={category.isActive ? 'inactive' : 'active'} />
                        <Button variant="ghost" type="submit">
                          <CircleOff className="mr-2 h-4 w-4" />
                          {category.isActive ? 'Desactivar' : 'Activar'}
                        </Button>
                      </form>
                      <form action={deleteCategoryAction}>
                        <input type="hidden" name="categoryId" value={category.id} />
                        <Button variant="ghost" type="submit" disabled={!canDelete} title={canDelete ? 'Eliminar categoría' : 'No se puede borrar si ya tiene gastos'}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}
