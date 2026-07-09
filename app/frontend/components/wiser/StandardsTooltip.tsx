'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Question } from '@phosphor-icons/react';

/** Evidence tooltip (DESIGN.md): small `?` touchpoint by a claim, opens on hover +
 *  focus + click, names the standards concisely, closes on Escape / outside click. */
export function StandardsTooltip() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block align-middle"
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label="Which standards?"
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-ink-faint transition-colors hover:text-emerald"
      >
        <Question size={15} weight="bold" aria-hidden />
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="absolute bottom-full left-1/2 z-tooltip mb-2 w-64 -translate-x-1/2 rounded-md border border-hairline bg-graphite px-3 py-2.5 text-left text-xs font-normal not-italic leading-relaxed text-seashell shadow-raised-lg"
        >
          The published cat-food nutrient standards:{' '}
          <span className="font-mono text-petal">IS-11968</span> (India),{' '}
          <span className="font-mono text-petal">FEDIAF</span> (Europe) and{' '}
          <span className="font-mono text-petal">AAFCO</span> (USA). We score each pack against the strictest that applies.
        </span>
      )}
    </span>
  );
}
