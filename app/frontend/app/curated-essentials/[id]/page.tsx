import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowSquareOut } from '@phosphor-icons/react/dist/ssr';
import { Footer } from '@/components/wiser/Footer';
import { Gallery } from '@/components/essentials/Gallery';
import { buyHref, getAllIds, getItem, productImages, retailerName, PLACEHOLDER_IMAGE } from '@/lib/catalogue';

/** Product detail (Curated_Essentials_PRD.md §7.2): statically generated per id.
 *  Need-led hierarchy: the use-case (`title`) is the headline; brand + variant sit
 *  beneath. Buy now is the only outbound step; Whisker Wise handles no payment. */

export function generateStaticParams() {
  return getAllIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getItem(id);
  if (!item) return { title: 'Curated Essentials | Whisker Wise' };
  const sub = [item.brand, item.variant].filter(Boolean).join(' · ');
  return {
    title: `${item.title}${sub ? ` (${sub})` : ''} | Curated Essentials`,
    description: item.description,
  };
}

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getItem(id);
  if (!item) notFound();

  const images = productImages(item);
  const sub = [item.brand, item.variant].filter(Boolean).join(' · ');
  const retailer = retailerName(item);

  return (
    <main className="pt-16 sm:pt-[72px] lg:pt-20">
      <div className="bg-grid-paper">
        <div className="mx-auto max-w-4xl px-5 pb-16 pt-8 sm:pt-10">
          <Link
            href="/curated-essentials"
            className="inline-flex min-h-[44px] items-center gap-1.5 font-sans text-sm font-semibold text-iron transition-colors hover:text-iron-deep"
          >
            <ArrowLeft size={16} weight="bold" aria-hidden />
            Curated Essentials
          </Link>

          <div className="mt-4 grid gap-8 md:grid-cols-2 md:gap-10">
            {/* media: gallery when real images exist, tinted item-type panel until then */}
            {images.length ? (
              <Gallery images={images} alt={`${item.title}${sub ? `, ${sub}` : ''}`} />
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-lg border border-hairline bg-sel/40 shadow-raised">
                <Image src={PLACEHOLDER_IMAGE} alt="" width={160} height={160} className="opacity-35" aria-hidden />
              </div>
            )}

            {/* info: solid card on the grid paper (text never sits on texture) */}
            <div className="rounded-lg border border-hairline bg-paper p-6 shadow-raised sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                {!item.title.toLowerCase().includes(item.item_type.toLowerCase()) && (
                  <span className="rounded-sm bg-petal px-2 py-0.5 text-xs font-medium text-graphite">
                    {item.item_type}
                  </span>
                )}
                {item.in_starter_kit && (
                  <span className="rounded-sm bg-iron-tint px-2 py-0.5 text-xs font-medium text-iron">
                    Starter-kit pick
                  </span>
                )}
              </div>
              <h1 className="mt-3 font-serif text-3xl leading-tight text-ink sm:text-4xl">
                {item.title}
              </h1>
              {sub && <p className="mt-1.5 font-sans text-base text-ink-faint">{sub}</p>}
              <p className="mt-4 max-w-prose text-base leading-relaxed text-ink-muted">
                {item.description}
              </p>

              <a
                href={buyHref(item)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex min-h-[48px] items-center gap-2 rounded-md bg-iron px-7 py-3 font-sans text-base font-semibold text-seashell shadow-raised transition-all duration-150 ease-out hover:bg-iron-deep active:shadow-pressed"
              >
                Buy now
                <ArrowSquareOut size={18} weight="bold" aria-hidden />
              </a>
              <p className="mt-2.5 text-sm text-ink-faint">
                Sold by {retailer}. Whisker Wise recommends and links; the purchase happens there.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
