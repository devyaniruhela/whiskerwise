'use client';

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from '@/lib/analytics';

/** Fires a GA page_view on every client-side (soft) navigation. The App Router
 *  changes routes without a full reload, so gtag('config') - which only counts
 *  the initial hard load - misses these. This component watches the path + query
 *  and sends one page_view per change.
 *
 *  It deliberately SKIPS its first run: that view is already counted by the
 *  config on load, so firing here too would double-count it. Only subsequent
 *  navigations flow through trackPageView().
 *
 *  useSearchParams() forces dynamic rendering, so it must sit inside a Suspense
 *  boundary or it deopts the whole tree out of static rendering (breaking SSG).
 *  The wrapper keeps that boundary local to this null-rendering leaf. */
function RouteTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const qs = searchParams.toString();
    trackPageView(pathname + (qs ? `?${qs}` : ''));
  }, [pathname, searchParams]);

  return null;
}

export function RouteTracker() {
  return (
    <Suspense fallback={null}>
      <RouteTrackerInner />
    </Suspense>
  );
}
