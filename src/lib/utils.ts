export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(value: number, currency = 'EUR') {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatDate(input: string | Date) {
  const date = typeof input === 'string' ? new Date(input) : input;

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function sanitizeNextPath(value: FormDataEntryValue | string | null | undefined) {
  const rawValue = typeof value === 'string' ? value : typeof value === 'object' ? null : value;

  if (!rawValue) {
    return null;
  }

  if (!rawValue.startsWith('/') || rawValue.startsWith('//')) {
    return null;
  }

  return rawValue;
}
