import fs from 'fs';
import path from 'path';
import Image from 'next/image';
import { WiggleDivider } from '@/components/wiser/WiggleDivider';
import { Footer } from '@/components/wiser/Footer';
import { ValueCardStack, type CardArt } from '@/components/home/ValueCardStack';
import { getCatalogue } from '@/lib/catalogue';

/** Rendered per request, not at build: otherwise Math.random() runs once during
 *  `next build` and every visitor sees the same pair until the next deploy. */
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Whisker Wise | Better decisions for your cat, faster',
  description:
    'We look at the evidence, so you can pick what is actually good for your cat. Curated with care, trusted by whiskers.',
};

/** Value-card artwork, drawn fresh per visit from public/cards/:
 *  `cat-card1-*` feeds card 1 (Curated Essentials), `cat-card2-*` feeds card 2
 *  (Wiser), `cat-card3-*` feeds card 3 (Nutrition Consult). Dropping in
 *  cat-card1-8.jpg just works, no code change.
 *
 *  An optional `--<x>x<y>` suffix carries the image's focal point as percentages
 *  (cat-card1-6--51x32.jpg -> object-position: 51% 32%), so the crop stays on the
 *  subject in both the wide mobile band and the near-square desktop column.
 *  Bake it into the filename when cropping; omit it to accept the centred default. */
const CARDS_DIR = path.join(process.cwd(), 'public', 'cards');
// `-\d+` is the slot, an optional trailing letter marks an alternate cut of the
// same painting (cat-card2-4--55x50 vs cat-card2-4b--72x48), so both can sit in
// the roster at once while a crop is being judged.
const ART_RE = /^(cat-card\d+)-\d+[a-z]?(?:--(\d{1,3})x(\d{1,3}))?\.jpe?g$/i;
const DEFAULT_FOCAL = '50% 50%';
const FALLBACK_ART: CardArt = { src: '/whisker-wise-logo-stamp-bw.png', position: DEFAULT_FOCAL };

/** Read once per server instance; each request only rolls a die over the result. */
function readRoster(prefix: string): CardArt[] {
  let files: string[];
  try {
    files = fs.readdirSync(CARDS_DIR);
  } catch {
    return []; // folder missing: fall back rather than 500 the home page
  }
  return files.flatMap((f) => {
    const m = ART_RE.exec(f);
    if (!m || m[1].toLowerCase() !== prefix) return [];
    return [{ src: `/cards/${f}`, position: `${m[2] ?? 50}% ${m[3] ?? 50}%` }];
  });
}

const IS_DEV = process.env.NODE_ENV !== 'production';

/** Cached in production (the folder can't change under a running deploy); re-read
 *  every request in dev, so adding, renaming or deleting a painting shows up on
 *  the next reload without restarting the server. */
const ROSTERS: Record<string, CardArt[]> = IS_DEV
  ? {}
  : {
      'cat-card1': readRoster('cat-card1'),
      'cat-card2': readRoster('cat-card2'),
      'cat-card3': readRoster('cat-card3'),
    };

function pickCardArt(prefix: string): CardArt {
  const roster = IS_DEV ? readRoster(prefix) : ROSTERS[prefix];
  if (!roster?.length) return FALLBACK_ART;
  return roster[Math.floor(Math.random() * roster.length)];
}

/** whiskerwise.in home (Whiskerwise_PRD.md §4). The hero is the one place the
 *  stamp goes REALLY BIG, so home reads unmistakably different from every other
 *  page; then the value-card stack (one card per product) and a short trust band. */
export default function Home() {
  const { starterKit, sections } = getCatalogue();
  const picks = sections.reduce((n, s) => n + s.groups.length, 0);

  return (
    <main>
      {/* ── Hero: the oversized stamp moment, logo left / text right ── */}
      {/* paper-texture backdrop (D, 24 Jul): replaces the grid. A seashell wash is
          laid OVER the photo so the grain stays subtle and the colour reads as our
          light neutral (#FFF8F2), not the raw texture's cooler, starker grey — so
          the hero blends with the seashell body instead of clashing with it. Raise
          the 0.72 alpha to mute the texture further, lower it to show more grain. */}
      <div
        className="bg-seashell bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,248,242,0.72), rgba(255,248,242,0.72)), url('/hero-section-bg.jpg')",
        }}
      >
        <section className="px-5 pt-20 sm:pt-24">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 pb-12 text-center md:flex-row md:gap-12 md:pb-14 md:text-left">
            <Image
              src="/whisker-wise-logo-stamp-bw.png"
              alt="Whisker Wise. Curated with care, trusted by whiskers."
              width={2000}
              height={1731}
              priority
              className="h-auto w-[72vw] max-w-[24rem] shrink-0 md:w-[44%] lg:max-w-[26rem]"
              style={{ filter: 'drop-shadow(0 18px 38px rgba(41,44,44,0.22))' }}
            />
            <div>
              <h1 className="font-serif text-[clamp(2.25rem,4.5vw,3.25rem)] leading-[1.05] text-ink">
                Better decisions for your cat, faster.
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-ink-muted sm:text-lg md:mx-0">
                We look at the evidence, so you can pick what is actually good for your cat.
              </p>
            </div>
          </div>
        </section>
        <WiggleDivider />
      </div>

      {/* ── The two doors: stacked value cards (pin + slide-over on scroll) ── */}
      <section className="bg-seashell pb-20 pt-12 sm:pt-14" aria-label="What Whisker Wise offers">
        <ValueCardStack
          essentials={{ picks, needs: sections.length, hasStarterKit: starterKit.length > 0 }}
          essentialsArt={pickCardArt('cat-card1')}
          wiserArt={pickCardArt('cat-card2')}
          consultArt={pickCardArt('cat-card3')}
        />
      </section>

      {/* ── Trust band: the tagline, big, and two short lines ── */}
      <section className="border-t border-hairline bg-seashell px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-hand text-[clamp(2rem,5vw,3.25rem)] leading-tight text-emerald">
            Curated with care.
            <span className="block">Trusted by whiskers.</span>
          </p>
          <p className="mt-6 text-lg leading-relaxed text-ink">
            Your partner in making good decisions for your cat. Every time.
          </p>
          <p className="mt-1.5 text-base leading-relaxed text-ink-muted">
            No more confusion. No more second-guessing.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
