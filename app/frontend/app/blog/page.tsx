import Link from 'next/link';

export const metadata = { title: 'Blogs — Whisker Wise' };

export default function BlogPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 pt-24 text-center">
      <p className="font-hand text-3xl text-emerald">Whisker Wise</p>
      <h1 className="mt-4 font-serif text-4xl text-ink">Blogs</h1>
      <p className="mt-4 max-w-sm text-base leading-relaxed text-ink-muted">
        Essays on feeding cats well — reading labels, life stages, and the standards behind our
        verdicts. We&apos;re writing; check back soon.
      </p>
      <Link href="/" className="mt-8 font-sans text-sm font-semibold text-emerald underline underline-offset-4 hover:text-emerald-bright">
        Back to home
      </Link>
    </main>
  );
}
