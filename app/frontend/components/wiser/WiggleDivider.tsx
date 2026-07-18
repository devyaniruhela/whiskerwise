/** Wavy rule that tiles at a FIXED wave width so it never stretches: the wiggle
 *  size is identical on every page, screen size and orientation. Tile is 22px
 *  wide to match the header's tight scallops (wiggly-border-bottom). Transparent
 *  above the wave (the section behind shows through, up to the line), SEASHELL
 *  below it (covers the grid), stroke on the boundary.
 *  `stroke` = hex without '#' (default emerald; pass 292C2C for the dark-neutral
 *  variant used under graphite bands). */
function tile(strokeHex: string) {
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='12'%3E%3Cpath d='M0 6 Q 5.5 1 11 6 T 22 6 L 22 12 L 0 12 Z' fill='%23FFF8F2'/%3E%3Cpath d='M0 6 Q 5.5 1 11 6 T 22 6' fill='none' stroke='%23${strokeHex}' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`;
}

export function WiggleDivider({ className = '', stroke = '08513D' }: { className?: string; stroke?: string }) {
  return (
    <div
      className={className}
      aria-hidden
      style={{
        height: 12,
        backgroundImage: tile(stroke),
        backgroundRepeat: 'repeat-x',
        backgroundSize: '22px 12px',
        backgroundPosition: 'left top',
      }}
    />
  );
}
