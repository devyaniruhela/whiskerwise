import Image from 'next/image';
import { InstagramLogo, WhatsappLogo, EnvelopeSimple, Sparkle } from '@phosphor-icons/react/dist/ssr';
import { TrackedLink } from '@/components/analytics/TrackedLink';

const STANDARDS = {
  indian: 'https://archive.org/details/gov.in.is.11968.2019/page/n3/mode/2up',
  european: 'https://europeanpetfood.org/',
  american: 'http://aafco.org/',
  wsava: 'http://wsava.org/',
};

function FootLink({ href, name, children }: { href: string; name: string; children: React.ReactNode }) {
  return (
    <TrackedLink href={href} external ctaName={`standard_${name}`}
      params={{ section: 'footer', destination: `standard_${name}` }}
      className="underline decoration-seashell/50 underline-offset-2 transition-colors hover:text-petal hover:decoration-petal">
      {children}
    </TrackedLink>
  );
}

/** Site-wide footer: painting shows through; text lives in the right 2/3.
 *  Extracted verbatim from the original Wiser landing so home, /wiser-now and
 *  /curated-essentials share one footer (Whiskerwise_PRD.md §6). */
export function Footer() {
  return (
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
        {/* right 2/3: everything left-aligned to one starting edge */}
        <div className="md:col-span-2">
          <p className="font-hand text-3xl text-petal">Whisker Wise</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-seashell">
            Whisker Wise is an initiative by a cat mom and pet nutritionist, who brings ten years
            of rescuing, living with, feeding, and learning from cats, distilled into
            <span className="text-petal"> honest answers you can trust.</span>
          </p>
          {/* 2×2: Instagram + WhatsApp fill the left column, Write to us + Blogs the right */}
          <nav className="mt-6 grid w-fit grid-flow-col grid-rows-2 gap-x-10 gap-y-3 text-sm" aria-label="Footer">
            <TrackedLink href="https://instagram.com/whiskerwise.in/" external
              ctaName="instagram" params={{ section: 'footer', destination: 'instagram' }}
              className="inline-flex items-center gap-2 transition-colors hover:text-petal">
              <InstagramLogo size={20} aria-hidden /> @whiskerwise.in
            </TrackedLink>
            <TrackedLink href="https://wa.me/919682387557" external
              ctaName="whatsapp_consult" params={{ section: 'footer', destination: 'whatsapp' }}
              className="inline-flex items-center gap-2 transition-colors hover:text-petal">
              <WhatsappLogo size={20} aria-hidden /> Get a personal consult
            </TrackedLink>
            <TrackedLink href="mailto:ruhela.devyani@gmail.com" external target="_self"
              ctaName="email" params={{ section: 'footer', destination: 'email' }}
              className="inline-flex items-center gap-2 transition-colors hover:text-petal">
              <EnvelopeSimple size={20} aria-hidden /> Send your questions
            </TrackedLink>
            <TrackedLink href="/blog-cat-sense" ctaName="blog_cat_sense" params={{ section: 'footer' }}
              className="inline-flex items-center gap-2 transition-colors hover:text-petal">
              <Sparkle size={20} aria-hidden /> Cat sense
            </TrackedLink>
          </nav>
        </div>
      </div>

      <div className="relative mx-auto grid max-w-5xl px-6 pb-14 md:grid-cols-3"
        style={{ textShadow: '0 1px 5px rgba(0,0,0,0.55)' }}>
        <div className="hidden md:block" aria-hidden />
        <p className="text-sm leading-relaxed text-seashell md:col-span-2 md:text-center">
          Grounded in <FootLink href={STANDARDS.indian} name="indian">Indian</FootLink> pet-food standards,
          supported by <FootLink href={STANDARDS.european} name="european">European</FootLink> and{' '}
          <FootLink href={STANDARDS.american} name="american">American</FootLink> standards.
          <span className="mt-1 block">
            In compliance with <FootLink href={STANDARDS.wsava} name="wsava">WSAVA</FootLink> (the WHO for Cats
            &amp; Dogs).
          </span>
          <span className="mt-1 block">Not a substitute for veterinary advice.</span>
        </p>
      </div>
    </footer>
  );
}
