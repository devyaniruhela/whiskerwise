'use client';

import { Cat, House } from '@phosphor-icons/react';
import { TrackedLink } from '@/components/analytics/TrackedLink';

/** Fixed textured header with the wiggly torn bottom edge (CSS ported from the
 *  previous FE: .whisker-header / .wiggly-border-bottom in globals.css). */
export function Header() {
  return (
    <header className="whisker-header">
      <div className="header-content-wrapper">
        <TrackedLink href="/" ctaName="home" params={{ section: 'header' }} className="header-icon-btn" aria-label="Home">
          <House size={24} weight="regular" />
        </TrackedLink>
        <TrackedLink href="/" ctaName="logo" params={{ section: 'header' }} className="header-logo-link flex items-center" aria-label="Whisker Wise home">
          {/* script font sits optically high; leading-none + small nudge centres it on the icon row */}
          <span className="translate-y-[0.06em] font-hand text-2xl leading-none tracking-wide text-seashell sm:text-3xl">
            Whisker Wise
          </span>
        </TrackedLink>
        <TrackedLink href="/profile" ctaName="profile" params={{ section: 'header' }} className="header-icon-btn" aria-label="Your cats and profile">
          <Cat size={24} weight="regular" />
        </TrackedLink>
      </div>
      <div className="wiggly-border-bottom" aria-hidden />
    </header>
  );
}
