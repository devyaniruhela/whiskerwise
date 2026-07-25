'use client';

import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { track, type AnalyticsEvent, type AnalyticsParams } from '@/lib/analytics';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** which vocabulary event to fire; defaults to a cta_click */
  event?: AnalyticsEvent;
  /** cta_name for the default cta_click (omit when firing a non-cta event) */
  ctaName?: string;
  params?: AnalyticsParams;
  children?: ReactNode;
};

/** A button that logs before it acts - the button counterpart to TrackedLink, for
 *  CTAs that aren't links. Defaults to a cta_click carrying `ctaName`; pass
 *  `event` to fire another vocabulary event (e.g. 'filter'). Existing client
 *  components with their own handlers can instead call `track()` inline; this is
 *  the drop-in for new pages that want a plain tracked button. */
export function TrackedButton({ event = 'cta_click', ctaName, params, onClick, children, ...rest }: Props) {
  function handle(e: MouseEvent<HTMLButtonElement>) {
    track(event, { ...(ctaName ? { cta_name: ctaName } : {}), ...params });
    onClick?.(e);
  }
  return (
    <button {...rest} onClick={handle}>
      {children}
    </button>
  );
}
