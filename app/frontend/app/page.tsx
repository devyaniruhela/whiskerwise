import Image from 'next/image';
import Link from 'next/link';
import { Camera, ListMagnifyingGlass, Stamp, InstagramLogo, WhatsappLogo, EnvelopeSimple, ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { WiggleDivider } from '@/components/wiser/WiggleDivider';

const STEPS = [
  {
    icon: Camera,
    block: 'bg-emerald text-seashell',
    tilt: '-rotate-1',
    title: 'Photograph the pack',
    text: 'Front and back, right there in the store aisle. We check your photos are readable before anything else.',
  },
  {
    icon: ListMagnifyingGlass,
    block: 'bg-petal text-graphite',
    tilt: 'rotate-1',
    title: 'We read every line',
    text: 'Ingredients, guaranteed analysis, life-stage claims — checked against IS-11968, FEDIAF and AAFCO, the published standards for cat food.',
  },
  {
    icon: Stamp,
    block: 'bg-graphite text-petal',
    tilt: '-rotate-1',
    title: 'Buy, or skip',
    text: 'A clear verdict with the reasons on show — and callouts for each of your cats, from kitten to senior.',
  },
];

export default function Home() {
  return (
    <main>
      {/* ── Section 1 · hero: stamp + introducing Wiser ─────────────── */}
      <section className="relative overflow-hidden bg-seashell pb-14 pt-28 sm:pt-32">
        {/* textured field: paper grain (body::before) + a soft petal wash + faint grid, behind display content only */}
        <div className="absolute inset-0 bg-grid-paper opacity-40" aria-hidden />
        <div
          className="absolute left-1/2 top-24 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, #FFD7DC 0%, transparent 70%)' }}
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center px-4 text-center">
          <Image
            src="/whisker-wise-logo-stamp-fill.png"
            alt="Whisker Wise — curated with care, trusted by whiskers"
            width={210}
            height={210}
            priority
            className="h-44 w-44 -rotate-3 rounded-full shadow-raised-lg sm:h-52 sm:w-52"
          />
          <h1 className="mt-8 font-serif text-[clamp(2.6rem,6vw,3.75rem)] leading-[1.05] text-ink">
            Meet <span className="text-emerald">Wiser</span>.
          </h1>
          <p className="mt-4 max-w-md font-serif text-xl leading-snug text-ink sm:text-2xl">
            Know what&apos;s good, before you buy.
          </p>
          <p className="mt-3 max-w-md text-base leading-relaxed text-ink-muted">
            Photograph any cat-food pack and get a verdict grounded in published nutrition
            standards — not marketing.
          </p>
          <Link
            href="/food-input"
            className="mt-8 inline-flex min-h-[48px] items-center gap-2 rounded-md bg-emerald px-7 py-3 font-sans text-base font-semibold text-seashell shadow-raised transition-all duration-150 ease-out hover:bg-emerald-deep active:shadow-pressed"
          >
            Scan a pack
            <ArrowRight size={18} weight="bold" aria-hidden />
          </Link>
        </div>
      </section>

      <WiggleDivider className="bg-seashell" />

      {/* ── Section 2 · what you get, in three steps ────────────────── */}
      <section className="relative bg-seashell px-4 pb-20 pt-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-serif text-3xl text-ink sm:text-4xl">
            The label, decoded in a minute
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-base leading-relaxed text-ink-muted">
            Pet-food labels are written to sell. Wiser reads them the way a nutritionist does —
            so you can decide in the aisle, not after an hour of searching.
          </p>

          <div className="mt-12 flex flex-col items-stretch gap-6 sm:flex-row">
            {STEPS.map(({ icon: Icon, block, tilt, title, text }) => (
              <div
                key={title}
                className={`flex-1 rounded-lg border border-hairline bg-paper p-3 shadow-raised ${tilt} transition-transform duration-200 ease-out hover:rotate-0`}
              >
                <div className={`flex h-28 items-center justify-center rounded-md ${block}`}>
                  <Icon size={44} weight="regular" aria-hidden />
                </div>
                <h3 className="mt-4 px-2 font-serif text-xl text-ink">{title}</h3>
                <p className="mb-2 mt-1.5 px-2 pb-1 text-sm leading-relaxed text-ink-muted">{text}</p>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-12 max-w-lg text-center text-base leading-relaxed text-ink-muted">
            Every judgment names its source. If we say the protein falls short, it&apos;s because
            the number on the pack falls short of the standard — and we show you which one.
          </p>
          <div className="mt-6 text-center">
            <Link
              href="/food-input"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-md border border-graphite px-7 py-3 font-sans text-base font-semibold text-graphite transition-colors duration-150 hover:bg-sel/60"
            >
              Try it on your cat&apos;s food
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer · the painting + about ───────────────────────────── */}
      <footer className="relative bg-graphite text-seashell">
        <div className="mx-auto grid max-w-3xl gap-10 px-6 pb-8 pt-14 sm:grid-cols-[1fr_auto]">
          <div className="max-w-md">
            <p className="font-hand text-3xl text-petal">Whisker Wise</p>
            <p className="mt-4 text-sm leading-relaxed text-seashell/85">
              Wiser is an initiative by a cat rescuer and pet nutritionist — ten years of living
              with, feeding, and learning from cats, distilled into one honest answer:
              <span className="text-petal"> is this food worth buying?</span>
            </p>
          </div>
          <nav className="flex flex-col gap-3 text-sm" aria-label="Footer">
            <a href="https://instagram.com/whiskerwise.in/" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-seashell/85 transition-colors hover:text-petal">
              <InstagramLogo size={20} aria-hidden /> @whiskerwise.in
            </a>
            <a href="https://wa.me/919682387557" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-seashell/85 transition-colors hover:text-petal">
              <WhatsappLogo size={20} aria-hidden /> Chat on WhatsApp
            </a>
            <a href="mailto:ruhela.devyani@gmail.com"
              className="inline-flex items-center gap-2 text-seashell/85 transition-colors hover:text-petal">
              <EnvelopeSimple size={20} aria-hidden /> Write to us
            </a>
            <Link href="/blog" className="inline-flex items-center gap-2 text-seashell/85 transition-colors hover:text-petal">
              <ArrowRight size={20} aria-hidden /> Blogs
            </Link>
          </nav>
        </div>
        <p className="px-6 pb-5 text-center text-xs text-seashell/60">
          Grounded in IS-11968, FEDIAF &amp; AAFCO · WSAVA governing · not a substitute for veterinary advice
        </p>
        <Image
          src="/bottom-cat-face-paint-landscape.png"
          alt=""
          width={2400}
          height={600}
          className="block h-36 w-full object-cover object-top sm:h-48"
        />
      </footer>
    </main>
  );
}
