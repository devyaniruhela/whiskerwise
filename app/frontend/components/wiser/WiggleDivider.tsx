/** Wavy rule that tiles at a FIXED wave width (48px) so it never stretches.
 *  The tile is TRANSPARENT above the wave (the hero's grid-paper shows through, up to
 *  the line) and filled with SEASHELL below it (covering the grid), so the grid appears
 *  to stop cleanly at the squiggly line. The emerald stroke sits on the boundary. */
const TILE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='24'%3E%3Cpath d='M0 12 Q 12 2 24 12 T 48 12 L 48 24 L 0 24 Z' fill='%23FFF8F2'/%3E%3Cpath d='M0 12 Q 12 2 24 12 T 48 12' fill='none' stroke='%2308513D' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E\")";

export function WiggleDivider({ className = '' }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden
      style={{
        height: 24,
        backgroundImage: TILE,
        backgroundRepeat: 'repeat-x',
        backgroundSize: '48px 24px',
        backgroundPosition: 'left top',
      }}
    />
  );
}
