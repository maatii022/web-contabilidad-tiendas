import { cn } from '@/lib/utils';
export type StatusPillTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
const tones: Record<StatusPillTone, string> = { success: 'bg-[rgba(85,117,82,0.12)] text-[var(--success)]', warning: 'bg-[rgba(175,123,53,0.12)] text-[var(--warning)]', danger: 'bg-[rgba(155,91,83,0.12)] text-[var(--danger)]', neutral: 'bg-[rgba(110,127,86,0.10)] text-[var(--foreground-soft)]', info: 'bg-[rgba(83,99,65,0.10)] text-[var(--accent-strong)]' };
export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: StatusPillTone; }) { return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]', tones[tone])}>{label}</span>; }
