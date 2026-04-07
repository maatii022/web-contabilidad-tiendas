import { cn } from '@/lib/utils';

type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

const tones: Record<StatusTone, string> = {
  success: 'bg-[rgba(85,117,82,0.12)] text-[var(--success)]',
  warning: 'bg-[rgba(175,123,53,0.12)] text-[var(--warning)]',
  danger: 'bg-[rgba(155,91,83,0.12)] text-[var(--danger)]',
  neutral: 'bg-[rgba(110,127,86,0.10)] text-[var(--foreground-soft)]'
};

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: StatusTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-[0.02em]',
        tones[tone]
      )}
    >
      {label}
    </span>
  );
}
