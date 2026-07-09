'use client';

import Link from 'next/link';
import { Cat, House } from '@phosphor-icons/react';

/** Fixed textured header with the wiggly torn bottom edge (CSS ported from the
 *  previous FE: .whisker-header / .wiggly-border-bottom in globals.css). */
export function Header() {
  return (
    <header className="whisker-header">
      <div className="header-content-wrapper">
        <Link href="/" className="header-icon-btn" aria-label="Home">
          <House size={24} weight="regular" />
        </Link>
        <Link href="/" className="header-logo-link" aria-label="Whisker Wise home">
          <span className="font-hand text-2xl tracking-wide text-seashell sm:text-3xl">Whisker Wise</span>
        </Link>
        <Link href="/profile" className="header-icon-btn" aria-label="Your cats and profile">
          <Cat size={24} weight="regular" />
        </Link>
      </div>
      <div className="wiggly-border-bottom" aria-hidden />
    </header>
  );
}
