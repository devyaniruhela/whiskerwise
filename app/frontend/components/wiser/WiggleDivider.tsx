/** Hand-drawn wavy rule that tiles at a FIXED wave width (48px), like the header's
 *  squiggle mask, so the waves never stretch or compress with screen size.
 *  Transparent background so the page's grid-paper shows through continuously. */
const WAVE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='24'%3E%3Cpath d='M0 12 Q 12 2 24 12 T 48 12' fill='none' stroke='%2308513D' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E\")";

export function WiggleDivider({ className = '' }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden
      style={{
        height: 24,
        backgroundImage: WAVE,
        backgroundRepeat: 'repeat-x',
        backgroundSize: '48px 24px',
        backgroundPosition: 'center',
      }}
    />
  );
}
