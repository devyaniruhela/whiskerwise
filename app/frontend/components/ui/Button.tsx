'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { CircleNotch } from '@phosphor-icons/react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald text-seashell hover:bg-emerald-deep active:shadow-pressed shadow-raised',
  secondary:
    'border border-graphite text-graphite bg-transparent hover:bg-sel/60 active:shadow-pressed',
  tertiary:
    'text-emerald underline underline-offset-4 hover:text-emerald-bright active:bg-ochre-tint px-2',
  destructive:
    'bg-iron text-seashell hover:brightness-90 active:shadow-pressed shadow-raised',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', loading = false, disabled, children, className = '', ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md px-5 py-2.5 font-sans text-sm font-semibold transition-all duration-150 ease-out
        disabled:border disabled:border-dashed disabled:border-hairline-strong disabled:bg-[#EFEAE4] disabled:text-ink-faint disabled:shadow-none
        ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && <CircleNotch size={16} className="animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
