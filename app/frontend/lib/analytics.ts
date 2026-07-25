// Analytics: the ONE typed entry point for every custom event. This is the only
// file that knows the vendor. Today it sinks to GA4 via gtag; adding another sink
// later (or swapping vendors) means editing send() here, never a call site.
//
// Cost decision (see lib/flags.ts): per-parameter breakdowns - splitting clicks
// by cta_name / product / need, the whole point of this - are a paid feature on
// Vercel but free on GA4, so custom events go to GA. Vercel's <Analytics/> still
// runs for the free basic layer (visitors / devices / geo); we just don't route
// custom events through it.
//
// The GA sink is dormant until NEXT_PUBLIC_GA_ID is set: build + verify now, it
// lights up the day the key lands, with zero changes at the call sites.
import { ANALYTICS_ENABLED } from './flags';

/** Controlled event vocabulary. Add a name here BEFORE using it - this union is
 *  what keeps every page speaking the same words instead of inventing ad-hoc
 *  event strings. Rich params carry the variation, not new event names. */
export type AnalyticsEvent = 'cta_click' | 'filter' | 'variant_select';

/** Flat, GA-native params. Values stay string | number | boolean so GA (and any
 *  future sink) accept them without nested objects. `undefined` is allowed at the
 *  call site for optional fields and dropped before sending. */
export type AnalyticsParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Fire one event. Safe to call anywhere: no-ops on the server, when disabled, or
 *  before a GA key exists. Optional (`undefined`) params are stripped so callers
 *  can pass conditional fields inline. */
export function track(event: AnalyticsEvent, params: AnalyticsParams = {}): void {
  // server render: nothing to send (all call sites are client onClicks anyway)
  if (typeof window === 'undefined') return;

  const clean: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) if (v !== undefined) clean[k] = v;

  // basic instrumentation: one compact line in dev so the whole system can be
  // verified from the browser console in a single read, no network trace needed.
  // Never ships to production.
  if (process.env.NODE_ENV !== 'production') console.debug('[track]', event, clean);

  if (!ANALYTICS_ENABLED) return;
  window.gtag?.('event', event, clean);
}
