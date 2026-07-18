'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowSquareOut, ArrowUpRight, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { ItemTypeIcon } from './ItemTypeIcon';

/** One serialisable slide (computed server-side; no fs access here). */
export type KitSlide = {
  id: string;
  title: string;
  sub: string;
  itemType: string;
  description: string;
  buyUrl: string;
  retailer: string;
  image: string | null;
  placeholder: string;
};

/** The starter kit as a hamper you leaf through: one item at a time, swipe or
 *  arrow left/right, with a miniature indicator up top showing every item in the
 *  collection and which one you're on. Scroll-snap rail = native touch swiping;
 *  buttons + indicator cover pointer and keyboard. */
export function KitCarousel({ slides }: { slides: KitSlide[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

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
      {/* miniature indicator: every item in the kit, the current one lit */}
      <div className="flex items-center justify-center gap-2.5" role="tablist" aria-label="Kit items">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`${i + 1} of ${slides.length}: ${s.title}`}
            onClick={() => goTo(i)}
            className={`flex h-11 w-11 items-center justify-center rounded-md border transition-all duration-150 ease-out ${
              i === active
                ? 'border-petal bg-petal text-graphite shadow-raised'
                : 'border-seashell/25 text-petal/70 hover:border-petal/60 hover:text-petal'
            }`}
          >
            <ItemTypeIcon type={s.itemType} size={22} />
          </button>
        ))}
      </div>
      <p className="mt-2.5 text-center font-mono text-xs text-seashell/70" aria-live="polite">
        {active + 1} of {slides.length}
      </p>

      {/* the rail: full-width slides, snap per item */}
      <div className="relative mt-5">
        <div
          ref={rail}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((s) => (
            <article key={s.id} className="w-full shrink-0 snap-center px-1 sm:px-10">
              <div className="grain relative overflow-hidden rounded-lg border border-hairline bg-paper p-5 shadow-raised-lg sm:p-7">
                <div className="grid gap-6 sm:grid-cols-[2fr_3fr] sm:items-center">
                  <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-md bg-sel/40 sm:h-56">
                    {s.image ? (
                      <Image src={s.image} alt={`${s.title}${s.sub ? `, ${s.sub}` : ''}`} fill sizes="(min-width: 640px) 35vw, 90vw" className="object-cover" />
                    ) : (
                      <Image src={s.placeholder} alt="" width={96} height={96} className="opacity-35" aria-hidden />
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl leading-tight text-ink sm:text-3xl">{s.title}</h3>
                    {s.sub && <p className="mt-1 text-sm text-ink-faint">{s.sub}</p>}
                    <p className="mt-2.5 text-sm leading-relaxed text-ink-muted sm:text-base">{s.description}</p>
                    <div className="mt-5 flex flex-wrap items-center gap-4">
                      <a
                        href={s.buyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[48px] items-center gap-2 rounded-md bg-iron px-6 py-3 font-sans text-base font-semibold text-seashell shadow-raised transition-all duration-150 ease-out hover:bg-iron-deep active:shadow-pressed"
                      >
                        Buy now
                        <ArrowSquareOut size={18} weight="bold" aria-hidden />
                      </a>
                      <Link
                        href={`/curated-essentials/${s.id}`}
                        className="inline-flex min-h-[44px] items-center gap-1 font-sans text-sm font-semibold text-iron transition-colors hover:text-iron-deep"
                      >
                        View pick
                        <ArrowUpRight size={15} weight="bold" aria-hidden />
                      </Link>
                    </div>
                    <p className="mt-2 text-xs text-ink-faint">Sold by {s.retailer}.</p>
                  </div>
                </div>
              </div>
            </article>
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
