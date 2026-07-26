'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { track } from '@/lib/analytics';

export type NeedOption = { name: string; slug: string; count: number };
/** A filter chip: one item_type, tagged with the category it sits under so a tile
 *  can select the whole category at once. */
export type ItemTypeOption = { name: string; slug: string; count: number; categorySlug: string };
export type CardMeta = { key: string; itemTypeSlug: string; kittenHidden: boolean };

type Ctx = {
  /** category tiles (each selects all its item types) */
  needs: NeedOption[];
  /** the granular filter axis: what `selected` holds and the menu toggles */
  itemTypes: ItemTypeOption[];
  /** selected item_type slugs */
  selected: Set<string>;
  kitten: boolean;
  /** per-card visibility, index-aligned with the meta passed to the provider */
  visible: boolean[];
  shown: number;
  total: number;
  /** true when every item type under a category is currently selected */
  categorySelected: (categorySlug: string) => boolean;
  /** tile action: replace the selection with a whole category's item types, then scroll */
  selectCategory: (categorySlug: string) => void;
  /** menu Apply: commit a set of item_type slugs */
  setTypes: (slugs: Set<string>) => void;
  setKitten: (on: boolean) => void;
  clear: () => void;
  hasFilters: boolean;
};

const FilterCtx = createContext<Ctx | null>(null);

export const BROWSE_ID = 'browse-all';
/** clears the fixed site header (h-16 → lg:h-20) plus a little breathing room */
const HEADER_OFFSET = 88;

export function useEssentialsFilter(): Ctx {
  const ctx = useContext(FilterCtx);
  if (!ctx) throw new Error('useEssentialsFilter must be used inside EssentialsFilterProvider');
  return ctx;
}

/** Filter state for the catalogue, kept deliberately out of the router.
 *
 *  No useSearchParams(): on a statically generated page it forces a Suspense
 *  boundary, and router.replace would refetch an RSC payload for what is purely
 *  client UI state. Instead we read location.search on mount, write with
 *  history.replaceState (so Back still means "leave the page"), and listen for
 *  popstate so browser navigation restores the view.
 *
 *  Visibility is computed here rather than in the grid so the section heading
 *  can show the live count too. */
export function EssentialsFilterProvider({
  needs,
  itemTypes,
  meta,
  children,
}: {
  needs: NeedOption[];
  itemTypes: ItemTypeOption[];
  meta: CardMeta[];
  children: React.ReactNode;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [kitten, setKittenState] = useState(false);
  const pendingScroll = useRef(false);

  // selection is now keyed on item_type slugs, so those are the valid ones
  const valid = useMemo(() => new Set(itemTypes.map((t) => t.slug)), [itemTypes]);
  // item_type slugs grouped by their category, for the tile "select all" action
  const typesByCategory = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const t of itemTypes) m.set(t.categorySlug, [...(m.get(t.categorySlug) ?? []), t.slug]);
    return m;
  }, [itemTypes]);

  const writeUrl = useCallback((next: Set<string>, kit: boolean) => {
    const p = new URLSearchParams(window.location.search);
    if (next.size) p.set('need', [...next].join(','));
    else p.delete('need');
    if (kit) p.set('kitten', '1');
    else p.delete('kitten');
    const qs = p.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  }, []);

  const writeUrlRef = useRef(writeUrl);
  writeUrlRef.current = writeUrl;

  const readUrl = useCallback(() => {
    const p = new URLSearchParams(window.location.search);
    const raw = (p.get('need') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    // unknown slugs are ignored rather than producing an empty result
    const kept = raw.filter((s) => valid.has(s));
    const kit = p.get('kitten') === '1';
    setSelected(new Set(kept));
    setKittenState(kit);
    // a stale or misspelled slug shouldn't linger in a URL the user may copy
    if (kept.length !== raw.length) writeUrlRef.current?.(new Set(kept), kit);
  }, [valid]);

  useEffect(() => {
    readUrl();
    window.addEventListener('popstate', readUrl);
    return () => window.removeEventListener('popstate', readUrl);
  }, [readUrl]);

  // Filter state carried on page load: filters use replaceState (no real
  // navigation), so GA never re-fires page_view on a filter change. To still
  // capture "arrived already filtered" - a shared/bookmarked ?need= URL - emit
  // one filter event on first mount when the URL comes in with a filter set.
  const initTracked = useRef(false);
  useEffect(() => {
    if (initTracked.current) return;
    initTracked.current = true;
    const p = new URLSearchParams(window.location.search);
    const need = (p.get('need') ?? '').split(',').map((s) => s.trim()).filter((s) => valid.has(s));
    const kit = p.get('kitten') === '1';
    if (need.length || kit) {
      track('filter', {
        filter_type: 'add',
        filter_source: 'url',
        filter_value: need.join(','),
        kitten: kit,
        page: 'curated-essentials',
      });
    }
  }, [valid]);

  const apply = useCallback(
    (next: Set<string>, kit: boolean) => {
      setSelected(next);
      setKittenState(kit);
      writeUrl(next, kit);
    },
    [writeUrl],
  );

  const setTypes = useCallback(
    (slugs: Set<string>) => apply(new Set(slugs), kitten),
    [kitten, apply],
  );

  const selectCategory = useCallback(
    (catSlug: string) => {
      // a tile is a jump-to shortcut: it replaces the selection with every item
      // type under the category, then scrolls to the grid
      apply(new Set(typesByCategory.get(catSlug) ?? []), kitten);
      pendingScroll.current = true;
    },
    [kitten, apply, typesByCategory],
  );

  const categorySelected = useCallback(
    (catSlug: string) => {
      const types = typesByCategory.get(catSlug) ?? [];
      return types.length > 0 && types.every((s) => selected.has(s));
    },
    [selected, typesByCategory],
  );

  // Scrolling inside the click handler gets cancelled: filtering hides most of
  // the grid, so the document shrinks under the in-flight scroll and the browser
  // clamps it back. Waiting for the filtered layout to commit fixes that, and
  // reading the rect here forces the layout we need. The flag is a ref, not
  // state, so this effect cannot re-run itself.
  useEffect(() => {
    if (!pendingScroll.current) return;
    pendingScroll.current = false;
    const el = document.getElementById(BROWSE_ID);
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // scrollTo rather than scrollIntoView: the fixed header would otherwise
    // cover the heading, and this lets the offset match the header's height
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    window.scrollTo({ top: Math.max(0, top), behavior: reduced ? 'auto' : 'smooth' });
  }, [selected, kitten]);

  const setKitten = useCallback((on: boolean) => apply(selected, on), [selected, apply]);
  const clear = useCallback(() => apply(new Set(), false), [apply]);

  const visible = useMemo(
    () =>
      meta.map(
        (m) =>
          (selected.size === 0 || selected.has(m.itemTypeSlug)) && // no selection means show all
          !(kitten && m.kittenHidden),
      ),
    [meta, selected, kitten],
  );

  const value: Ctx = {
    needs,
    itemTypes,
    selected,
    kitten,
    visible,
    shown: visible.filter(Boolean).length,
    total: meta.length,
    categorySelected,
    selectCategory,
    setTypes,
    setKitten,
    clear,
    hasFilters: selected.size > 0 || kitten,
  };

  return <FilterCtx.Provider value={value}>{children}</FilterCtx.Provider>;
}

/** Live count for the section heading: "18 picks" → "Showing 15 of 18 picks". */
export function BrowseCount() {
  const { shown, total, hasFilters } = useEssentialsFilter();
  if (!hasFilters) return <>{total} picks</>;
  return (
    <>
      Showing <span className="font-semibold text-ink">{shown}</span> of {total} picks
    </>
  );
}
