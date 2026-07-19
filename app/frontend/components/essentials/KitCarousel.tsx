'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Acorn,
  ArrowSquareOut,
  ArrowUpRight,
  Basket,
  CaretLeft,
  CaretRight,
  Cookie,
  ForkKnife,
  Pinwheel,
  Shovel,
  Shrimp,
} from '@phosphor-icons/react';
import type { VariantDTO } from '@/lib/essentials-dto';
import { VariantSelector } from './VariantSelector';

const STAMP = '/whisker-wise-logo-stamp-bw.png';

/** The indicator groups products rather than listing one icon per slide: with 12
 *  items the strip was a wall of near-identical glyphs. Seven groups, in slide
 *  order, so swiping through all the dry food moves the marker on to wet food
 *  (D, 19 Jul 2026). Icons are D's picks. */
const KIT_GROUPS = [
  { key: 'dry-food', label: 'Dry food', icon: Acorn, types: ['Dry food'] },
  { key: 'wet-food', label: 'Wet food', icon: Shrimp, types: ['Wet food'] },
  { key: 'plate', label: 'Bowls & plates', icon: ForkKnife, types: ['Bowl/plate'] },
  { key: 'litter', label: 'Litter', icon: Shovel, types: ['Litter', 'Litter box'] },
  { key: 'toys', label: 'Toys', icon: Pinwheel, types: ['Toy', 'Scratcher', 'Enrichment'] },
  { key: 'treats', label: 'Treats', icon: Cookie, types: ['Treat', 'Topper'] },
  { key: 'carrier', label: 'Carrier', icon: Basket, types: ['Carrier', 'Harness'] },
] as const;

const GROUP_OF = new Map<string, number>();
KIT_GROUPS.forEach((g, i) => g.types.forEach((t) => GROUP_OF.set(t, i)));
/** unknown item types land in the last group rather than vanishing */
const groupIndex = (itemType: string) => GROUP_OF.get(itemType) ?? KIT_GROUPS.length - 1;

/** One serialisable slide (computed server-side; no fs access here).
 *  A slide is a PRODUCT, not a row: the kit shows one tile per title so the
 *  "essentials" promise stays a short list, with the choice inside (D). */
export type KitSlide = {
  key: string;
  title: string;
  itemType: string;
  variants: VariantDTO[];
};

/** The starter kit as a hamper you leaf through: one item at a time, swipe or
 *  arrow left/right, with a miniature indicator up top showing every item in the
 *  collection and which one you're on. Scroll-snap rail = native touch swiping;
 *  buttons + indicator cover pointer and keyboard. */
export function KitCarousel({ slides: input }: { slides: KitSlide[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // stable sort into group order, so each group's slides are contiguous and the
  // indicator can advance cleanly as you swipe
  const slides = [...input]
    .map((s, i) => ({ s, i, g: groupIndex(s.itemType) }))
    .sort((a, b) => a.g - b.g || a.i - b.i)
    .map((x) => x.s);

  // only groups that actually have items, each with the slide it starts at
  const groups = KIT_GROUPS.map((g, gi) => ({
    ...g,
    firstSlide: slides.findIndex((s) => groupIndex(s.itemType) === gi),
    count: slides.filter((s) => groupIndex(s.itemType) === gi).length,
  })).filter((g) => g.count > 0);

  const activeGroup = slides[active] ? groupIndex(slides[active].itemType) : 0;

  function goTo(i: number) {
    const el = rail.current;
    if (!el) return;
    setActive(i); // immediate indicator feedback; onScroll keeps it honest for swipes
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
  }

  function onScroll() {
    const el = rail.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <div>
      {/* indicator: one mark per group, lit for whichever group you're inside */}
      <div className="flex flex-wrap items-center justify-center gap-2.5" role="tablist" aria-label="Kit sections">
        {groups.map((g) => {
          const Icon = g.icon;
          const on = activeGroup === KIT_GROUPS.findIndex((k) => k.key === g.key);
          return (
            <button
              key={g.key}
              type="button"
              role="tab"
              aria-selected={on}
              aria-label={`${g.label}, ${g.count} ${g.count === 1 ? 'item' : 'items'}`}
              onClick={() => goTo(g.firstSlide)}
              className={`flex h-11 w-11 items-center justify-center rounded-md border transition-all duration-150 ease-out ${
                on
                  ? 'border-petal bg-petal text-graphite shadow-raised'
                  : 'border-seashell/25 text-petal/70 hover:border-petal/60 hover:text-petal'
              }`}
            >
              <Icon size={22} aria-hidden />
            </button>
          );
        })}
      </div>
      <p className="mt-2.5 text-center font-sans text-xs text-seashell/70" aria-live="polite">
        {active + 1} of {slides.length}
      </p>
      <p className="sr-only">{slides[active]?.title}</p>

      {/* the rail: full-width slides, snap per item */}
      <div className="relative mt-5">
        <div
          ref={rail}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((s) => (
            <KitSlideCard key={s.key} slide={s} />
          ))}
        </div>

        {/* pointer/keyboard arrows */}
        <button
          type="button"
          aria-label="Previous item"
          onClick={() => goTo(Math.max(0, active - 1))}
          disabled={active === 0}
          className="absolute -left-1 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-seashell/25 text-petal transition-colors hover:border-petal disabled:opacity-30 sm:flex"
        >
          <CaretLeft size={20} weight="bold" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Next item"
          onClick={() => goTo(Math.min(slides.length - 1, active + 1))}
          disabled={active === slides.length - 1}
          className="absolute -right-1 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-seashell/25 text-petal transition-colors hover:border-petal disabled:opacity-30 sm:flex"
        >
          <CaretRight size={20} weight="bold" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function KitSlideCard({ slide }: { slide: KitSlide }) {
  const [activeId, setActiveId] = useState(slide.variants[0].id);
  const v = slide.variants.find((x) => x.id === activeId) ?? slide.variants[0];
  const sub = [v.brand, slide.variants.length > 1 ? '' : v.variant].filter(Boolean).join(' · ');
  const [failed, setFailed] = useState(false);
  const image = v.images[0] ?? null;

  return (
    <article className="w-full shrink-0 snap-center px-1 sm:px-10">
      {/* fixed height so the card doesn't resize as you swipe between products
          with different variant counts and description lengths (D) */}
      <div className="grain relative flex h-[34rem] flex-col justify-center overflow-hidden rounded-lg border border-hairline bg-paper p-5 shadow-raised-lg sm:h-[24rem] sm:p-7">
        <div className="grid gap-6 sm:grid-cols-[2fr_3fr] sm:items-center">
          <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-md bg-sel/40 sm:h-56">
            {image && !failed ? (
              <Image
                key={image}
                src={image}
                alt={`${slide.title}${sub ? `, ${sub}` : ''}`}
                fill
                sizes="(min-width: 640px) 35vw, 90vw"
                className="object-cover"
                onError={() => setFailed(true)}
              />
            ) : (
              <Image src={STAMP} alt="" width={96} height={83} className="opacity-35" aria-hidden />
            )}
          </div>
          <div>
            <h3 className="font-serif text-2xl leading-tight text-ink sm:text-3xl">{slide.title}</h3>
            {sub && <p className="mt-1 text-sm text-ink-faint">{sub}</p>}
            <VariantSelector variants={slide.variants} activeId={v.id} onSelect={setActiveId} />
            <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-ink-muted sm:text-base">
              {v.description}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <a
                href={v.buyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-md bg-iron px-6 py-3 font-sans text-base font-semibold text-seashell shadow-raised transition-all duration-150 ease-out hover:bg-iron-deep active:shadow-pressed"
              >
                Buy now
                <ArrowSquareOut size={18} weight="bold" aria-hidden />
              </a>
              <Link
                href={`/curated-essentials/${v.id}`}
                className="inline-flex min-h-[44px] items-center gap-1 font-sans text-sm font-semibold text-iron transition-colors hover:text-iron-deep"
              >
                View pick
                <ArrowUpRight size={15} weight="bold" aria-hidden />
              </Link>
            </div>
            <p className="mt-2 text-xs text-ink-faint">
              Sold by {v.retailer}. Approved &amp; curated by Whisker Wise.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
