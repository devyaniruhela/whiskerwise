import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';

/** Home value stack, the raw-card language from ui-inspo (raw-card-stacking*.png):
 *  full-width paper cards, clean text zone left, painting bleed dissolving in from
 *  the right, stacked with sticky pinning at EVERY viewport width so the next card
 *  slides over the last on scroll (mobile included, per D). Text always sits on
 *  solid paper (DESIGN.md golden rule): the bleed extends under the text zone but
 *  its gradient overlay is fully opaque paper before the text begins, so the
 *  dissolve is seamless for any image. */

/** A painting plus the focal point it was cropped around. `position` is a CSS
 *  object-position value ("55% 48%"), parsed by the page from the filename so the
 *  focal point travels with the image instead of being pinned to the card. */
export type CardArt = { src: string; position: string };

type Card = {
  name: string;
  nameColor: string;
  heading: string;
  body: string;
  cta: { label: string; href: string; className: string };
  image: CardArt;
  stats: { value: string; label: string }[];
  sticky: string;
};

/** Catalogue figures come from the CSV via lib/catalogue; the Curated Essentials
 *  artwork is picked at random per build from public/cat-card1-*.jpg (page passes
 *  it in). Nothing product-shaped is hard-coded here. */
export type EssentialsStats = { picks: number; needs: number; hasStarterKit: boolean };

const CTA_SIZE =
  'inline-flex min-h-[48px] min-w-[15rem] items-center justify-center gap-2 rounded-md px-6 py-3 font-sans text-base font-semibold shadow-raised transition-all duration-150 ease-out active:shadow-pressed';

/** Stat counts read as words, not numerals ("twelve picks"), so card 1's evidence
 *  row matches card 2's (Scan / Check / Verdict). Counts come from the CSV, so
 *  fall back to the numeral past twenty, where the words stop reading well. */
const NUMBER_WORDS = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen',
  'Nineteen', 'Twenty',
];
const spell = (n: number) => NUMBER_WORDS[n] ?? String(n);

function buildCards(essentials: EssentialsStats, essentialsArt: CardArt, wiserArt: CardArt): Card[] {
  return [
    {
      name: 'Curated Essentials',
      nameColor: 'text-iron',
      heading: 'All the right things, chosen for your cat.',
      body: 'The only list you need, for everything your cat wants. Handpicked items to make your life easier, and your cat’s better.',
      cta: {
        label: 'Browse the essentials',
        href: '/curated-essentials',
        className: 'bg-iron text-seashell hover:bg-iron-deep',
      },
      image: essentialsArt,
      stats: [
        { value: spell(essentials.picks), label: 'picks' },
        { value: spell(essentials.needs), label: 'needs' },
        ...(essentials.hasStarterKit ? [{ value: spell(1), label: 'starter kit' }] : []),
      ],
      sticky: 'sticky top-20 z-10 md:top-24',
    },
    {
      name: 'Wiser',
      nameColor: 'text-emerald',
      heading: 'Know what’s good, before you buy.',
      body: 'Here to help you pick food for your cat, just like a nutritionist would. Wiser checks the label against published nutrition standards, gives you a clear Buy or Skip, and tells you the science behind it.',
      cta: {
        label: 'Scan a pack',
        href: '/wiser-now',
        className: 'bg-emerald text-seashell hover:bg-emerald-deep',
      },
      image: wiserArt,
      stats: [
        { value: 'Scan', label: 'the pack' },
        { value: 'Check', label: 'against standards' },
        { value: 'Verdict', label: 'Buy, or skip' },
      ],
      sticky: 'sticky top-24 z-20 md:top-28',
    },
  ];
}

export function ValueCardStack({
  essentials,
  essentialsArt,
  wiserArt,
}: {
  essentials: EssentialsStats;
  essentialsArt: CardArt;
  wiserArt: CardArt;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-5 md:space-y-10">
      {buildCards(essentials, essentialsArt, wiserArt).map((card) => (
        <article
          key={card.name}
          className={`relative overflow-hidden rounded-lg border border-hairline bg-paper shadow-raised-lg ${card.sticky}`}
        >
          {/* painting bleed: top band on mobile, right bleed on md+. It extends
              UNDER the text zone; the paper-coloured gradient overlay is fully
              opaque before the text starts, so there is never a seam line. */}
          <div
            className="relative h-44 w-full md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-[50%]"
            aria-hidden
          >
            <Image
              src={card.image.src}
              alt=""
              fill
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover"
              // focal point is per-image and runtime-resolved, so it can't be a
              // Tailwind arbitrary value (those are compiled at build time)
              style={{ objectPosition: card.image.position }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_55%,var(--paper)_96%)] md:bg-[linear-gradient(to_left,transparent_50%,var(--paper)_85%)]" />

            {/* dev-only: which file + focal point is on screen, so a crop can be
                judged and kept/dropped without inspecting the DOM. Never ships. */}
            {process.env.NODE_ENV !== 'production' && (
              <p className="absolute left-2 top-2 z-30 rounded bg-ink/80 px-2 py-1 font-mono text-[11px] leading-tight text-seashell">
                {card.image.src.replace('/cards/', '')}
                <span className="block opacity-70">focal {card.image.position}</span>
              </p>
            )}
          </div>

          {/* matte grain over the whole card */}
          <div className="grain pointer-events-none absolute inset-0" aria-hidden />

          {/* text zone: solid paper */}
          <div className="relative p-6 pt-4 sm:p-9 sm:pt-5 md:w-[58%] md:pt-9">
            <p className="font-sans text-sm text-ink-muted">
              <span className={`font-semibold ${card.nameColor}`}>{card.name}</span>
            </p>
            <h2 className="mt-2 max-w-md font-serif text-3xl leading-tight text-ink sm:text-4xl">
              {card.heading}
            </h2>
            <p className="mt-3 max-w-md text-base leading-relaxed text-ink-muted">{card.body}</p>
            <Link href={card.cta.href} className={`mt-6 ${CTA_SIZE} ${card.cta.className}`}>
              {card.cta.label}
              <ArrowRight size={18} weight="bold" aria-hidden />
            </Link>

            {/* quiet evidence row. Sans, not mono: DESIGN.md reserves the mono lane
              for nutrient figures, label data and standards codes, and these are
              spelled-out marketing counts, not evidence. */}
            <div className="mt-7 flex max-w-md gap-8 border-t border-hairline pt-4">
              {card.stats.map((s) => (
                <div key={s.label}>
                  <p className="font-sans text-base font-bold text-ink">{s.value}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
