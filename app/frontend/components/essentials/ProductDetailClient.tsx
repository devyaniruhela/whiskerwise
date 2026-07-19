'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowSquareOut } from '@phosphor-icons/react';
import type { VariantDTO } from '@/lib/essentials-dto';
import { Gallery } from './Gallery';
import { VariantSelector } from './VariantSelector';

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

  const sub = [active.brand, variants.length > 1 ? '' : active.variant].filter(Boolean).join(' · ');
  const showType = !title.toLowerCase().includes(itemType.toLowerCase());
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
          {showType && (
            <span className="rounded-sm bg-petal px-2 py-0.5 text-xs font-medium text-graphite">
              {itemType}
            </span>
          )}
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

        <p className="mt-4 max-w-prose whitespace-pre-line text-base leading-relaxed text-ink-muted">
          {active.description}
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
          <a
            href={active.buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-md bg-iron px-7 py-3 font-sans text-base font-semibold text-seashell shadow-raised transition-all duration-150 ease-out hover:bg-iron-deep active:shadow-pressed"
          >
            Buy now
            <ArrowSquareOut size={18} weight="bold" aria-hidden />
          </a>
          {active.inStarterKit && (
            // text-only tertiary, no plate: matched to the primary's height so
            // the two read as one row rather than two competing blocks (D)
            <Link
              href="/curated-essentials/starter-kit"
              className="inline-flex min-h-[48px] items-center px-1 font-sans text-base font-semibold text-iron underline decoration-iron/40 underline-offset-4 transition-colors duration-150 hover:text-iron-deep hover:decoration-iron"
            >
              View starter-kit
            </Link>
          )}
        </div>

        <p className="mt-2.5 text-sm text-ink-faint">
          Sold by {active.retailer}. Approved &amp; curated by Whisker Wise.
        </p>
      </div>
    </div>
  );
}
