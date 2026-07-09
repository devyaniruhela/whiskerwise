import type { Verdict } from '@/types';

/** Verdict badges reuse the verdict color semantics; CodeBadge renders standards codes in mono. */
const VERDICT_CLS: Record<Verdict, string> = {
  buy: 'bg-emerald-tint text-emerald border-emerald/30', // the one sanctioned pale-emerald use
  buy_with_conditions: 'bg-ochre-tint text-ochre border-ochre/30',
  skip: 'bg-iron-tint text-iron border-iron/30',
  vet_diet: 'bg-petal text-graphite border-graphite/20',
  no_verdict: 'bg-paper text-ink-muted border-hairline-strong',
};

export const VERDICT_LABEL: Record<Verdict, string> = {
  buy: 'Buy',
  buy_with_conditions: 'Buy, carefully',
  skip: 'Skip',
  vet_diet: 'Vet-directed',
  no_verdict: 'No verdict',
};

export function VerdictBadge({ verdict, big = false }: { verdict: Verdict; big?: boolean }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-sm border font-sans font-semibold ${VERDICT_CLS[verdict] ?? VERDICT_CLS.no_verdict} ${big ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'}`}
    >
      {VERDICT_LABEL[verdict] ?? verdict}
    </span>
  );
}

export function CodeBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-sm border border-hairline bg-paper px-1.5 py-0.5 font-mono text-xs text-ink-muted">
      {children}
    </span>
  );
}
