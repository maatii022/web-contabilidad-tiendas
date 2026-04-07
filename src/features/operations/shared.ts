import 'server-only';

import { revalidatePath } from 'next/cache';

import { requireAppContext } from '@/lib/app-access';
import { createClient } from '@/lib/supabase/server';
import { buildStoragePath, getTextEntry, sanitizeFileName, validateAttachment } from '@/features/expenses/helpers';
import type { Database } from '@/types/database';

export type ManagedContext = Awaited<ReturnType<typeof requireAppContext>>;

export async function requireManageContext() {
  const appContext = await requireAppContext();

  if (!['admin', 'manager'].includes(appContext.membership.role)) {
    throw new Error('No tienes permisos para editar.');
  }

  return appContext;
}

export async function ensureVendor({
  businessId,
  vendorId,
  vendorName
}: {
  businessId: string;
  vendorId?: string | null;
  vendorName?: string | null;
}) {
  const supabase = await createClient();

  if (vendorId) {
    return vendorId;
  }

  const normalizedName = vendorName?.trim();

  if (!normalizedName) {
    return null;
  }

  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, name')
    .eq('business_id', businessId)
    .ilike('name', normalizedName);

  const exactMatch = ((vendors ?? []) as Array<Pick<Database['public']['Tables']['vendors']['Row'], 'id' | 'name'>>).find(
    (vendor) => vendor.name.toLocaleLowerCase('es-ES') === normalizedName.toLocaleLowerCase('es-ES')
  );

  return exactMatch?.id ?? null;
}

async function syncAttachmentCount({
  businessId,
  entityId,
  entityType
}: {
  businessId: string;
  entityId: string;
  entityType: 'expense' | 'purchase_invoice';
}) {
  const supabase = await createClient();
  const { count } = await supabase
    .from('attachments')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);

  const attachmentCount = count ?? 0;

  if (entityType === 'expense') {
    await supabase.from('expenses').update({ attachment_count: attachmentCount }).eq('id', entityId).eq('business_id', businessId);
    return;
  }

  await supabase.from('purchase_invoices').update({ attachment_count: attachmentCount }).eq('id', entityId).eq('business_id', businessId);
}

export async function uploadAttachment({
  businessId,
  entityId,
  entityType,
  file,
  uploadedBy
}: {
  businessId: string;
  entityId: string;
  entityType: 'expense' | 'purchase_invoice';
  file: File | null;
  uploadedBy: string;
}) {
  if (!file) {
    return;
  }

  const fileError = validateAttachment(file);

  if (fileError) {
    throw new Error(fileError);
  }

  const supabase = await createClient();
  const storagePath = buildStoragePath({
    businessId,
    entityId,
    entityType,
    fileName: sanitizeFileName(file.name)
  });

  const { error: uploadError } = await supabase.storage.from('private-documents').upload(storagePath, file, {
    upsert: false,
    contentType: file.type,
    cacheControl: '3600'
  });

  if (uploadError) {
    throw new Error('No se pudo subir el adjunto.');
  }

  const { error: attachmentError } = await supabase.from('attachments').insert({
    business_id: businessId,
    entity_type: entityType,
    entity_id: entityId,
    storage_path: storagePath,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    uploaded_by: uploadedBy
  });

  if (attachmentError) {
    await supabase.storage.from('private-documents').remove([storagePath]);
    throw new Error('No se pudo vincular el adjunto.');
  }

  await syncAttachmentCount({ businessId, entityId, entityType });
}

export async function deleteEntityAttachments({
  businessId,
  entityId,
  entityType
}: {
  businessId: string;
  entityId: string;
  entityType: 'expense' | 'purchase_invoice';
}) {
  const supabase = await createClient();

  const { data: attachments } = await supabase
    .from('attachments')
    .select('id, storage_path')
    .eq('business_id', businessId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);

  if (!attachments || attachments.length === 0) {
    return;
  }

  const attachmentRows = (attachments ?? []) as Array<Pick<Database['public']['Tables']['attachments']['Row'], 'id' | 'storage_path'>>;
  const paths = attachmentRows.map((item) => item.storage_path);
  await supabase.storage.from('private-documents').remove(paths);
  await supabase.from('attachments').delete().in('id', attachmentRows.map((item) => item.id));
  await syncAttachmentCount({ businessId, entityId, entityType });
}

export function getReturnPath(formData: FormData) {
  const value = getTextEntry(formData, 'returnPath');
  return value.startsWith('/') ? value : '/dashboard';
}

export function refreshCorePaths(returnPath: string) {
  revalidatePath('/dashboard');
  revalidatePath('/gastos');
  revalidatePath('/facturas');
  if (returnPath !== '/dashboard' && returnPath !== '/gastos') {
    revalidatePath(returnPath);
  }
}
