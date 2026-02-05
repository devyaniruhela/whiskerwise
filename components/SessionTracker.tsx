'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from '@/hooks/useSession';

/**
 * Renders nothing. Initializes session and tracks page views on route change.
 * Mount this once in the root layout so session is ready and time-on-site runs.
 */
export default function SessionTracker() {
  const pathname = usePathname();
  const { trackPageView, isReady, trackProfileVisit } = useSession();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isReady || !pathname) return;
    // First load already counted in useSession init; only track on navigation
    if (prevPathRef.current !== null && prevPathRef.current !== pathname) {
      trackPageView(pathname);
    }
    if (pathname === '/profile') {
      trackProfileVisit();
    }
    prevPathRef.current = pathname;
  }, [pathname, isReady, trackPageView, trackProfileVisit]);

  return null;
}
