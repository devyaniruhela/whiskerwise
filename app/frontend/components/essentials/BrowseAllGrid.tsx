'use client';

import { Children } from 'react';
import { Check, X } from '@phosphor-icons/react';
import { useEssentialsFilter } from './EssentialsFilterProvider';
import { NeedFilterMenu } from './NeedFilterMenu';

/** Controls row + grid.
 *
 *  The cards arrive as `children`: server-rendered nodes in the same order as
 *  the meta given to the provider. This component only toggles a `hidden`
 *  attribute on their wrappers, so the card subtrees are never re-rendered or
 *  re-serialised, the page stays fully static, and the client bundle carries no
 *  product data.
 *
 *  It must NEVER import ProductCard: that is a server component reaching into
 *  lib/catalogue, which imports fs. */
export function BrowseAllGrid({ children }: { children: React.ReactNode }) {
  const { kitten, setKitten, clear, hasFilters, visible, shown } = useEssentialsFilter();
  const nodes = Children.toArray(children);

  return (
    <div>
      {/* controls: kitten toggle left, filter menu right (D, 19 Jul 2026) */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
          <span
            className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border transition-colors duration-150 ${
              kitten ? 'border-iron bg-iron text-seashell' : 'border-hairline-strong bg-paper'
            }`}
          >
            {kitten && <Check size={12} weight="bold" aria-hidden />}
            <input
              type="checkbox"
              checked={kitten}
              onChange={(e) => setKitten(e.target.checked)}
              className="sr-only"
            />
          </span>
          <span className="font-sans text-sm text-ink">I am shopping for a kitten</span>
        </label>

        <NeedFilterMenu />
      </div>

      {hasFilters && (
        <div className="mt-1 flex justify-end">
          <button
            type="button"
            onClick={clear}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-md px-2 font-sans text-sm font-semibold text-iron underline decoration-iron/40 underline-offset-4 transition-colors duration-150 hover:bg-iron-tint hover:text-iron-deep"
          >
            <X size={13} weight="bold" aria-hidden />
            Clear filters
          </button>
        </div>
      )}

      {shown > 0 ? (
        <ul className="mt-6 grid list-none gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {nodes.map((node, i) => (
            <li key={i} hidden={!visible[i]}>
              {node}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-hairline-strong bg-paper/60 px-6 py-12 text-center">
          <p className="font-sans text-base text-ink">
            {kitten ? 'Nothing here for kittens yet.' : 'No picks match those filters.'}
          </p>
          <p className="mt-1.5 text-sm text-ink-muted">
            {kitten
              ? 'Try clearing the kitten filter, or pick another need.'
              : 'Try removing a filter to see more.'}
          </p>
          <button
            type="button"
            onClick={clear}
            className="mt-5 inline-flex min-h-[44px] items-center rounded-md bg-iron px-5 py-2.5 font-sans text-sm font-semibold text-seashell shadow-raised transition-all duration-150 hover:bg-iron-deep active:shadow-pressed"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
