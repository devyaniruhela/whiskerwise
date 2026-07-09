import Image from 'next/image';
import Link from 'next/link';
import { Camera, ListMagnifyingGlass, Stamp, InstagramLogo, WhatsappLogo, EnvelopeSimple, ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { WiggleDivider } from '@/components/wiser/WiggleDivider';
import { StandardsTooltip } from '@/components/wiser/StandardsTooltip';

// Placeholder icon blocks; real photos to be added by D. Pink (petal) is common to all three.
const STEPS = [
  {
    icon: Camera,
    block: 'bg-petal text-emerald',
    title: 'Photograph the pack',
    text: 'Front and back, right there in the store aisle. We check your photos are readable first.',
    tooltip: false,
  },
  {
    icon: ListMagnifyingGlass,
    block: 'bg-emerald text-petal',
    title: 'We read every line',
    text: 'We take all the information directly from the pack you share, then check it against Indian, European and American pet-food standards.',
    tooltip: true,
  },
  {
    icon: Stamp,
    block: 'bg-graphite text-petal',
    title: 'Buy, or skip',
    text: 'A clear verdict, with every "why" rooted in science.',
    tooltip: false,
  },
];

const STANDARDS = {
  indian: 'https://archive.org/details/gov.in.is.11968.2019/page/n3/mode/2up',
  european: 'https://europeanpetfood.org/',
  american: 'http://aafco.org/',
  wsava: 'http://wsava.org/',
};

function FootLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="underline decoration-seashell/50 underline-offset-2 transition-colors hover:text-petal hover:decoration-petal">
      {children}
    </a>
  );
}

export default function Home() {
  return (
    <main>
      {/* hero + steps share one continuous grid-paper surface (grid runs under the divider) */}
      <div className="bg-grid-paper">
        {/* ── Section 1 · hero: stamp left, intro + CTA right ─────────── */}
        <section className="relative px-5 pt-24 sm:pt-28">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 pb-14 text-center sm:pb-16 md:flex-row md:gap-12 md:text-left">
            <Image
              src="/whisker-wise-logo-stamp-fill.png"
              alt="Whisker Wise. Curated with care, trusted by whiskers."
              width={340}
              height={340}
              priority
              className="w-56 shrink-0 -rotate-3 sm:w-64 md:w-72 lg:w-[19rem]"
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

        {/* ── Section 2 · what you get, in three steps ────────────────── */}
        <section className="relative px-5 pb-20 pt-14">
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
              The facts are already on every label. Wiser helps you make wiser decisions, faster.
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
      </div>

      {/* ── Footer · painting shows through; text lives in the right 2/3 ─ */}
      <footer className="relative text-seashell">
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          <Image src="/bottom-cat-face-paint-landscape.png" alt="" fill priority={false}
            className="object-cover object-bottom" sizes="100vw" />
          {/* no full mask; keep the painting visible, a soft right-side wash lifts text legibility */}
          <div className="absolute inset-0 bg-gradient-to-l from-graphite/70 via-graphite/45 to-transparent md:from-graphite/60 md:via-graphite/30" />
        </div>

        <div
          className="relative mx-auto grid max-w-5xl gap-8 px-6 pb-10 pt-16 md:grid-cols-3"
          style={{ textShadow: '0 1px 5px rgba(0,0,0,0.55)' }}
        >
          <div className="hidden md:block" aria-hidden />{/* left third: reserved for the painted cat */}
          <div className="grid gap-8 md:col-span-2 md:grid-cols-[1fr_auto]">
            <div className="max-w-md">
              <p className="font-hand text-3xl text-petal">Whisker Wise</p>
              <p className="mt-4 text-sm leading-relaxed text-seashell">
                Wiser is an initiative by a cat rescuer and pet nutritionist. Ten years of living with,
                feeding, and learning from cats, distilled into one honest answer:
                <span className="text-petal"> is this food worth buying?</span>
              </p>
            </div>
            <nav className="flex flex-col gap-3 text-sm" aria-label="Footer">
              <a href="https://instagram.com/whiskerwise.in/" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-petal">
                <InstagramLogo size={20} aria-hidden /> @whiskerwise.in
              </a>
              <a href="https://wa.me/919682387557" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-petal">
                <WhatsappLogo size={20} aria-hidden /> Chat on WhatsApp
              </a>
              <a href="mailto:ruhela.devyani@gmail.com"
                className="inline-flex items-center gap-2 transition-colors hover:text-petal">
                <EnvelopeSimple size={20} aria-hidden /> Write to us
              </a>
              <Link href="/blog" className="inline-flex items-center gap-2 transition-colors hover:text-petal">
                <ArrowRight size={20} aria-hidden /> Blogs
              </Link>
            </nav>
          </div>
        </div>

        <div className="relative mx-auto grid max-w-5xl px-6 pb-14 md:grid-cols-3"
          style={{ textShadow: '0 1px 5px rgba(0,0,0,0.55)' }}>
          <div className="hidden md:block" aria-hidden />
          <p className="text-sm leading-relaxed text-seashell md:col-span-2">
            Grounded in <FootLink href={STANDARDS.indian}>Indian</FootLink>,{' '}
            <FootLink href={STANDARDS.european}>European</FootLink> and{' '}
            <FootLink href={STANDARDS.american}>American</FootLink> pet-food standards. Governed by{' '}
            <FootLink href={STANDARDS.wsava}>WSAVA</FootLink>. Not a substitute for veterinary advice.
          </p>
        </div>
      </footer>
    </main>
  );
}
