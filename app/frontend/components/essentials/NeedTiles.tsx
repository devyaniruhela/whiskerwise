'use client';

import { track } from '@/lib/analytics';
import { BROWSE_ID, useEssentialsFilter } from './EssentialsFilterProvider';

/** Shop by need: the catalogue's front door. Each tile is a real link, so
 *  middle-click and no-JS still work; the click handler intercepts to filter in
 *  place and scroll instead of navigating.
 *
 *  Petal ground with iron text (the approved pairing; iron on petal ≈ 6.3:1) and
 *  no leading glyph, so the type carries the tile (D, 19 Jul 2026). The arrow
 *  stays as the affordance. Two columns on phones, three from lg. */
export function NeedTiles() {
  const { needs, itemTypes, categorySelected, selectCategory } = useEssentialsFilter();

  return (
    <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      {needs.map((need) => {
        const on = categorySelected(need.slug);
        // the no-JS href carries every item type under the category, matching what
        // the click handler selects in place
        const typeSlugs = itemTypes.filter((t) => t.categorySlug === need.slug).map((t) => t.slug);
        return (
          <a
            key={need.slug}
            href={`?need=${typeSlugs.join(',')}#${BROWSE_ID}`}
            onClick={(e) => {
              e.preventDefault();
              track('filter', {
                filter_type: 'add',
                filter_source: 'need_tile',
                filter_value: typeSlugs.join(','),
                page: 'curated-essentials',
              });
              selectCategory(need.slug);
            }}
            aria-pressed={on}
            className={`group flex min-h-[8.5rem] items-center justify-center rounded-lg border px-4 py-4 text-center shadow-raised transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-raised-lg active:translate-y-0 active:shadow-pressed sm:px-5 lg:min-h-[6rem] ${
              on
                ? 'border-iron bg-transparent text-iron'
                : 'border-iron bg-iron text-seashell hover:bg-iron-deep active:bg-iron-deep'
            }`}
          >
            <span className="min-w-0">
              <span className="block font-sans text-base font-semibold">{need.name}</span>
              <span className={`mt-0.5 block text-sm ${on ? 'text-iron/70' : 'text-seashell/70'}`}>
                {need.count} {need.count === 1 ? 'pick' : 'picks'}
              </span>
            </span>
          </a>
        );
      })}
    </div>
  );
}
