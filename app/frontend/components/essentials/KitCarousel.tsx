'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Acorn,
  ArrowSquareOut,
  ArrowUpRight,
  Basket,
  CaretLeft,
  CaretRight,
  Confetti,
  Cookie,
  ForkKnife,
  Heartbeat,
  Pinwheel,
  Shovel,
  Shrimp,
} from '@phosphor-icons/react';
import { track } from '@/lib/analytics';
import type { VariantDTO } from '@/lib/essentials-dto';
import { VariantSelector } from './VariantSelector';
import { MEDIA_FIT } from './media';
import { brandLine } from './product-label';

const STAMP = '/whisker-wise-logo-stamp-bw.png';

/** Square from sm up (see media.ts), but capped on mobile: the kit card pins its
 *  own height, and a full-width square would push the buy CTA off the card. With
 *  `contain` the whole product still shows in the shorter box, so nothing is lost. */
const KIT_BOX = 'relative h-40 overflow-hidden rounded-md bg-paper sm:aspect-square sm:h-auto';

/** Card height is FIXED so cards don't resize as you swipe between products with
 *  different variant counts (D). Owned by the track as well as the card, so the
 *  two can't drift: mobile is 37rem because the square media box and the image
 *  dots together added ~30px over the original 34, which clipped the "Sold by"
 *  line on the longest slides. */
const CARD_H = 'h-[37rem] sm:h-[25rem]';

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
  { key: 'preventive', label: 'Preventive care', icon: Heartbeat, types: ['Flea treatment', 'Dewormer', 'Spot-on', 'Preventive care'] },
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
 *  arrow left/right, wrapping in both directions, with a miniature indicator up
 *  top showing every group in the collection and which one you're inside.
 *
 *  A transform track rather than a scroll-snap rail (rewritten 19 Jul 2026, D
 *  reported both symptoms). The rail derived `active` from scrollLeft, which
 *  caused two bugs at once:
 *    1. no wrap, because native scroll cannot continue past either end, and the
 *       arrows were clamped and disabled there;
 *    2. a flickering counter, because a smooth programmatic scroll fires `scroll`
 *       continuously and `Math.round(scrollLeft / clientWidth)` walked through
 *       every index in between before settling.
 *  Here `active` is plain state that only `go()` changes, so an intermediate
 *  value is not merely unlikely, it is unrepresentable. Same reasoning as
 *  Gallery.tsx, and the offset below is wrapped to the SHORTEST path so the last
 *  slide hands over to the first by sliding one step, not sweeping back
 *  through all twelve. */
export function KitCarousel({ slides: input }: { slides: KitSlide[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);

  // Mobile only: shrink the card so the previous/next slide peeks in at each edge,
  // a wordless "there's more, swipe" cue (D, 24 Jul). Desktop keeps one full card
  // + arrows. PEEK_STEP must equal the card width % so neighbours touch, not overlap.
  const [peek, setPeek] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const sync = () => setPeek(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  const PEEK_STEP = 86; // card width %, leaves a ~7% sliver of each neighbour

  // stable sort into group order, so each group's slides are contiguous and the
  // indicator can advance cleanly as you swipe
  const slides = [...input]
    .map((s, i) => ({ s, i, g: groupIndex(s.itemType) }))
    .sort((a, b) => a.g - b.g || a.i - b.i)
    .map((x) => x.s);

  const n = slides.length;

  // only groups that actually have items, each with the slide it starts at
  const groups = KIT_GROUPS.map((g, gi) => ({
    ...g,
    firstSlide: slides.findIndex((s) => groupIndex(s.itemType) === gi),
    count: slides.filter((s) => groupIndex(s.itemType) === gi).length,
  })).filter((g) => g.count > 0);

  const activeGroup = slides[active] ? groupIndex(slides[active].itemType) : 0;

  const go = useCallback((next: number) => setActive(((next % n) + n) % n), [n]);

  function onPointerDown(e: React.PointerEvent) {
    if (n < 2) return;
    startX.current = e.clientX;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (startX.current !== null) setDrag(e.clientX - startX.current);
  }
  function onPointerUp() {
    if (startX.current === null) return;
    const w = track.current?.clientWidth ?? 1;
    if (Math.abs(drag) > w * 0.2) go(active + (drag < 0 ? 1 : -1));
    startX.current = null;
    setDragging(false);
    setDrag(0);
  }
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); }
  }

  return (
    <div>
      {/* indicator: one mark per group, lit for whichever group you're inside */}
      <div className="flex flex-wrap items-center justify-center gap-2.5" role="tablist" aria-label="Kit sections">
        {groups.map((g) => {
          const Icon = g.icon;
          const on = activeGroup === KIT_GROUPS.findIndex((k) => k.key === g.key);
          return (
            <span key={g.key} className="group relative flex">
              <button
                type="button"
                role="tab"
                aria-selected={on}
                aria-label={`${g.label}, ${g.count} ${g.count === 1 ? 'essential' : 'essentials'}`}
                onClick={() => go(g.firstSlide)}
                className={`flex h-11 w-11 items-center justify-center rounded-md border transition-all duration-150 ease-out ${
                  on
                    ? 'border-petal bg-petal text-graphite shadow-raised'
                    : 'border-seashell/25 text-petal/70 hover:border-petal/60 hover:text-petal'
                }`}
              >
                <Icon size={22} aria-hidden />
              </button>
              {/* names the group on hover/focus: seven glyphs alone are a guessing
                  game (D, 19 Jul 2026). Petal on graphite, since the stepper's
                  graphite tooltip would vanish into this band. */}
              <span
                role="tooltip"
                className="pointer-events-none absolute left-1/2 top-[calc(100%+9px)] z-tooltip -translate-x-1/2 whitespace-nowrap rounded-md bg-petal px-2.5 py-1 font-sans text-xs font-medium text-graphite opacity-0 shadow-raised-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
              >
                <span aria-hidden className="absolute bottom-full left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1 rotate-45 bg-petal" />
                {g.label}
              </span>
            </span>
          );
        })}
      </div>
      <p className="mt-2.5 text-center font-sans text-xs text-seashell/70" aria-live="polite">
        {active + 1} of {slides.length}
      </p>
      <p className="sr-only">{slides[active]?.title}</p>

      {/* the track: one slide in view, the rest parked either side */}
      <div className="relative mt-5">
        <div
          ref={track}
          role="group"
          aria-roledescription="carousel"
          aria-label="Starter kit"
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          className={`relative touch-pan-y select-none overflow-hidden ${CARD_H}`}
        >
          {slides.map((s, i) => {
            // shortest path: at the seam the incoming slide sits one step away
            // rather than eleven, so the wrap animates like any other step
            let offset = i - active;
            if (offset > n / 2) offset -= n;
            if (offset < -n / 2) offset += n;
            const step = peek ? PEEK_STEP : 100;
            const pct = offset * step + (drag / (track.current?.clientWidth || 1)) * 100;
            return (
              <div
                key={s.key}
                className="absolute inset-0 flex justify-center px-1 transition-transform duration-300 ease-out motion-reduce:transition-none sm:px-10"
                style={{
                  transform: `translateX(${pct}%)`,
                  // keep the neighbours mounted so a drag reveals them, park the rest
                  visibility: Math.abs(offset) <= 1 ? 'visible' : 'hidden',
                  // only the active slide takes pointer events — otherwise the peeking
                  // neighbours sit over the active card's edges and swallow clicks on its
                  // image arrows / swipes (D, 24 Jul)
                  pointerEvents: offset === 0 ? undefined : 'none',
                  ...(dragging ? { transitionDuration: '0ms' } : null),
                }}
                aria-hidden={i !== active}
              >
                <div className={`h-full ${peek ? 'w-[86%]' : 'w-full'}`}>
                  <KitSlideCard slide={s} />
                </div>
              </div>
            );
          })}
        </div>

        {/* pointer/keyboard arrows: never disabled, the collection wraps */}
        <button
          type="button"
          aria-label="Previous item"
          onClick={() => go(active - 1)}
          className="absolute -left-1 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center text-petal/80 transition-colors hover:text-petal sm:flex"
        >
          <CaretLeft size={22} weight="bold" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Next item"
          onClick={() => go(active + 1)}
          className="absolute -right-1 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center text-petal/80 transition-colors hover:text-petal sm:flex"
        >
          <CaretRight size={22} weight="bold" aria-hidden />
        </button>
      </div>
    </div>
  );
}

/** The product's own photos, swipeable inside the kit card and wrapping at both
 *  ends (D, 19 Jul 2026). `touch-pan-y` keeps a horizontal drag here from
 *  scrolling the parent rail, so the two carousels never fight. */
function SlideImages({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const box = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);

  const n = images.length;
  const go = (next: number) => setActive(((next % n) + n) % n);

  function onPointerDown(e: React.PointerEvent) {
    if (n < 2) return;
    // this photo strip sits INSIDE the product track: without this, one drag
    // would advance the image and the product at the same time
    e.stopPropagation();
    startX.current = e.clientX;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (startX.current !== null) setDrag(e.clientX - startX.current);
  }
  function onPointerUp() {
    if (startX.current === null) return;
    const width = box.current?.clientWidth ?? 1;
    if (Math.abs(drag) > width * 0.2) go(active + (drag < 0 ? 1 : -1));
    startX.current = null;
    setDragging(false);
    setDrag(0);
  }

  if (!n) {
    return (
      <div className={`flex items-center justify-center ${KIT_BOX}`}>
        <Image src={STAMP} alt="" width={96} height={83} className="opacity-35" aria-hidden />
      </div>
    );
  }

  return (
    <div>
      <div
        ref={box}
        role={n > 1 ? 'group' : undefined}
        aria-roledescription={n > 1 ? 'carousel' : undefined}
        aria-label={n > 1 ? alt : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`touch-pan-y select-none ${KIT_BOX}`}
      >
        {images.map((src, i) => {
          const offset = i - active;
          const pct = offset * 100 + (drag / (box.current?.clientWidth || 1)) * 100;
          return (
            <div
              key={`${src}-${i}`}
              className="absolute inset-0 transition-transform duration-200 ease-out"
              style={{
                transform: `translateX(${pct}%)`,
                visibility: Math.abs(offset) <= 1 ? 'visible' : 'hidden',
                ...(dragging ? { transitionDuration: '0ms' } : null),
              }}
              aria-hidden={i !== active}
            >
              {failed[i] ? (
                <div className="flex h-full items-center justify-center">
                  <Image src={STAMP} alt="" width={96} height={83} className="opacity-35" aria-hidden />
                </div>
              ) : (
                <Image
                  src={src}
                  alt={i === active ? alt : ''}
                  fill
                  sizes="(min-width: 640px) 35vw, 90vw"
                  className={`${MEDIA_FIT} p-2`}
                  onError={() => setFailed((f) => ({ ...f, [i]: true }))}
                  draggable={false}
                />
              )}
            </div>
          );
        })}

        {n > 1 && (
          <>
            <KitImageArrow side="left" onClick={() => go(active - 1)} />
            <KitImageArrow side="right" onClick={() => go(active + 1)} />
          </>
        )}
      </div>

      {n > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {images.map((src, i) => (
            <button
              key={`${src}-dot-${i}`}
              type="button"
              aria-label={`Image ${i + 1} of ${n}`}
              aria-current={i === active}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all duration-150 ${
                i === active ? 'w-4 bg-iron' : 'w-1.5 bg-hairline-strong hover:bg-iron/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function KitImageArrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? CaretLeft : CaretRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous image' : 'Next image'}
      className={`absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint opacity-60 transition-all duration-150 hover:bg-paper/80 hover:text-ink hover:opacity-100 focus-visible:bg-paper/80 focus-visible:text-ink focus-visible:opacity-100 active:scale-95 active:bg-paper active:text-ink active:opacity-100 ${
        side === 'left' ? 'left-0.5' : 'right-0.5'
      }`}
    >
      <Icon size={14} aria-hidden />
    </button>
  );
}

function KitSlideCard({ slide }: { slide: KitSlide }) {
  const [activeId, setActiveId] = useState(slide.variants[0].id);
  const v = slide.variants.find((x) => x.id === activeId) ?? slide.variants[0];
  const sub = brandLine(v.brand, v.variant, slide.variants.length > 1);

  // shared product context for this slide's CTAs (starter-kit section)
  const productParams = {
    page: 'starter-kit',
    section: 'kit_slide',
    product_id: v.id,
    product_title: slide.title,
    product_brand: v.brand,
    product_variant: v.variant,
    product_category: v.itemCategory,
  };

  return (
    <article className="h-full">
      {/* height comes from CARD_H on the track, so the two cannot disagree */}
      <div className="grain relative flex h-full flex-col justify-center overflow-hidden rounded-lg border border-hairline bg-paper p-5 shadow-raised-lg sm:p-7">
        <div className="grid gap-6 sm:grid-cols-[2fr_3fr] sm:items-center">
          {/* keyed on the variant so switching resets to its first photo */}
          <SlideImages
            key={v.id}
            images={v.images}
            alt={`${slide.title}${sub ? `, ${sub}` : ''}`}
          />
          <div>
            <h3 className="font-serif text-2xl leading-tight text-ink sm:text-3xl">{slide.title}</h3>
            {sub && <p className="mt-1 text-sm text-ink-faint">{sub}</p>}
            <VariantSelector
              variants={slide.variants}
              activeId={v.id}
              onSelect={(id) => {
                track('variant_select', { product_id: id, page: 'starter-kit' });
                setActiveId(id);
              }}
            />
            <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-ink-muted sm:text-base">
              {v.description}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              {/* View pick is the PRIMARY, on the left, matching the Curated Essentials
                  thumbnails; "Where to get this" is the secondary outline on its right */}
              <Link
                href={`/curated-essentials/${v.id}`}
                onClick={() => track('cta_click', { cta_name: 'view_pick', cta_type: 'internal', ...productParams })}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-md bg-iron px-6 py-3 font-sans text-base font-semibold text-seashell shadow-raised transition-colors duration-150 ease-out hover:bg-iron-deep active:shadow-pressed"
              >
                View pick
                <ArrowUpRight size={17} weight="bold" aria-hidden />
              </Link>
              {v.hasBuyLink ? (
                <a
                  href={v.buyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    track('cta_click', {
                      cta_name: 'where_to_get_this',
                      cta_type: 'outbound',
                      ...productParams,
                      retailer: v.retailer,
                      in_starter_kit: v.inStarterKit,
                      destination: v.retailer,
                    })
                  }
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-md border border-iron/40 px-6 py-3 font-sans text-base font-medium text-iron transition-all duration-150 ease-out hover:border-iron hover:bg-iron/5 active:translate-y-px"
                >
                  Where to get this
                  <ArrowSquareOut size={17} aria-hidden />
                </a>
              ) : (
                // "free / not sold anywhere": no outbound CTA, the row's alt copy
                // carried with a confetti mark (D, 25 Jul 2026)
                <p className="inline-flex min-h-[48px] items-center gap-2 font-sans text-base font-medium text-iron">
                  <Confetti size={20} weight="fill" className="shrink-0 text-petal-deep" aria-hidden />
                  {v.buyNote}
                </p>
              )}
            </div>
            <p className="mt-2 text-xs text-ink-faint">
              {v.hasBuyLink
                ? `Sold by ${v.retailer}. Approved & curated by Whisker Wise.`
                : 'Loved by cats. Approved by Whisker Wise.'}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
