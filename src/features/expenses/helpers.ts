import type { Database } from '@/types/database';

export const allowedAttachmentTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
]);

export function parseMoney(value: string | number | null | undefined) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/\s/g, '').replace(',', '.');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
  }

  return 0;
}

export function toDecimalString(value: string | number | null | undefined) {
  return parseMoney(value).toFixed(2);
}

export function getTextEntry(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export function getOptionalTextEntry(formData: FormData, key: string) {
  const value = getTextEntry(formData, key);
  return value.length > 0 ? value : null;
}

export function getFileEntry(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

export function sanitizeFileName(fileName: string) {
  return fileName
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9.\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export function buildStoragePath({
  businessId,
  entityType,
  entityId,
  fileName
}: {
  businessId: string;
  entityType: 'expense' | 'purchase_invoice';
  entityId: string;
  fileName: string;
}) {
  const safeName = sanitizeFileName(fileName) || 'documento';
  return `${businessId}/${entityType}/${entityId}/${Date.now()}-${safeName}`;
}

export function validateAttachment(file: File | null) {
  if (!file) {
    return null;
  }

  if (!allowedAttachmentTypes.has(file.type)) {
    return 'Adjunta PDF, JPG, PNG o WEBP.';
  }

  if (file.size > 10 * 1024 * 1024) {
    return 'El archivo no puede superar 10 MB.';
  }

  return null;
}

export const paymentMethodOptions: Array<{
  value: Database['public']['Enums']['payment_method'];
  label: string;
}> = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'bizum', label: 'Bizum' },
  { value: 'direct_debit', label: 'Domiciliación' },
  { value: 'other', label: 'Otro' }
];

export function paymentMethodLabel(method: Database['public']['Enums']['payment_method']) {
  return paymentMethodOptions.find((option) => option.value === method)?.label ?? 'Otro';
}
