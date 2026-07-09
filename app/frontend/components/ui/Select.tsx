'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { CaretDown, Check } from '@phosphor-icons/react';

export interface SelectOption {
  value: string;
  label: string;
}

/** Custom on-theme listbox — native OS <select> can't be themed (BUILD-GUIDE rule). */
export function Select({ label, value, options, placeholder = 'Choose…', onChange, className = '' }: {
  label?: string;
  value: string | null | undefined;
  options: SelectOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className={className} ref={rootRef}>
      {label && (
        <label id={`${id}-label`} className="mb-1.5 block font-sans text-sm font-semibold text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={label ? `${id}-label` : undefined}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-[44px] w-full items-center justify-between rounded-md border border-hairline-strong bg-paper px-3.5 py-2.5 text-left font-sans text-base text-ink transition-colors hover:border-graphite/50"
        >
          <span className={selected ? '' : 'text-ink-faint'}>{selected?.label ?? placeholder}</span>
          <CaretDown size={16} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} aria-hidden />
        </button>
        {open && (
          <ul
            role="listbox"
            className="absolute left-0 right-0 top-full z-dropdown mt-1 max-h-64 overflow-y-auto rounded-md border border-hairline bg-paper py-1 shadow-raised-lg"
          >
            {options.map((o) => (
              <li key={o.value} role="option" aria-selected={o.value === value}>
                <button
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left font-sans text-base transition-colors hover:bg-sel
                    ${o.value === value ? 'bg-sel font-semibold text-emerald' : 'text-ink'}`}
                >
                  {o.label}
                  {o.value === value && <Check size={16} aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
