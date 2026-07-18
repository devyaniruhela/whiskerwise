/* Report ghost with shimmer: "Preparing insights" fills the wait with the shape of
   what's coming (PRD §8.6.3). Mirrors ReportView's layout: verdict card with stamp,
   then condition/rationale cards. */
export function ReportSkeleton() {
  return (
    <div aria-hidden className="space-y-4">
      <div className="rounded-lg border border-hairline bg-paper p-5 shadow-raised">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="shimmer h-3 w-2/5 rounded-sm" />
            <div className="shimmer mt-3 h-7 w-full rounded-sm" />
            <div className="shimmer mt-2 h-7 w-3/4 rounded-sm" />
            <div className="shimmer mt-4 h-7 w-28 rounded-sm" />
          </div>
          <div className="shimmer h-[104px] w-[104px] shrink-0 rounded-full" />
        </div>
      </div>
      {[3, 2].map((rows, card) => (
        <div key={card} className="rounded-md border border-hairline bg-paper p-4 shadow-raised">
          <div className="shimmer h-4 w-1/3 rounded-sm" />
          <div className="mt-3 space-y-2.5">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className={`shimmer h-3.5 rounded-sm ${i % 2 ? 'w-4/5' : 'w-full'}`} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
