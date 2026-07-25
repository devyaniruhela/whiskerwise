import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import type { VariantGroup } from '@/lib/catalogue';
import { productImages, PLACEHOLDER_IMAGE } from '@/lib/catalogue';
import { ProductImage } from './ProductImage';
import { MEDIA_BOX, MEDIA_PAD } from './media';
import { brandLine } from './product-label';

/** One tile = one product, not one CSV row: near-duplicate rows (Steel / Glass /
 *  Plastic) collapse into a single card that advertises how many variants sit
 *  inside. Petal/iron identity is carried by the FRAME (chip, link, hover ring),
 *  never the media fill, so it holds up behind real photography.
 *
 *  SERVER component: it reads lib/catalogue (which imports fs). Client
 *  components must receive it as `children`, never import it. */
export function ProductCard({ group, compact = false }: { group: VariantGroup; compact?: boolean }) {
  const item = group.primary;
  const images = productImages(item);
  const count = group.variants.length;
  // with a selector inside the product, the card leads on brand; variant is the
  // detail you choose there, so it would only add noise here
  const sub = brandLine(item.brand, item.variant, count > 1);

  return (
    <div className="group relative flex h-full flex-col rounded-lg border border-hairline bg-paper p-3 shadow-raised transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-iron/40 hover:shadow-raised-lg">
      {/* stretched primary link: clicking anywhere on the card (except the "Why we
          chose this" link below, which sits above it) opens the PDP at the top */}
      <Link
        href={`/curated-essentials/${item.id}`}
        aria-label={`${item.title} — view pick`}
        className="absolute inset-0 z-10 rounded-lg"
      />
      {/* media block: real photo when it exists, else the quiet stamp placeholder.
          Square + contain per media.ts, so the tall bags stay readable. */}
      <div className={`${MEDIA_BOX} ${MEDIA_PAD}`}>
        {images.length ? (
          <ProductImage
            src={images[0]}
            alt={`${item.title}${sub ? `, ${sub}` : ''}`}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Image
              src={PLACEHOLDER_IMAGE}
              alt=""
              width={compact ? 56 : 88}
              height={compact ? 56 : 88}
              className="opacity-35"
              aria-hidden
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1 pb-1">
        <div className={compact ? 'mt-2.5' : 'mt-3.5'}>
          <h3 className={`font-sans font-semibold text-ink ${compact ? 'text-sm' : 'text-lg'}`}>
            {item.title}
          </h3>
        </div>
        {/* metadata stays quiet: it was competing with the CTA for weight (D) */}
        {(sub || count > 1) && !compact && (
          <p className="mt-0.5 text-sm text-ink-faint">
            {[sub, count > 1 ? `${count} variants` : ''].filter(Boolean).join(' · ')}
          </p>
        )}
        {count > 1 && compact && <p className="mt-0.5 text-xs text-ink-faint">{count} variants</p>}
        {/* the reason replaces the blurb on the tile: it teases the curation
            rather than restating the pack, and the whole card already links to
            the PDP where the sentence itself lives (D, 19 Jul 2026). Styled as a
            link but rendered as a span, since it sits inside the card's <a>. */}
        {!compact && (
          // its own link (above the stretched one, z-20) so it opens the PDP scrolled
          // straight to the "Why we chose this" section (#why)
          <Link
            href={`/curated-essentials/${item.id}#why`}
            className="relative z-20 mt-1.5 inline-flex items-center gap-1 font-sans text-sm font-medium text-iron underline decoration-iron/30 underline-offset-4 transition-colors duration-150 hover:decoration-iron"
          >
            Why we chose this
            <ArrowRight
              size={13}
              weight="bold"
              aria-hidden
              className="transition-transform duration-150 ease-out group-hover:translate-x-0.5"
            />
          </Link>
        )}
        {/* the one action on the card, so it reads as the action. mt-auto pins it
            to the bottom; the pt- is a guaranteed gap from the text above so the
            CTA never crowds "Why we chose this" / the variant line (D, 24 Jul). */}
        <div className={`mt-auto ${compact ? 'pt-4' : 'pt-5'}`}>
          <span
            className={`flex w-full items-center justify-center gap-1.5 rounded-md bg-iron font-sans font-semibold text-seashell shadow-raised transition-colors duration-150 ease-out group-hover:bg-iron-deep ${
              compact ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'
            }`}
          >
            View pick
            <ArrowUpRight
              size={compact ? 13 : 15}
              weight="bold"
              aria-hidden
              className="transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </span>
        </div>
      </div>
    </div>
  );
}
