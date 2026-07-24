import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import { Footer } from '@/components/wiser/Footer';
import { KitCarousel, type KitSlide } from '@/components/essentials/KitCarousel';
import { getStarterKit } from '@/lib/catalogue';
import { toVariantDTOs } from '@/lib/essentials-dto';

export const metadata = {
  title: 'New cat parent starter kit | Curated Essentials',
  description:
    'Day one, sorted: one trusted pick for each essential a new cat parent needs, gathered as one kit. Swipe through and buy each at the source.',
};

/** The starter kit as a collection page (Curated_Essentials_PRD.md §3.1): opens
 *  like a PDP but keeps the dark collection theme from the catalogue band, so a
 *  kit reads differently from a single product. One item at a time, swipeable,
 *  with the whole hamper visible in miniature up top. */
export default function StarterKit() {
  // one slide per unique title, variants chosen inside the slide (D, 18 Jul 2026)
  const slides: KitSlide[] = getStarterKit().map((group) => ({
    key: group.key,
    title: group.title,
    itemType: group.item_type,
    variants: toVariantDTOs(group),
  }));

  return (
    <main className="flex min-h-screen flex-col bg-graphite pt-16 sm:pt-[72px] lg:pt-20">
      <div className="mx-auto w-full max-w-4xl flex-1 px-5 pb-16 pt-8 sm:pt-10">
        <Link
          href="/curated-essentials"
          className="inline-flex min-h-[44px] items-center gap-1.5 font-sans text-sm font-semibold text-petal transition-colors hover:text-petal-deep"
        >
          <ArrowLeft size={16} weight="bold" aria-hidden />
          Curated Essentials
        </Link>

        <div className="mt-3 text-center">
          <h1 className="font-serif text-3xl leading-tight text-petal sm:text-4xl">
            New cat parent? We got you.
          </h1>
          <p className="mx-auto mt-2.5 max-w-lg text-base leading-relaxed text-seashell/90">
            Trusted picks to get you set-up. Swipe through the selection, here&apos;s everything
            you&apos;ll need to welcome your cat home.
          </p>
        </div>

        <div className="mt-8">
          <KitCarousel slides={slides} />
        </div>
      </div>
      <Footer />
    </main>
  );
}
