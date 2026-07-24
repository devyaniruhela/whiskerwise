import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import { Footer } from '@/components/wiser/Footer';
import { ProductDetailClient } from '@/components/essentials/ProductDetailClient';
import { getAllIds, getGroupByItemId, getItem } from '@/lib/catalogue';
import { toVariantDTOs } from '@/lib/essentials-dto';
import { brandLine } from '@/components/essentials/product-label';

/** Product detail (Curated_Essentials_PRD.md §7.2): statically generated per id.
 *  Need-led hierarchy: the use-case (`title`) is the headline; brand sits beneath
 *  and the variant is chosen in the page. "Where to get it" is the only outbound
 *  step, and it is deliberately a secondary CTA: the reason for the pick leads.
 *
 *  One route per VARIANT, not per product: every existing /curated-essentials/<id>
 *  link keeps working, each variant keeps its own metadata and canonical, and the
 *  client shell swaps between siblings without a navigation. */

export function generateStaticParams() {
  return getAllIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getItem(id);
  if (!item) return { title: 'Curated Essentials | Whisker Wise' };
  // same rule as the on-page sub-line, so the tab title can't read "Savic · Savic"
  const sub = brandLine(item.brand, item.variant, false);
  return {
    title: `${item.title}${sub ? ` (${sub})` : ''} | Curated Essentials`,
    description: item.description,
    alternates: { canonical: `/curated-essentials/${id}` },
  };
}

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = getGroupByItemId(id);
  if (!group) notFound();

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

          <ProductDetailClient
            title={group.title}
            itemType={group.item_type}
            variants={toVariantDTOs(group)}
            initialId={id}
          />
        </div>
      </div>

      <Footer />
    </main>
  );
}
