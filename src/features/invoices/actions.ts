'use server';

import { z } from 'zod';

import { getFileEntry, getOptionalTextEntry, getTextEntry, parseMoney, toDecimalString } from '@/features/expenses/helpers';
import type { InvoiceFormState, InvoicePaymentFormState } from '@/features/invoices/types';
import { deleteEntityAttachments, ensureVendor, getReturnPath, refreshCorePaths, requireManageContext, uploadAttachment } from '@/features/operations/shared';
import { createClient } from '@/lib/supabase/server';

const paymentMethods = ['cash', 'card', 'transfer', 'bizum', 'direct_debit', 'other'] as const;

const invoiceSchema = z.object({
  invoiceId: z.string().uuid('Factura inválida.').optional().or(z.literal('')),
  vendorName: z.string().min(1, 'Selecciona un proveedor.').max(120, 'Proveedor demasiado largo.'),
  invoiceNumber: z.string().min(1, 'Indica el número de factura.').max(80, 'Número demasiado largo.'),
  issueDate: z.string().min(1, 'Indica la fecha de emisión.'),
  total: z.coerce.number().positive('El total debe ser mayor que cero.'),
  notes: z.string().max(800, 'Las notas son demasiado largas.').optional().or(z.literal(''))
});

const invoicePaymentSchema = z.object({
  invoiceId: z.string().uuid('Factura inválida.'),
  accountId: z.string().uuid('Selecciona una cuenta.'),
  paymentDate: z.string().min(1, 'Indica la fecha de pago.'),
  amount: z.coerce.number().positive('El importe debe ser mayor que cero.'),
  paymentMethod: z.enum(paymentMethods, { message: 'Método de pago inválido.' }),
  reference: z.string().max(120, 'Referencia demasiado larga.').optional().or(z.literal('')),
  notes: z.string().max(800, 'Las notas son demasiado largas.').optional().or(z.literal(''))
});

function buildFieldErrors(error: z.ZodError) {
  return error.issues.reduce<Record<string, string>>((acc, issue: z.ZodIssue) => {
    const field = typeof issue.path[0] === 'string' ? issue.path[0] : 'form';
    if (!acc[field]) {
      acc[field] = issue.message;
    }
    return acc;
  }, {});
}

function parseInstallments(formData: FormData) {
  const dueDates = formData.getAll('installmentDueDate').map((value) => (typeof value === 'string' ? value.trim() : ''));
  const amounts = formData.getAll('installmentAmount').map((value) => parseMoney(typeof value === 'string' ? value : '0'));

  const rows = dueDates.map((dueDate, index) => ({
    sequenceNumber: index + 1,
    dueDate,
    amount: amounts[index] ?? 0
  }));

  return rows.filter((row) => row.dueDate || row.amount > 0);
}

export async function upsertInvoiceAction(
  _prevState: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  try {
    const appContext = await requireManageContext();
    const supabase = await createClient();
    const attachment = getFileEntry(formData, 'attachment');
    const returnPath = getReturnPath(formData);

    const parsed = invoiceSchema.safeParse({
      invoiceId: getTextEntry(formData, 'invoiceId'),
      vendorName: getTextEntry(formData, 'vendorName'),
      invoiceNumber: getTextEntry(formData, 'invoiceNumber'),
      issueDate: getTextEntry(formData, 'issueDate'),
      total: getTextEntry(formData, 'total'),
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
    const installments = parseInstallments(formData);

    if (installments.length === 0) {
      return {
        status: 'error',
        message: 'Añade al menos un vencimiento.',
        fieldErrors: {
          installments: 'Necesitas al menos un vencimiento.'
        }
      };
    }

    for (const installment of installments) {
      if (!installment.dueDate) {
        return {
          status: 'error',
          message: 'Revisa los vencimientos.',
          fieldErrors: {
            installments: 'Cada vencimiento debe tener fecha.'
          }
        };
      }

      if (installment.dueDate < values.issueDate) {
        return {
          status: 'error',
          message: 'Revisa los vencimientos.',
          fieldErrors: {
            installments: 'No puede haber vencimientos antes de la emisión.'
          }
        };
      }
    }

    const scheduleTotal = Number(installments.reduce((sum, installment) => sum + installment.amount, 0).toFixed(2));

    if (Math.abs(scheduleTotal - values.total) > 0.01) {
      return {
        status: 'error',
        message: 'La suma de vencimientos no cuadra con el total.',
        fieldErrors: {
          installments: 'La suma de vencimientos debe coincidir con el total.'
        }
      };
    }

    const vendorId = await ensureVendor({
      businessId: appContext.business.id,
      vendorName: values.vendorName || null
    });

    if (!vendorId) {
      return {
        status: 'error',
        fieldErrors: {
          vendorName: 'Proveedor no encontrado. Créalo en Configuración.'
        },
        message: 'Ese proveedor no existe todavía.'
      };
    }

    if (values.invoiceId) {
      const { data: paymentRows } = await supabase
        .from('purchase_invoice_payments')
        .select('amount')
        .eq('business_id', appContext.business.id)
        .eq('invoice_id', values.invoiceId);

      const currentPaid = (paymentRows ?? []).reduce((sum, payment) => sum + parseMoney(payment.amount), 0);

      if (currentPaid > values.total + 0.009) {
        return {
          status: 'error',
          message: 'El total es menor que lo ya pagado.',
          fieldErrors: {
            total: 'No puede ser inferior a los pagos ya registrados.'
          }
        };
      }
    }

    const firstDueDate = installments.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]?.dueDate ?? values.issueDate;

    const payload = {
      business_id: appContext.business.id,
      vendor_id: vendorId,
      invoice_number: values.invoiceNumber,
      issue_date: values.issueDate,
      due_date: firstDueDate,
      subtotal: toDecimalString(values.total),
      tax_amount: toDecimalString(0),
      notes: getOptionalTextEntry(formData, 'notes'),
      created_by: appContext.user.id
    };

    let persistedInvoiceId = values.invoiceId || '';

    if (values.invoiceId) {
      const { error } = await supabase
        .from('purchase_invoices')
        .update(payload)
        .eq('id', values.invoiceId)
        .eq('business_id', appContext.business.id);

      if (error) {
        return {
          status: 'error',
          message: 'No se pudo actualizar la factura.'
        };
      }

      persistedInvoiceId = values.invoiceId;

      const { error: deleteInstallmentsError } = await supabase
        .from('purchase_invoice_installments')
        .delete()
        .eq('business_id', appContext.business.id)
        .eq('invoice_id', persistedInvoiceId);

      if (deleteInstallmentsError) {
        return {
          status: 'error',
          message: 'No se pudo actualizar el calendario de vencimientos.'
        };
      }
    } else {
      const { data, error } = await supabase
        .from('purchase_invoices')
        .insert(payload)
        .select('id')
        .single();

      if (error || !data) {
        return {
          status: 'error',
          message: 'No se pudo registrar la factura.'
        };
      }

      persistedInvoiceId = data.id;
    }

    const installmentPayload = installments.map((installment) => ({
      business_id: appContext.business.id,
      invoice_id: persistedInvoiceId,
      sequence_number: installment.sequenceNumber,
      due_date: installment.dueDate,
      amount: toDecimalString(installment.amount)
    }));

    const { error: installmentsError } = await supabase.from('purchase_invoice_installments').insert(installmentPayload);

    if (installmentsError) {
      return {
        status: 'error',
        message: 'No se pudieron guardar los vencimientos.'
      };
    }

    await supabase.rpc('refresh_purchase_invoice_schedule', {
      p_invoice_id: persistedInvoiceId
    });

    if (attachment && persistedInvoiceId) {
      await uploadAttachment({
        businessId: appContext.business.id,
        entityId: persistedInvoiceId,
        entityType: 'purchase_invoice',
        file: attachment,
        uploadedBy: appContext.user.id
      });
    }

    refreshCorePaths(returnPath);

    return {
      status: 'success',
      entityId: persistedInvoiceId,
      message: values.invoiceId ? 'Factura actualizada.' : 'Factura registrada.'
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'No se pudo guardar la factura.'
    };
  }
}

export async function createInvoiceQuickAction(
  prevState: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  return upsertInvoiceAction(prevState, formData);
}

export async function addInvoicePaymentAction(
  _prevState: InvoicePaymentFormState,
  formData: FormData
): Promise<InvoicePaymentFormState> {
  try {
    const appContext = await requireManageContext();
    const supabase = await createClient();
    const returnPath = getReturnPath(formData);

    const parsed = invoicePaymentSchema.safeParse({
      invoiceId: getTextEntry(formData, 'invoiceId'),
      accountId: getTextEntry(formData, 'accountId'),
      paymentDate: getTextEntry(formData, 'paymentDate'),
      amount: getTextEntry(formData, 'amount'),
      paymentMethod: getTextEntry(formData, 'paymentMethod'),
      reference: getTextEntry(formData, 'reference'),
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

    const { data: invoice, error: invoiceError } = await supabase
      .from('purchase_invoices')
      .select('id, business_id, total, status')
      .eq('id', values.invoiceId)
      .eq('business_id', appContext.business.id)
      .single();

    if (invoiceError || !invoice) {
      return {
        status: 'error',
        message: 'No se encontró la factura.'
      };
    }

    if (invoice.status === 'cancelled') {
      return {
        status: 'error',
        message: 'No puedes registrar pagos en una factura anulada.'
      };
    }

    const { data: paymentSumRows } = await supabase
      .from('purchase_invoice_payments')
      .select('amount')
      .eq('business_id', appContext.business.id)
      .eq('invoice_id', values.invoiceId);

    const paymentRows = (paymentSumRows ?? []) as Array<{ amount: string | number | null }>;
    const currentPaid = paymentRows.reduce((sum: number, payment) => sum + Number(payment.amount ?? 0), 0);
    const totalInvoice = Number(invoice.total ?? 0);

    if (currentPaid + values.amount > totalInvoice + 0.009) {
      return {
        status: 'error',
        fieldErrors: {
          amount: 'El pago supera el importe pendiente de la factura.'
        },
        message: 'El pago es mayor que el pendiente.'
      };
    }

    const { error } = await supabase.from('purchase_invoice_payments').insert({
      business_id: appContext.business.id,
      invoice_id: values.invoiceId,
      account_id: values.accountId,
      payment_date: values.paymentDate,
      amount: toDecimalString(values.amount),
      payment_method: values.paymentMethod,
      reference: getOptionalTextEntry(formData, 'reference'),
      notes: getOptionalTextEntry(formData, 'notes'),
      created_by: appContext.user.id
    });

    if (error) {
      return {
        status: 'error',
        message: 'No se pudo registrar el pago.'
      };
    }

    refreshCorePaths(returnPath);

    return {
      status: 'success',
      message: 'Pago registrado.'
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'No se pudo registrar el pago.'
    };
  }
}

export async function deleteInvoiceAction(formData: FormData) {
  const appContext = await requireManageContext();
  const supabase = await createClient();
  const invoiceId = getTextEntry(formData, 'invoiceId');
  const returnPath = getReturnPath(formData);

  if (!invoiceId) {
    throw new Error('Falta la factura a eliminar.');
  }

  await deleteEntityAttachments({
    businessId: appContext.business.id,
    entityId: invoiceId,
    entityType: 'purchase_invoice'
  });

  const { error } = await supabase
    .from('purchase_invoices')
    .delete()
    .eq('id', invoiceId)
    .eq('business_id', appContext.business.id);

  if (error) {
    throw new Error('No se pudo eliminar la factura.');
  }

  refreshCorePaths(returnPath);
}

export async function deleteInvoicePaymentAction(formData: FormData) {
  const appContext = await requireManageContext();
  const supabase = await createClient();
  const paymentId = getTextEntry(formData, 'paymentId');
  const returnPath = getReturnPath(formData);

  if (!paymentId) {
    throw new Error('Falta el pago a eliminar.');
  }

  const { error } = await supabase
    .from('purchase_invoice_payments')
    .delete()
    .eq('id', paymentId)
    .eq('business_id', appContext.business.id);

  if (error) {
    throw new Error('No se pudo eliminar el pago.');
  }

  refreshCorePaths(returnPath);
}
