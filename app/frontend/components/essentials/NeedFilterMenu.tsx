'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, FunnelSimple } from '@phosphor-icons/react';
import { useEssentialsFilter } from './EssentialsFilterProvider';

/** "Filter by need" as a tertiary trigger + a checkbox menu, rather than a row
 *  of always-on chips: the chips competed with the product grid for attention.
 *
 *  The menu holds a DRAFT selection and only commits on Apply, so the grid does
 *  not thrash while the user is still choosing. Apply stays disabled until at
 *  least one need is checked (D, 19 Jul 2026); clearing is Clear filters' job.
 *
 *  Iron/petal throughout, not the site-wide emerald selection accent: Curated
 *  Essentials carries its own identity (see design/DESIGN.md). */
export function NeedFilterMenu() {
  const { needs, selected, setNeeds } = useEssentialsFilter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Set<string>>(selected);
  const wrap = useRef<HTMLDivElement>(null);

  // reopening should start from what is actually applied, not a stale draft
  useEffect(() => {
    if (open) setDraft(new Set(selected));
  }, [open, selected]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function toggle(slug: string) {
    setDraft((d) => {
      const next = new Set(d);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`inline-flex min-h-[44px] items-center gap-2 rounded-md px-2 font-sans text-sm font-semibold underline decoration-iron/40 underline-offset-4 transition-colors duration-150 hover:bg-iron-tint hover:text-iron-deep hover:decoration-iron ${
          open ? 'bg-iron-tint text-iron-deep' : 'text-iron'
        }`}
      >
        <FunnelSimple size={17} weight="bold" aria-hidden />
        Filter by need
        {selected.size > 0 && (
          <span className="rounded-full bg-iron px-1.5 py-0.5 text-[11px] font-semibold leading-4 text-seashell">
            {selected.size}
          </span>
        )}
      </button>

      {open && (
        <div
          role="group"
          aria-label="Filter by need"
          className="absolute right-0 z-30 mt-2 w-64 rounded-lg border border-hairline bg-paper p-2 shadow-raised-lg"
        >
          <ul className="list-none">
            {needs.map((need) => {
              const on = draft.has(need.slug);
              return (
                <li key={need.slug}>
                  <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md px-2.5 transition-colors duration-150 hover:bg-iron-tint/60">
                    <span
                      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border transition-colors duration-150 ${
                        on ? 'border-iron bg-iron text-seashell' : 'border-hairline-strong bg-paper'
                      }`}
                    >
                      {on && <Check size={12} weight="bold" aria-hidden />}
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(need.slug)}
                        className="sr-only"
                      />
                    </span>
                    <span className="flex-1 font-sans text-sm text-ink">{need.name}</span>
                    <span className="font-sans text-xs text-ink-faint">{need.count}</span>
                  </label>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            disabled={draft.size === 0}
            onClick={() => {
              setNeeds(draft);
              setOpen(false);
            }}
            className="mt-2 w-full rounded-md bg-iron px-4 py-2.5 font-sans text-sm font-semibold text-seashell shadow-raised transition-all duration-150 ease-out hover:bg-iron-deep active:shadow-pressed disabled:cursor-not-allowed disabled:border disabled:border-dashed disabled:border-hairline-strong disabled:bg-sel/50 disabled:text-ink-faint disabled:shadow-none"
          >
            Apply filter
          </button>
        </div>
      )}
    </div>
  );
}
