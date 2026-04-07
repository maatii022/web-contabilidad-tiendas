'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getOptionalTextEntry, getTextEntry } from '@/features/expenses/helpers';
import { requireManageContext } from '@/features/operations/shared';
import type { SettingsFormState } from '@/features/settings/types';
import { createClient } from '@/lib/supabase/server';

const providerSchema = z.object({
  providerId: z.string().uuid('Proveedor inválido.').optional().or(z.literal('')),
  name: z.string().min(2, 'Indica un nombre válido.').max(120, 'Nombre demasiado largo.'),
  taxId: z.string().max(40, 'NIF demasiado largo.').optional().or(z.literal('')),
  email: z.string().email('Email inválido.').max(120, 'Email demasiado largo.').optional().or(z.literal('')),
  phone: z.string().max(40, 'Teléfono demasiado largo.').optional().or(z.literal('')),
  notes: z.string().max(800, 'Las notas son demasiado largas.').optional().or(z.literal(''))
});

const categorySchema = z.object({
  categoryId: z.string().uuid('Categoría inválida.').optional().or(z.literal('')),
  name: z.string().min(2, 'Indica un nombre válido.').max(80, 'Nombre demasiado largo.'),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, 'Usa un color hexadecimal válido.')
    .optional()
    .or(z.literal('')),
  icon: z.string().max(40, 'Icono demasiado largo.').optional().or(z.literal(''))
});

function buildFieldErrors(error: z.ZodError) {
  return error.issues.reduce<Record<string, string>>((acc, issue) => {
    const field = typeof issue.path[0] === 'string' ? issue.path[0] : 'form';
    if (!acc[field]) {
      acc[field] = issue.message;
    }
    return acc;
  }, {});
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase('es-ES');
}

async function revalidateSettingsPages() {
  revalidatePath('/configuracion');
  revalidatePath('/gastos');
  revalidatePath('/facturas');
  revalidatePath('/dashboard');
}

export async function upsertVendorAction(_prevState: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  try {
    const appContext = await requireManageContext();
    const supabase = await createClient();

    const parsed = providerSchema.safeParse({
      providerId: getTextEntry(formData, 'providerId'),
      name: getTextEntry(formData, 'name'),
      taxId: getTextEntry(formData, 'taxId'),
      email: getTextEntry(formData, 'email'),
      phone: getTextEntry(formData, 'phone'),
      notes: getTextEntry(formData, 'notes')
    });

    if (!parsed.success) {
      return {
        status: 'error',
        message: 'Revisa los campos marcados.',
        fieldErrors: buildFieldErrors(parsed.error)
      };
    }

    const values = parsed.data;
    const normalizedName = normalizeName(values.name);

    const { data: existingRows } = await supabase
      .from('vendors')
      .select('id, name')
      .eq('business_id', appContext.business.id)
      .ilike('name', values.name.trim());

    const duplicate = ((existingRows ?? []) as Array<{ id: string; name: string }>).find((row) => normalizeName(row.name) === normalizedName && row.id !== values.providerId);

    if (duplicate) {
      return {
        status: 'error',
        message: 'Ya existe un proveedor con ese nombre.',
        fieldErrors: { name: 'Ya existe un proveedor con ese nombre.' }
      };
    }

    const payload = {
      business_id: appContext.business.id,
      name: values.name.trim(),
      tax_id: getOptionalTextEntry(formData, 'taxId'),
      email: getOptionalTextEntry(formData, 'email'),
      phone: getOptionalTextEntry(formData, 'phone'),
      notes: getOptionalTextEntry(formData, 'notes')
    };

    if (values.providerId) {
      const { error } = await supabase.from('vendors').update(payload).eq('id', values.providerId).eq('business_id', appContext.business.id);
      if (error) {
        return { status: 'error', message: 'No se pudo actualizar el proveedor.' };
      }
    } else {
      const { error } = await supabase.from('vendors').insert(payload);
      if (error) {
        return { status: 'error', message: 'No se pudo crear el proveedor.' };
      }
    }

    await revalidateSettingsPages();

    return {
      status: 'success',
      message: values.providerId ? 'Proveedor actualizado.' : 'Proveedor creado.'
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'No se pudo guardar el proveedor.'
    };
  }
}

export async function deleteVendorAction(formData: FormData) {
  const appContext = await requireManageContext();
  const supabase = await createClient();
  const providerId = getTextEntry(formData, 'providerId');

  if (!providerId) {
    throw new Error('Falta el proveedor.');
  }

  const [{ count: expensesCount }, { count: invoicesCount }] = await Promise.all([
    supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('business_id', appContext.business.id).eq('vendor_id', providerId),
    supabase.from('purchase_invoices').select('id', { count: 'exact', head: true }).eq('business_id', appContext.business.id).eq('vendor_id', providerId)
  ]);

  if ((expensesCount ?? 0) > 0 || (invoicesCount ?? 0) > 0) {
    throw new Error('No puedes borrar un proveedor con gastos o facturas asociados.');
  }

  const { error } = await supabase.from('vendors').delete().eq('id', providerId).eq('business_id', appContext.business.id);

  if (error) {
    throw new Error('No se pudo eliminar el proveedor.');
  }

  await revalidateSettingsPages();
}

export async function upsertCategoryAction(_prevState: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  try {
    const appContext = await requireManageContext();
    const supabase = await createClient();

    const parsed = categorySchema.safeParse({
      categoryId: getTextEntry(formData, 'categoryId'),
      name: getTextEntry(formData, 'name'),
      color: getTextEntry(formData, 'color'),
      icon: getTextEntry(formData, 'icon')
    });

    if (!parsed.success) {
      return {
        status: 'error',
        message: 'Revisa los campos marcados.',
        fieldErrors: buildFieldErrors(parsed.error)
      };
    }

    const values = parsed.data;
    const normalizedName = normalizeName(values.name);

    const { data: existingRows } = await supabase
      .from('expense_categories')
      .select('id, name')
      .eq('business_id', appContext.business.id)
      .ilike('name', values.name.trim());

    const duplicate = ((existingRows ?? []) as Array<{ id: string; name: string }>).find((row) => normalizeName(row.name) === normalizedName && row.id !== values.categoryId);

    if (duplicate) {
      return {
        status: 'error',
        message: 'Ya existe una categoría con ese nombre.',
        fieldErrors: { name: 'Ya existe una categoría con ese nombre.' }
      };
    }

    const payload = {
      business_id: appContext.business.id,
      name: values.name.trim(),
      color: getOptionalTextEntry(formData, 'color') ?? '#7b885f',
      icon: getOptionalTextEntry(formData, 'icon'),
      is_active: true
    };

    if (values.categoryId) {
      const { error } = await supabase.from('expense_categories').update(payload).eq('id', values.categoryId).eq('business_id', appContext.business.id);
      if (error) {
        return { status: 'error', message: 'No se pudo actualizar la categoría.' };
      }
    } else {
      const { error } = await supabase.from('expense_categories').insert(payload);
      if (error) {
        return { status: 'error', message: 'No se pudo crear la categoría.' };
      }
    }

    await revalidateSettingsPages();

    return {
      status: 'success',
      message: values.categoryId ? 'Categoría actualizada.' : 'Categoría creada.'
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'No se pudo guardar la categoría.'
    };
  }
}

export async function toggleCategoryActiveAction(formData: FormData) {
  const appContext = await requireManageContext();
  const supabase = await createClient();
  const categoryId = getTextEntry(formData, 'categoryId');
  const nextState = getTextEntry(formData, 'nextState');

  if (!categoryId) {
    throw new Error('Falta la categoría.');
  }

  const { error } = await supabase
    .from('expense_categories')
    .update({ is_active: nextState === 'active' })
    .eq('id', categoryId)
    .eq('business_id', appContext.business.id);

  if (error) {
    throw new Error('No se pudo actualizar la categoría.');
  }

  await revalidateSettingsPages();
}

export async function deleteCategoryAction(formData: FormData) {
  const appContext = await requireManageContext();
  const supabase = await createClient();
  const categoryId = getTextEntry(formData, 'categoryId');

  if (!categoryId) {
    throw new Error('Falta la categoría.');
  }

  const { count } = await supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('business_id', appContext.business.id).eq('category_id', categoryId);

  if ((count ?? 0) > 0) {
    throw new Error('No puedes borrar una categoría con gastos asociados.');
  }

  const { error } = await supabase.from('expense_categories').delete().eq('id', categoryId).eq('business_id', appContext.business.id);

  if (error) {
    throw new Error('No se pudo eliminar la categoría.');
  }

  await revalidateSettingsPages();
}
