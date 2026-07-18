import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { WiggleDivider } from '@/components/wiser/WiggleDivider';
import { Footer } from '@/components/wiser/Footer';
import { ProductCard } from '@/components/essentials/ProductCard';
import { getCatalogue } from '@/lib/catalogue';

export const metadata = {
  title: 'Curated Essentials | Whisker Wise',
  description:
    'Cat-life essentials by need: litter to carriers, curated with a decade of cat care behind them and linked straight to where they’re sold.',
};

/** Curated Essentials catalogue (Curated_Essentials_PRD.md §7.1).
 *  Petal + iron identity on the shared neutrals: paws-painting hero, starter-kit
 *  band in graphite with petal accents, then category sections on seashell.
 *  Sections render only when they hold ≥1 active item (§6). */
export default function CuratedEssentials() {
  const { starterKit, sections } = getCatalogue();

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
          className="object-cover object-[70%_center]"
          aria-hidden
        />
        {/* left wash for text legibility: petal/seashell on graphite (approved pairing) */}
        <div className="absolute inset-0 bg-gradient-to-r from-graphite/85 via-graphite/55 to-transparent" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-5 py-16 sm:py-20"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
          <h1 className="font-serif text-[clamp(2.5rem,5.5vw,3.75rem)] leading-[1.05] text-seashell">
            Essentials
          </h1>
          <p className="mt-2 font-hand text-2xl text-petal">Curated with care. Trusted by whiskers.</p>
          <p className="mt-4 max-w-md text-base leading-relaxed text-seashell">
            No more searching for hours: everything here is vetted as safe and good for your cat.
            Each one links straight to where it&apos;s sold.
          </p>
        </div>
      </section>

      {/* ── Starter kit: cross-need collection, one pick per essential (§3.1) ── */}
      {starterKit.length > 0 && (
        <div className="bg-graphite">
          <section className="mx-auto max-w-4xl px-5 pb-12 pt-10 sm:pt-12" aria-labelledby="starter-kit">
            <h2 id="starter-kit" className="font-serif text-3xl text-petal sm:text-4xl">
              New cat parent starter kit
            </h2>
            <p className="mt-2 max-w-lg text-base leading-relaxed text-seashell/90">
              Day one, sorted: one trusted pick for each essential, so you can focus on the cat.
            </p>
            <div className="scrollbar-thin -mx-1 mt-7 flex gap-4 overflow-x-auto px-1 pb-3">
              {starterKit.map((item) => (
                <div key={item.id} className="w-48 shrink-0">
                  <ProductCard item={item} compact />
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

      {/* ── Category sections (order per lib/catalogue CATEGORY_ORDER) ── */}
      <section className="bg-seashell px-5 pb-20 pt-12">
        <div className="mx-auto max-w-4xl space-y-14">
          {sections.map(({ category, items }) => (
            <section key={category} aria-labelledby={`cat-${category}`}>
              <div className="flex items-baseline justify-between border-b border-hairline pb-3">
                <h2 id={`cat-${category}`} className="font-serif text-2xl text-ink sm:text-3xl">
                  {category}
                </h2>
                <p className="font-mono text-sm text-ink-faint">
                  {items.length} {items.length === 1 ? 'pick' : 'picks'}
                </p>
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <ProductCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
