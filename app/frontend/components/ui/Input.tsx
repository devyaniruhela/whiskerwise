'use client';

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, useId } from 'react';

const FIELD_CLS =
  'w-full rounded-md border bg-paper px-3.5 py-2.5 font-sans text-base text-ink placeholder:text-ink-faint transition-colors duration-150 disabled:border-dashed disabled:bg-[#EFEAE4] disabled:text-ink-faint';

function borderCls(error?: string) {
  return error ? 'border-iron' : 'border-hairline-strong hover:border-graphite/50';
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  hint?: string;
  error?: string;
}

/** Visible label always (never placeholder-as-label); inline error below. */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className = '', id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <div className={className}>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block font-sans text-sm font-semibold text-ink">
            {label}
          </label>
        )}
        <input ref={ref} id={inputId} className={`${FIELD_CLS} ${borderCls(error)}`}
          aria-invalid={!!error} {...props} />
        {error ? (
          <p className="mt-1 text-sm text-iron">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-sm text-ink-faint">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <div className={className}>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block font-sans text-sm font-semibold text-ink">
            {label}
          </label>
        )}
        <textarea ref={ref} id={inputId} className={`${FIELD_CLS} ${borderCls(error)}`}
          aria-invalid={!!error} {...props} />
        {error && <p className="mt-1 text-sm text-iron">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
