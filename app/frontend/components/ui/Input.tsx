'use client';

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, useEffect, useId, useRef, useState } from 'react';

const FIELD_CLS =
  'w-full rounded-md border bg-paper px-3.5 py-2.5 font-sans text-base text-ink placeholder:text-ink-faint transition-colors duration-150 disabled:border-dashed disabled:bg-[#EFEAE4] disabled:text-ink-faint';

function borderCls(error?: string) {
  return error ? 'border-iron' : 'border-hairline-strong hover:border-graphite/50';
}

/** Inline errors clear the moment the user edits the field (no submit needed), and
 *  reappear if a fresh validation sets a new error. Site-wide behaviour: every field
 *  built on Input/Textarea gets this automatically. */
function useLiveError(error: string | undefined) {
  const prev = useRef(error);
  const [suppressed, setSuppressed] = useState(false);
  useEffect(() => {
    if (error !== prev.current) { setSuppressed(false); prev.current = error; }
  }, [error]);
  return { shownError: suppressed ? undefined : error, onEdit: () => error && setSuppressed(true) };
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className = '', id, onChange, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const { shownError, onEdit } = useLiveError(error);
    return (
      <div className={className}>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block font-sans text-sm font-semibold text-ink">
            {label}
          </label>
        )}
        <input ref={ref} id={inputId} className={`${FIELD_CLS} ${borderCls(shownError)}`}
          aria-invalid={!!shownError}
          onChange={(e) => { onEdit(); onChange?.(e); }} {...props} />
        {shownError ? (
          <p className="mt-1 text-sm text-iron">{shownError}</p>
        ) : hint ? (
          <p className="mt-1 text-sm text-ink-faint">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, onChange, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const { shownError, onEdit } = useLiveError(error);
    return (
      <div className={className}>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block font-sans text-sm font-semibold text-ink">
            {label}
          </label>
        )}
        <textarea ref={ref} id={inputId} className={`${FIELD_CLS} ${borderCls(shownError)}`}
          aria-invalid={!!shownError}
          onChange={(e) => { onEdit(); onChange?.(e); }} {...props} />
        {shownError && <p className="mt-1 text-sm text-iron">{shownError}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
