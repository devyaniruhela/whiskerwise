'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type NeedOption = { name: string; slug: string; count: number };
export type CardMeta = { key: string; categorySlug: string; kittenHidden: boolean };

type Ctx = {
  needs: NeedOption[];
  selected: Set<string>;
  kitten: boolean;
  /** per-card visibility, index-aligned with the meta passed to the provider */
  visible: boolean[];
  shown: number;
  total: number;
  toggleNeed: (slug: string) => void;
  setNeeds: (slugs: Set<string>) => void;
  setOnlyNeed: (slug: string) => void;
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
  meta,
  children,
}: {
  needs: NeedOption[];
  meta: CardMeta[];
  children: React.ReactNode;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [kitten, setKittenState] = useState(false);
  const pendingScroll = useRef(false);

  const valid = useMemo(() => new Set(needs.map((n) => n.slug)), [needs]);

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

  const apply = useCallback(
    (next: Set<string>, kit: boolean) => {
      setSelected(next);
      setKittenState(kit);
      writeUrl(next, kit);
    },
    [writeUrl],
  );

  const toggleNeed = useCallback(
    (slug: string) => {
      const next = new Set(selected);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      apply(next, kitten);
    },
    [selected, kitten, apply],
  );

  const setNeedsSelection = useCallback(
    (slugs: Set<string>) => apply(new Set(slugs), kitten),
    [kitten, apply],
  );

  const setOnlyNeed = useCallback(
    (slug: string) => {
      // a need tile is a jump-to shortcut: it replaces the selection, then scrolls
      apply(new Set([slug]), kitten);
      pendingScroll.current = true;
    },
    [kitten, apply],
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
          (selected.size === 0 || selected.has(m.categorySlug)) && // no selection means show all
          !(kitten && m.kittenHidden),
      ),
    [meta, selected, kitten],
  );

  const value: Ctx = {
    needs,
    selected,
    kitten,
    visible,
    shown: visible.filter(Boolean).length,
    total: meta.length,
    toggleNeed,
    setNeeds: setNeedsSelection,
    setOnlyNeed,
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
