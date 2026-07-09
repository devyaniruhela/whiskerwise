'use client';

import type { Verdict } from '@/types';

/** Circular rubber-stamp verdict (design/styleguide.html contract): two concentric
 *  ring-texts at different radii, verdict word in the hand font at one fixed size
 *  across Buy/Careful/Skip, stamp-down entrance (reduced-motion collapses to fade
 *  via the global media query). vet_diet / no_verdict don't get a stamp. */
const STAMP: Partial<Record<Verdict, { word: string; color: string }>> = {
  buy: { word: 'BUY', color: '#08513D' },
  buy_with_conditions: { word: 'CAREFUL', color: '#A34700' },
  skip: { word: 'SKIP', color: '#A02A18' },
};

export function VerdictStamp({ verdict, size = 148 }: { verdict: Verdict; size?: number }) {
  const s = STAMP[verdict];
  if (!s) return null;
  return (
    <div className="animate-stamp-down" style={{ width: size, height: size }} role="img"
      aria-label={`Verdict: ${s.word}`}>
      <svg viewBox="0 0 160 160" width={size} height={size}>
        <defs>
          {/* top ring path (clockwise) and bottom ring path (counter-clockwise, so text sits upright) */}
          <path id="ring-top" d="M 80 80 m -60 0 a 60 60 0 1 1 120 0" fill="none" />
          <path id="ring-bottom" d="M 80 80 m -66 0 a 66 66 0 1 0 132 0" fill="none" />
          <filter id="stamp-rough">
            <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" result="n" seed="7" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" />
          </filter>
        </defs>
        <g filter="url(#stamp-rough)" style={{ color: s.color }} fill="currentColor" stroke="currentColor">
          <circle cx="80" cy="80" r="76" fill="none" strokeWidth="3.5" />
          <circle cx="80" cy="80" r="52" fill="none" strokeWidth="1.5" />
          <text fontSize="11.5" letterSpacing="2.6" fontWeight="700" stroke="none"
            style={{ fontFamily: 'var(--font-sans)' }}>
            <textPath href="#ring-top" startOffset="50%" textAnchor="middle">WHISKER WISE</textPath>
          </text>
          <text fontSize="7.5" letterSpacing="1.4" fontWeight="600" stroke="none"
            style={{ fontFamily: 'var(--font-sans)' }}>
            <textPath href="#ring-bottom" startOffset="50%" textAnchor="middle">
              CURATED WITH CARE · TRUSTED BY WHISKERS
            </textPath>
          </text>
          <text x="80" y="80" textAnchor="middle" dominantBaseline="central" fontSize="30"
            stroke="none" style={{ fontFamily: 'var(--font-hand)' }}>
            {s.word}
          </text>
        </g>
      </svg>
    </div>
  );
}
