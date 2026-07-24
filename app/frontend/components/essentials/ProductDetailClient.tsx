'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowSquareOut, Confetti } from '@phosphor-icons/react';
import type { VariantDTO } from '@/lib/essentials-dto';
import { Gallery } from './Gallery';
import { VariantSelector } from './VariantSelector';
import { brandLine } from './product-label';

const STAMP = '/whisker-wise-logo-stamp-bw.png';

/** The interactive half of the PDP. Every variant keeps its own statically
 *  generated route, so links stay shareable and metadata stays per-variant;
 *  selecting one here swaps the content in place and rewrites the URL with
 *  replaceState (not pushState, so Back leaves the product rather than cycling
 *  through its variants). */
export function ProductDetailClient({
  title,
  itemType,
  variants,
  initialId,
}: {
  title: string;
  itemType: string;
  variants: VariantDTO[];
  initialId: string;
}) {
  const [activeId, setActiveId] = useState(initialId);
  const active = variants.find((v) => v.id === activeId) ?? variants[0];

  function select(id: string) {
    setActiveId(id);
    window.history.replaceState(null, '', `/curated-essentials/${id}`);
  }

  const sub = brandLine(active.brand, active.variant, variants.length > 1);
  const alt = `${title}${active.brand ? `, ${active.brand}` : ''}`;

  return (
    <div className="mt-4 grid gap-8 md:grid-cols-2 md:gap-10">
      {/* media: gallery when real photos exist, quiet stamp panel until then */}
      {active.images.length ? (
        // remount on variant change so the carousel resets to the first image
        <Gallery key={active.id} images={active.images} alt={alt} />
      ) : (
        <div className="flex aspect-square items-center justify-center rounded-lg border border-hairline bg-sel/40 shadow-raised">
          <Image src={STAMP} alt="" width={160} height={139} className="opacity-35" aria-hidden />
        </div>
      )}

      {/* info: solid card on the grid paper (text never sits on texture) */}
      <div className="rounded-lg border border-hairline bg-paper p-6 shadow-raised sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-sm bg-petal px-2 py-0.5 text-xs font-medium text-graphite">
            {itemType}
          </span>
          {active.inStarterKit && (
            <span className="rounded-sm bg-iron-tint px-2 py-0.5 text-xs font-medium text-iron">
              Starter-kit pick
            </span>
          )}
        </div>

        <h1 className="mt-3 font-serif text-3xl leading-tight text-ink sm:text-4xl">{title}</h1>
        {sub && <p className="mt-1.5 font-sans text-base text-ink-faint">{sub}</p>}

        {/* variants sit above the description (D, 18 Jul 2026) */}
        <VariantSelector variants={variants} activeId={active.id} onSelect={select} />

        {/* the curation reason, not a spec sheet: this is the one place the
            judgement behind the list is stated out loud (D, 19 Jul 2026). The
            pink rule sits beside the reason only, not the header (D, 24 Jul). */}
        <div id="why" className="mt-5 scroll-mt-28">
          <p className="font-sans text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Why we chose this
          </p>
          <p className="mt-1.5 max-w-prose whitespace-pre-line border-l-2 border-petal-deep pl-4 text-base leading-relaxed text-ink">
            {active.whyChosen}
          </p>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
          {/* deliberately SECONDARY, not primary (D, 19 Jul 2026): Whisker Wise
              curates, it does not sell, so the outbound link should not be the
              loudest thing on the page. Outline rather than a solid plate, but
              carried in iron rather than the system's graphite secondary, so it
              still reads as the action (D). Iron on paper is 7.3:1. */}
          {active.hasBuyLink ? (
            <a
              href={active.buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-md border border-iron/40 px-6 py-3 font-sans text-base font-medium text-iron transition-all duration-150 ease-out hover:border-iron hover:bg-iron/5 active:translate-y-px"
            >
              Where to get this
              <ArrowSquareOut size={17} aria-hidden />
            </a>
          ) : (
            // "free / not sold anywhere": no outbound CTA, just the row's own
            // alt copy carried with a confetti mark (D, 25 Jul 2026)
            <p className="inline-flex min-h-[48px] items-center gap-2 font-sans text-base font-medium text-iron">
              <Confetti size={20} weight="fill" className="shrink-0 text-petal-deep" aria-hidden />
              {active.buyNote}
            </p>
          )}
          {active.inStarterKit && (
            // text-only tertiary, no plate: matched to the primary's height so
            // the two read as one row rather than two competing blocks (D).
            // Dotted underline so it reads as the quieter, secondary action (D, 24 Jul).
            <Link
              href="/curated-essentials/starter-kit"
              className="inline-flex min-h-[48px] items-center px-1 font-sans text-base font-semibold text-iron underline decoration-dotted decoration-iron/60 underline-offset-4 transition-colors duration-150 hover:text-iron-deep hover:decoration-iron"
            >
              View starter-kit
            </Link>
          )}
        </div>

        {/* the independence claim sits with the retailer line, where the buy
            link makes a reader wonder about it (D, 19 Jul 2026). With no buy
            link there is nothing to sell, so we affirm the pick instead (D, 25 Jul). */}
        <p className="mt-2.5 text-sm text-ink-faint">
          {active.hasBuyLink
            ? `Sold by ${active.retailer}. No brand pays to be on this list.`
            : 'Loved by cats. Approved by Whisker Wise.'}
        </p>
      </div>
    </div>
  );
}
