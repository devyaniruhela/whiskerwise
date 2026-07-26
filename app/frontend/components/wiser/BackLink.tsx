'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

const NAV_KEY = 'ww:navs';

/** Counts in-app navigations this tab session, so a back control can tell
 *  whether there is a previous in-app screen to return to.
 *
 *  Mounted ONCE in the root layout: the layout never remounts across client
 *  navigations, so its `usePathname` effect fires once per route change (and
 *  once on the initial load). `navs > 1` therefore means "at least one client
 *  navigation has happened since this tab opened" - i.e. there is an in-app
 *  entry behind us. A direct landing / fresh tab sits at 1.
 *
 *  usePathname (unlike useSearchParams) does not force dynamic rendering, so
 *  this is safe to mount app-wide without deopting the static pages. Filter
 *  changes on the catalogue use replaceState (path unchanged), so they never
 *  inflate the count. */
export function NavDepthTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const n = Number(sessionStorage.getItem(NAV_KEY) || '0');
    sessionStorage.setItem(NAV_KEY, String(n + 1));
  }, [pathname]);
  return null;
}

/** A back link that returns to the PREVIOUS screen with its own state intact,
 *  rather than a fixed destination that resets it. The catalogue keeps its
 *  filters in the URL, so a real history `back()` restores the exact filtered
 *  view (and its scroll) the user came from - which a hardcoded
 *  `href="/curated-essentials"` could not.
 *
 *  `href` is still the anchor's real target, so it is a proper link (SSR,
 *  middle-click / right-click "open in new tab", and the direct-landing case
 *  all behave). We only intercept a plain left-click, and only when there is an
 *  in-app screen to go back to; otherwise the href handles it. */
export function BackLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        // leave modified clicks (new tab / window, etc.) to the browser
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        const navs = Number(sessionStorage.getItem(NAV_KEY) || '0');
        if (navs > 1) {
          e.preventDefault();
          router.back();
        }
        // else: fall through to href (direct landing / nothing behind us)
      }}
    >
      {children}
    </Link>
  );
}
