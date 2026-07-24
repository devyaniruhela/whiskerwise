import Image from 'next/image';
import Link from 'next/link';
import { Camera, ListMagnifyingGlass, Stamp, ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { WiggleDivider } from '@/components/wiser/WiggleDivider';
import { StandardsTooltip } from '@/components/wiser/StandardsTooltip';
import { Footer } from '@/components/wiser/Footer';

export const metadata = {
  title: 'Wiser | Whisker Wise',
  description:
    'Photograph a cat-food pack, get a plain-language Buy / Skip verdict grounded in published nutrition standards.',
};

// Placeholder icon blocks; real photos to be added by D. Pink (petal) is common to all three.
const STEPS = [
  {
    icon: Camera,
    block: 'bg-petal text-emerald',
    title: 'Photograph the pack',
    text: 'Front and back of the cat food, right there in the store aisle, or just a screenshot. The label can tell you a lot about what is inside.',
    tooltip: false,
  },
  {
    icon: ListMagnifyingGlass,
    block: 'bg-emerald text-petal',
    title: 'We read every line',
    text: 'We take all the information straight from the pack you share, then check every line against Indian, European and American pet-food standards.',
    tooltip: true,
  },
  {
    icon: Stamp,
    block: 'bg-graphite text-petal',
    title: 'Buy, or skip',
    text: 'Mixed with our secret sauce and years of pet-nutrition expertise, you get a clear verdict with every "why" rooted in science, personalised for your cat.',
    tooltip: false,
  },
];

export default function WiserNow() {
  return (
    <main>
      {/* grid-paper is scoped to the hero only, extending down to the squiggly divider.
          Grid now floats over a subtle paper grain (D, 24 Jul) so it matches the home
          hero's texture without losing the graph-paper lines. */}
      <div className="bg-grid-paper-grain">
        {/* ── Section 1 · hero: stamp left, intro + CTA right ─────────── */}
        <section className="relative px-5 pt-24 sm:pt-28">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 pb-14 text-center sm:pb-16 md:flex-row md:gap-12 md:text-left">
            <Image
              src="/whisker-wise-logo-stamp-bw.png"
              alt="Whisker Wise. Curated with care, trusted by whiskers."
              width={2000}
              height={1731}
              priority
              className="h-auto w-56 shrink-0 -rotate-3 sm:w-64 md:w-72 lg:w-[19rem]"
              style={{ filter: 'drop-shadow(0 10px 22px rgba(41,44,44,0.16))' }}
            />
            <div>
              <h1 className="font-serif text-[clamp(2.75rem,6vw,4rem)] leading-[1.02] text-ink">
                Meet <span className="text-emerald">Wiser</span>.
              </h1>
              <p className="mt-3 font-serif text-xl text-ink sm:text-2xl">Know what&apos;s good, before you buy.</p>
              <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-ink-muted md:mx-0">
                Photograph any cat-food pack and get a verdict rooted in published nutrition standards,
                not marketing.
              </p>
              <Link
                href="/food-input"
                className="mt-7 inline-flex min-h-[48px] items-center gap-2 rounded-md bg-emerald px-7 py-3 font-sans text-base font-semibold text-seashell shadow-raised transition-all duration-150 ease-out hover:bg-emerald-deep active:shadow-pressed"
              >
                Scan a pack
                <ArrowRight size={18} weight="bold" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        <WiggleDivider />
      </div>

      {/* ── Section 2 · what you get, in three steps (plain seashell) ─── */}
      <section className="relative bg-seashell px-5 pb-20 pt-14">
        <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-serif text-3xl text-ink sm:text-4xl">
              The label, decoded in a minute
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-center text-base leading-relaxed text-ink-muted">
              Pet-food labels are written to sell. Wiser reads them the way a nutritionist would, so
              you can decide in the aisle with confidence.
            </p>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {STEPS.map(({ icon: Icon, block, title, text, tooltip }) => (
                <div key={title} className="rounded-lg border border-hairline bg-paper p-3 shadow-raised">
                  <div className={`flex h-32 items-center justify-center rounded-md ${block}`}>
                    <Icon size={46} weight="regular" aria-hidden />
                  </div>
                  <h3 className="mt-4 px-1 font-serif text-xl text-ink">{title}</h3>
                  <p className="mb-2 mt-1.5 px-1 text-sm leading-relaxed text-ink-muted">
                    {text}
                    {tooltip && <StandardsTooltip />}
                  </p>
                </div>
              ))}
            </div>

            <p className="mx-auto mt-14 max-w-xl text-center font-serif text-2xl leading-snug text-ink">
              Facts are already on the label. Wiser helps you decide what you should be feeding{' '}
              <em className="italic">your cat</em>.
            </p>
            <div className="mt-7 text-center">
              <Link
                href="/food-input"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-md border border-graphite px-7 py-3 font-sans text-base font-semibold text-graphite transition-colors duration-150 hover:bg-sel/60"
              >
                Try it on your cat&apos;s food
              </Link>
            </div>
          </div>
        </section>

      <Footer />
    </main>
  );
}
