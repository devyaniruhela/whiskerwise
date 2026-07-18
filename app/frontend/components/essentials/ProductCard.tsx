import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import type { CatalogueItem } from '@/lib/catalogue';
import { productImages, PLACEHOLDER_IMAGE } from '@/lib/catalogue';

/** Petal/iron identity carried by the FRAME (chip, link, hover ring), not the
 *  media fill, so the design holds once real product photos replace the interim
 *  placeholder (Curated_Essentials_PRD.md §4: Cloudinary per-product folders).
 *  Until then every media block shows the b/w stamp, small and quiet. */
export function ProductCard({ item, compact = false }: { item: CatalogueItem; compact?: boolean }) {
  const images = productImages(item);
  const sub = [item.brand, item.variant].filter(Boolean).join(' · ');
  // the type chip only earns its place when the title doesn't already say it
  const showType = !item.title.toLowerCase().includes(item.item_type.toLowerCase());

  return (
    <Link
      href={`/curated-essentials/${item.id}`}
      className="group relative flex h-full flex-col rounded-lg border border-hairline bg-paper p-3 shadow-raised transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-iron/40 hover:shadow-raised-lg"
    >
      {/* media block: real image when it exists, else the quiet stamp placeholder */}
      <div className={`relative overflow-hidden rounded-md bg-sel/40 ${compact ? 'h-24' : 'h-40'}`}>
        {images.length ? (
          <Image
            src={images[0]}
            alt={`${item.title}${sub ? `, ${sub}` : ''}`}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            className="object-cover"
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
        {sub && !compact && <p className="mt-0.5 text-sm text-ink-faint">{sub}</p>}
        {!compact && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-muted">
            {item.description}
          </p>
        )}
        <span
          className={`mt-auto inline-flex items-center gap-1 pt-2.5 font-sans font-semibold text-iron transition-colors group-hover:text-iron-deep ${compact ? 'text-xs' : 'text-sm'}`}
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
