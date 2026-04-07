'use client';

import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';

import { quickSettleInvoiceAction } from '@/features/invoices/actions';
import { buttonClassName } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function QuickSettleButton({
  invoiceId,
  installmentId,
  returnPath,
  label = 'Pagado',
  className
}: {
  invoiceId: string;
  installmentId?: string;
  returnPath: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<'idle' | 'pending' | 'settled'>('idle');
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (phase !== 'idle' || isPending) return;

    setPhase('pending');
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set('invoiceId', invoiceId);
        if (installmentId) formData.set('installmentId', installmentId);
        formData.set('returnPath', returnPath);
        await quickSettleInvoiceAction(formData);
        setPhase('settled');
        window.setTimeout(() => router.refresh(), 220);
      } catch (error) {
        setPhase('idle');
        const message = error instanceof Error ? error.message : 'No se pudo registrar el pago.';
        window.alert(message);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={phase !== 'idle' || isPending}
      className={cn(
        buttonClassName('primary', 'h-9 px-4 text-xs transition-all duration-200 ease-out'),
        phase === 'pending' && 'min-w-[104px]',
        phase === 'settled' && 'scale-90 opacity-0',
        className
      )}
    >
      {phase === 'pending' ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando
        </>
      ) : phase === 'settled' ? (
        <>
          <Check className="mr-2 h-4 w-4" />Pagado
        </>
      ) : (
        label
      )}
    </button>
  );
}
