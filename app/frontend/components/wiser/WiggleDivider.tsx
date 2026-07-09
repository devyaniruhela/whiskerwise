/** Hand-drawn wavy rule separating homepage sections (ref: ui-inspo texture wiggle line). */
export function WiggleDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`overflow-hidden ${className}`} aria-hidden>
      <svg viewBox="0 0 1200 24" preserveAspectRatio="none" className="h-5 w-full text-emerald">
        <path
          d="M0 12 Q 15 2, 30 12 T 60 12 T 90 12 T 120 12 T 150 12 T 180 12 T 210 12 T 240 12 T 270 12 T 300 12 T 330 12 T 360 12 T 390 12 T 420 12 T 450 12 T 480 12 T 510 12 T 540 12 T 570 12 T 600 12 T 630 12 T 660 12 T 690 12 T 720 12 T 750 12 T 780 12 T 810 12 T 840 12 T 870 12 T 900 12 T 930 12 T 960 12 T 990 12 T 1020 12 T 1050 12 T 1080 12 T 1110 12 T 1140 12 T 1170 12 T 1200 12"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
