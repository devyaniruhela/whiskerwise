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
