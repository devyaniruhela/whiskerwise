'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Cat } from 'lucide-react';

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-dark.png" alt="Wiser" width={110} height={32} className="h-8 w-auto" priority />
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/food-input"
            className="rounded-full bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            Scan a pack
          </Link>
          <Link href="/profile" aria-label="Profile" className="text-gray-500 transition hover:text-primary-600">
            <Cat className="h-6 w-6" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
