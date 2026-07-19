import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import type { VariantGroup } from '@/lib/catalogue';
import { productImages, PLACEHOLDER_IMAGE } from '@/lib/catalogue';
import { ProductImage } from './ProductImage';

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
  const sub = count > 1 ? item.brand : [item.brand, item.variant].filter(Boolean).join(' · ');
  // the type chip only earns its place when the title doesn't already say it
  const showType = !item.title.toLowerCase().includes(item.item_type.toLowerCase());

  return (
    <Link
      href={`/curated-essentials/${item.id}`}
      className="group relative flex h-full flex-col rounded-lg border border-hairline bg-paper p-3 shadow-raised transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-iron/40 hover:shadow-raised-lg"
    >
      {/* media block: real photo when it exists, else the quiet stamp placeholder */}
      <div className={`relative overflow-hidden rounded-md bg-sel/40 ${compact ? 'h-24' : 'h-40'}`}>
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
        <div className={`flex items-baseline justify-between gap-2 ${compact ? 'mt-2.5' : 'mt-3.5'}`}>
          <h3 className={`font-sans font-semibold text-ink ${compact ? 'text-sm' : 'text-lg'}`}>
            {item.title}
          </h3>
          {showType && (
            <span className="shrink-0 rounded-sm bg-petal px-1.5 py-0.5 text-[11px] font-medium leading-4 text-graphite">
              {item.item_type}
            </span>
          )}
        </div>
        {/* metadata stays quiet: it was competing with the CTA for weight (D) */}
        {(sub || count > 1) && !compact && (
          <p className="mt-0.5 text-sm text-ink-faint">
            {[sub, count > 1 ? `${count} variants` : ''].filter(Boolean).join(' · ')}
          </p>
        )}
        {count > 1 && compact && <p className="mt-0.5 text-xs text-ink-faint">{count} variants</p>}
        {!compact && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-muted">
            {item.description}
          </p>
        )}
        {/* the one action on the card, so it reads as the action */}
        <span
          className={`mt-auto flex items-center justify-center gap-1.5 rounded-md bg-iron font-sans font-semibold text-seashell shadow-raised transition-colors duration-150 ease-out group-hover:bg-iron-deep ${
            compact ? 'mt-3 px-3 py-2 text-xs' : 'mt-4 px-4 py-2.5 text-sm'
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
    </Link>
  );
}
