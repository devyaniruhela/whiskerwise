import Link from 'next/link';

export const metadata = { title: 'Cat sense | Whisker Wise' };

export default function CatSensePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 pb-16 pt-24 text-center">
      <p className="font-hand text-5xl leading-none text-emerald sm:text-6xl">Whisker Wise</p>
      <p className="mt-2 text-sm text-ink-muted">Curated with care. Trusted by whiskers.</p>

      <p className="mt-8 max-w-md text-base leading-relaxed text-ink">
        We can influence our cat&apos;s environment and nutrition. Bite-sized knowledge for cat
        parents so they can keep their cats healthy &amp; happy!
      </p>
      <ul className="mt-5 space-y-2 text-left text-base leading-relaxed text-ink-muted">
        <li className="flex gap-2"><span aria-hidden className="text-emerald">•</span>Understand the primal needs of your cat</li>
        <li className="flex gap-2"><span aria-hidden className="text-emerald">•</span>Learn what your cat is trying to tell you</li>
        <li className="flex gap-2"><span aria-hidden className="text-emerald">•</span>Know how to better care for them</li>
      </ul>
      <p className="mt-6 text-base text-ink-muted">We&apos;re writing, check back soon.</p>

      <Link href="/" className="mt-8 font-sans text-sm font-semibold text-emerald underline underline-offset-4 hover:text-emerald-bright">
        Back to home
      </Link>
    </main>
  );
}
