import Link from 'next/link';
import Header from '@/components/layout/Header';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-serif text-gray-900 mb-2">Page not found</h1>
          <p className="text-gray-600 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link
            href="/now-wiser"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-primary-600 hover:bg-primary-dark text-white font-semibold shadow-soft-lg hover:shadow-soft-xl hover:-translate-y-1 active:translate-y-0 transition-all duration-200"
          >
            Go to home
          </Link>
        </div>
      </main>
    </>
  );
}
