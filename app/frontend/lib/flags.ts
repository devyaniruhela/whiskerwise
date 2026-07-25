/** Site-wide feature flags, read from build-time env. `NEXT_PUBLIC_*` is inlined
 *  by Next at build time, so these are plain constants in both the server and the
 *  client bundle (no runtime toggle - flipping one needs a rebuild/redeploy).
 *
 *  SHOW_WISER gates every *discoverable* entry point into the Wiser nutrition tool:
 *  the home-page Wiser card (components/home/ValueCardStack.tsx) and the profile
 *  Scan CTA + scan-history section (app/profile/page.tsx). Default ON - only the
 *  literal string 'false' hides Wiser, so stage and local dev need no env var. Set
 *  NEXT_PUBLIC_SHOW_WISER=false on a deploy (e.g. main/prod) to ship a
 *  Curated-Essentials-only site. This removes the on-screen paths only; the Wiser
 *  routes (/wiser-now, /food-input, /report/*) stay reachable by direct URL. */
export const SHOW_WISER = process.env.NEXT_PUBLIC_SHOW_WISER !== 'false';

/** Analytics: custom CTA/journey events sink to GA4 (free), not Vercel (whose
 *  per-parameter breakdowns are a paid tier). GA_ID is the only thing that turns
 *  the sink on - it stays dormant until NEXT_PUBLIC_GA_ID is set, so the whole
 *  system ships and is verifiable BEFORE a key exists, then lights up the day the
 *  key lands with zero code changes. Same build-time-inlined caveat as SHOW_WISER.
 *
 *  ANALYTICS_ENABLED is a hard kill switch (same default-ON idiom): only the
 *  literal 'false' disables. Vercel's <Analytics/> free basic layer
 *  (visitors/devices/geo) is separate and always on. */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';
export const ANALYTICS_ENABLED = process.env.NEXT_PUBLIC_ANALYTICS !== 'false';
