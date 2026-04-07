import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)] shadow-[0_16px_30px_rgba(83,99,65,0.18)] hover:shadow-[0_18px_34px_rgba(83,99,65,0.22)]',
  secondary:
    'border border-[rgba(110,127,86,0.18)] bg-[rgba(255,255,255,0.82)] text-[var(--foreground)] shadow-[0_10px_20px_rgba(60,70,49,0.04)] hover:bg-white',
  ghost: 'bg-transparent text-[var(--foreground-soft)] hover:bg-[rgba(110,127,86,0.08)] hover:text-[var(--foreground)]'
};

export function buttonClassName(variant: ButtonVariant = 'primary', className?: string) {
  return cn(
    'inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
    variantStyles[variant],
    className
  );
}

export function Button({ className, variant = 'primary', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClassName(variant, className)} {...props} />;
}
