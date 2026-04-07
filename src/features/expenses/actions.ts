'use server';

import { z } from 'zod';

import type { ExpenseFormState } from '@/features/expenses/types';
import { getFileEntry, getOptionalTextEntry, getTextEntry, toDecimalString } from '@/features/expenses/helpers';
import { deleteEntityAttachments, ensureVendor, getReturnPath, refreshCorePaths, requireManageContext, uploadAttachment } from '@/features/operations/shared';
import { createClient } from '@/lib/supabase/server';

const paymentMethods = ['cash', 'card', 'transfer', 'bizum', 'direct_debit', 'other'] as const;

const expenseSchema = z.object({
  categoryId: z.string().uuid('Selecciona una categoría.'),
  accountId: z.string().uuid('Cuenta inválida.').optional().or(z.literal('')),
  expenseDate: z.string().min(1, 'Indica la fecha.'),
  baseAmount: z.coerce.number().min(0, 'La base debe ser positiva.'),
  taxAmount: z.coerce.number().min(0, 'El impuesto debe ser positivo.'),
  paymentMethod: z.enum(paymentMethods, { message: 'Método de pago inválido.' }),
  reference: z.string().max(120, 'Referencia demasiado larga.').optional().or(z.literal('')),
  notes: z.string().max(800, 'Las notas son demasiado largas.').optional().or(z.literal('')),
  vendorName: z.string().max(120, 'Nombre de proveedor demasiado largo.').optional().or(z.literal(''))
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

export async function upsertExpenseAction(
  _prevState: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  try {
    const appContext = await requireManageContext();
    const supabase = await createClient();
    const expenseId = getTextEntry(formData, 'expenseId');
    const returnPath = getReturnPath(formData);
    const attachment = getFileEntry(formData, 'attachment');

    const parsed = expenseSchema.safeParse({
      categoryId: getTextEntry(formData, 'categoryId'),
      accountId: getTextEntry(formData, 'accountId'),
      expenseDate: getTextEntry(formData, 'expenseDate'),
      baseAmount: getTextEntry(formData, 'baseAmount'),
      taxAmount: getTextEntry(formData, 'taxAmount'),
      paymentMethod: getTextEntry(formData, 'paymentMethod'),
      reference: getTextEntry(formData, 'reference'),
      notes: getTextEntry(formData, 'notes'),
      vendorName: getTextEntry(formData, 'vendorName')
    });

    if (!parsed.success) {
      return {
        status: 'error',
        message: 'Revisa los campos marcados.',
        fieldErrors: buildFieldErrors(parsed.error)
      };
    }

    const values = parsed.data;
    const vendorId = await ensureVendor({
      businessId: appContext.business.id,
      vendorName: values.vendorName || null
    });

    if ((values.vendorName || '').trim() && !vendorId) {
      return {
        status: 'error',
        message: 'Ese proveedor no existe todavía.',
        fieldErrors: {
          vendorName: 'Proveedor no encontrado. Créalo en Configuración.'
        }
      };
    }

    const payload = {
      business_id: appContext.business.id,
      vendor_id: vendorId,
      category_id: values.categoryId,
      account_id: values.accountId || null,
      expense_date: values.expenseDate,
      base_amount: toDecimalString(values.baseAmount),
      tax_amount: toDecimalString(values.taxAmount),
      payment_method: values.paymentMethod,
      reference: values.reference || null,
      notes: values.notes || null,
      created_by: appContext.user.id
    };

    let persistedExpenseId = expenseId;

    if (expenseId) {
      const { error } = await supabase
        .from('expenses')
        .update(payload)
        .eq('id', expenseId)
        .eq('business_id', appContext.business.id);

      if (error) {
        return {
          status: 'error',
          message: 'No se pudo actualizar el gasto.'
        };
      }
    } else {
      const { data, error } = await supabase
        .from('expenses')
        .insert(payload)
        .select('id')
        .single();

      if (error || !data) {
        return {
          status: 'error',
          message: 'No se pudo registrar el gasto.'
        };
      }

      persistedExpenseId = data.id;
    }

    if (attachment && persistedExpenseId) {
      await uploadAttachment({
        businessId: appContext.business.id,
        entityId: persistedExpenseId,
        entityType: 'expense',
        file: attachment,
        uploadedBy: appContext.user.id
      });
    }

    refreshCorePaths(returnPath);

    return {
      status: 'success',
      entityId: persistedExpenseId,
      message: expenseId ? 'Gasto actualizado.' : 'Gasto registrado.'
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'No se pudo guardar el gasto.'
    };
  }
}

export async function deleteExpenseAction(formData: FormData) {
  const appContext = await requireManageContext();
  const supabase = await createClient();
  const expenseId = getTextEntry(formData, 'expenseId');
  const returnPath = getReturnPath(formData);

  if (!expenseId) {
    throw new Error('Falta el gasto a eliminar.');
  }

  await deleteEntityAttachments({
    businessId: appContext.business.id,
    entityId: expenseId,
    entityType: 'expense'
  });

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    .eq('business_id', appContext.business.id);

  if (error) {
    throw new Error('No se pudo eliminar el gasto.');
  }

  refreshCorePaths(returnPath);
}
