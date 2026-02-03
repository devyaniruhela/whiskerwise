'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-emerald-50 to-green-50">
      <div className="max-w-md w-full bg-white rounded-2xl border-2 border-red-200 p-8 shadow-lg">
        <h1 className="text-xl font-serif text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-600 font-mono mb-6">{error.message}</p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700"
          >
            Try again
          </button>
          <Link
            href="/now-wiser"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
