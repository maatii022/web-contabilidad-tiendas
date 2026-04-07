'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function Sheet({
  open,
  title,
  description,
  onClose,
  children
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(22,30,20,0.28)] backdrop-blur-[3px]">
      <button
        type="button"
        aria-label="Cerrar panel"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
      />
      <div className="relative z-10 flex h-full w-full max-w-[640px] flex-col border-l border-[rgba(123,136,95,0.18)] bg-[rgba(249,245,238,0.96)] shadow-[0_32px_64px_rgba(34,44,30,0.18)]">
        <div className="flex items-start justify-between gap-4 border-b border-[rgba(123,136,95,0.14)] px-5 py-5 md:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">Operativa rápida</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{title}</h2>
            {description ? <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--foreground-soft)]">{description}</p> : null}
          </div>
          <Button variant="ghost" className="h-10 w-10 rounded-full px-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">{children}</div>
      </div>
    </div>
  );
}
