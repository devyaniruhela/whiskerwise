import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { WiggleDivider } from '@/components/wiser/WiggleDivider';
import { Footer } from '@/components/wiser/Footer';
import { ProductCard } from '@/components/essentials/ProductCard';
import {
  EssentialsFilterProvider,
  BrowseCount,
  BROWSE_ID,
  type CardMeta,
} from '@/components/essentials/EssentialsFilterProvider';
import { NeedTiles } from '@/components/essentials/NeedTiles';
import { BrowseAllGrid } from '@/components/essentials/BrowseAllGrid';
import { categorySlug, getGroups, getNeeds, getStarterKit, groupHiddenWhenKitten } from '@/lib/catalogue';

export const metadata = {
  title: 'Curated Essentials | Whisker Wise',
  description:
    'Cat-life essentials by need: litter to carriers, curated with a decade of cat care behind them and linked straight to where they’re sold.',
};

/** Curated Essentials catalogue (Curated_Essentials_PRD.md §7.1).
 *  Hero → starter kit → shop by need → browse all. The old stacked per-category
 *  sections are gone: the need filter does that job without listing every
 *  product twice on one page (D, 18 Jul 2026).
 *
 *  Stays a server component. Only the filter state is client-side, and the cards
 *  are handed to BrowseAllGrid as children so they are never re-rendered. */
export default function CuratedEssentials() {
  const groups = getGroups();
  const needs = getNeeds();
  const starterKit = getStarterKit();

  const meta: CardMeta[] = groups.map((g) => ({
    key: g.key,
    categorySlug: categorySlug(g.item_category),
    kittenHidden: groupHiddenWhenKitten(g),
  }));

  return (
    <main className="pt-16 sm:pt-[72px] lg:pt-20">
      {/* ── Hero: the pink toe-beans painting IS the section's palette ── */}
      <section className="relative overflow-hidden bg-graphite">
        <Image
          src="/curated-essentials-hero-card.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          aria-hidden
        />
        {/* flat graphite veil, not a directional gradient: the fade used to cut
            across the paws and read as a smudge (D, 18 Jul 2026) */}
        <div className="absolute inset-0 bg-graphite/70" aria-hidden />
        <div
          className="relative mx-auto max-w-4xl px-5 py-16 sm:py-20"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
        >
          <h1 className="font-serif text-[clamp(2.5rem,5.5vw,3.75rem)] leading-[1.05] text-seashell">
            Essentials
          </h1>
          <p className="mt-2 font-hand text-2xl text-petal">Curated with care. Trusted by whiskers.</p>
          <p className="mt-4 max-w-md text-base leading-relaxed text-seashell">
            No more doubt and searching for hours: what to buy and where to get, vetted to be safe
            and good for your cat. Unsponsored.
          </p>
        </div>
      </section>

      {/* ── Starter kit: cross-need collection, one tile per title (§3.1) ── */}
      {starterKit.length > 0 && (
        <div className="bg-graphite-grain">
          <section className="mx-auto max-w-4xl px-5 pb-12 pt-10 sm:pt-12" aria-labelledby="starter-kit">
            <div className="flex items-baseline justify-between gap-4 border-b border-seashell/20 pb-3">
              <h2 id="starter-kit" className="font-serif text-3xl text-petal sm:text-4xl">
                New cat parent starter kit
              </h2>
              {/* "essentials", not "items": the count is a judgement about what a
                  cat actually needs, not an inventory figure (D, 19 Jul 2026) */}
              <p className="shrink-0 font-sans text-sm text-seashell/70">
                {starterKit.length} {starterKit.length === 1 ? 'essential' : 'essentials'}
              </p>
            </div>
            <p className="mt-3 max-w-lg text-base leading-relaxed text-seashell/90">
              Day one, sorted: one trusted pick for each essential, so you can focus on the cat.
            </p>
            <div className="scrollbar-thin -mx-1 mt-7 flex gap-4 overflow-x-auto px-1 pb-3">
              {starterKit.map((group) => (
                <div key={group.key} className="w-48 shrink-0">
                  <ProductCard group={group} compact />
                </div>
              ))}
            </div>
            <Link
              href="/curated-essentials/starter-kit"
              className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-md border border-petal/60 px-6 py-3 font-sans text-base font-semibold text-petal transition-colors duration-150 hover:bg-petal hover:text-graphite"
            >
              View the full kit
              <ArrowRight size={18} weight="bold" aria-hidden />
            </Link>
          </section>
          <WiggleDivider stroke="292C2C" />
        </div>
      )}

      <EssentialsFilterProvider needs={needs} meta={meta}>
        <div className="bg-seashell px-5 pb-20 pt-12">
          <div className="mx-auto max-w-4xl space-y-14">
            {/* ── Shop by need ── */}
            <section aria-labelledby="shop-by-need">
              <div className="flex items-baseline justify-between gap-4 border-b border-hairline pb-3">
                <h2 id="shop-by-need" className="font-serif text-2xl text-ink sm:text-3xl">
                  Shop by need
                </h2>
                <p className="shrink-0 font-sans text-sm text-ink-faint">
                  {needs.length} {needs.length === 1 ? 'need' : 'needs'}
                </p>
              </div>
              <NeedTiles />
            </section>

            {/* ── Browse all ── */}
            <section id={BROWSE_ID} aria-labelledby="browse-all-heading" className="scroll-mt-24">
              <div className="flex items-baseline justify-between gap-4 border-b border-hairline pb-3">
                <h2 id="browse-all-heading" className="font-serif text-2xl text-ink sm:text-3xl">
                  Browse all essentials
                </h2>
                <p className="shrink-0 font-sans text-sm text-ink-faint">
                  <BrowseCount />
                </p>
              </div>
              <BrowseAllGrid>
                {groups.map((group) => (
                  <ProductCard key={group.key} group={group} />
                ))}
              </BrowseAllGrid>
            </section>
          </div>
        </div>
      </EssentialsFilterProvider>

      <Footer />
    </main>
  );
}
