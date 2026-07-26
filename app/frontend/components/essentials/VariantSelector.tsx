'use client';

import type { VariantDTO } from '@/lib/essentials-dto';

/** Swatch ramp drawn from approved background tokens (DESIGN.md palette).
 *  Deliberately NOT brand colours: there is no brand-colour source in the CSV,
 *  and arbitrary brand hex would break the closed palette and its contrast
 *  guarantees. The swatch carries VARIANT identity, not brand identity. */
const SWATCHES = [
  'bg-sel',
  'bg-petal',
  'bg-ochre-tint',
  'bg-emerald-tint',
  'bg-iron-tint',
  'bg-petal-deep',
];

/** Colour is never the only signal: at ≤3 variants (every product in the
 *  catalogue today) the label sits visibly beside its swatch, and above that a
 *  persistent "Variant:" line names the current selection. */
export function VariantSelector({
  variants,
  activeId,
  onSelect,
}: {
  variants: VariantDTO[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  if (variants.length < 2) return null;

  const inline = variants.length <= 3;
  const active = variants.find((v) => v.id === activeId) ?? variants[0];

  function onKeyDown(e: React.KeyboardEvent) {
    const i = variants.findIndex((v) => v.id === activeId);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      onSelect(variants[(i + 1) % variants.length].id);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      onSelect(variants[(i - 1 + variants.length) % variants.length].id);
    }
  }

  return (
    <div className="mt-3">
      <p className="font-sans text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {variants.length} variants
      </p>
      <div
        role="radiogroup"
        aria-label="Choose a variant"
        onKeyDown={onKeyDown}
        className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5"
      >
        {variants.map((v, i) => {
          const selected = v.id === activeId;
          return (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={v.label}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelect(v.id)}
              className="group flex min-h-8 items-center gap-2 rounded-md px-1 transition-colors duration-150"
            >
              <span
                aria-hidden
                className={`h-[14px] w-[14px] shrink-0 rounded-full border transition-all duration-150 ${
                  SWATCHES[i % SWATCHES.length]
                } ${
                  selected
                    ? 'border-iron ring-1 ring-iron ring-offset-2 ring-offset-paper'
                    : 'border-hairline-strong group-hover:border-iron/50'
                }`}
              />
              {inline && (
                <span
                  className={`font-sans text-sm ${
                    selected ? 'font-semibold text-ink' : 'text-ink-muted group-hover:text-ink'
                  }`}
                >
                  {v.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {!inline && (
        <p className="mt-2 font-sans text-sm text-ink">
          <span className="text-ink-faint">Variant: </span>
          {active.label}
        </p>
      )}
    </div>
  );
}
