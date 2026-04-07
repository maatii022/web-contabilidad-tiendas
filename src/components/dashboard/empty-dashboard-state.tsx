import type { LucideIcon } from 'lucide-react';
export function EmptyDashboardState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string; }) {
  return <div className="flex flex-col items-start gap-4 rounded-[24px] border border-dashed border-[rgba(123,136,95,0.18)] bg-[rgba(255,255,255,0.48)] p-5"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(110,127,86,0.12)] text-[var(--accent-strong)]"><Icon className="h-5 w-5" /></span><div><p className="text-sm font-semibold text-[var(--foreground)]">{title}</p><p className="mt-2 text-sm leading-6 text-[var(--foreground-soft)]">{description}</p></div></div>;
}
