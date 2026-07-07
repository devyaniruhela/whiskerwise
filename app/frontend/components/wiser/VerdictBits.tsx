import type { Verdict } from '@/types';

export const VERDICT_META: Record<Verdict, { label: string; cls: string }> = {
  buy: { label: 'Buy', cls: 'bg-primary-100 text-primary-800 border-primary-300' },
  buy_with_conditions: { label: 'Buy with conditions', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  skip: { label: 'Skip', cls: 'bg-red-100 text-red-700 border-red-300' },
  vet_diet: { label: 'Vet-directed diet', cls: 'bg-blue-100 text-blue-800 border-blue-300' },
  no_verdict: { label: 'No verdict', cls: 'bg-gray-100 text-gray-600 border-gray-300' },
};

export function VerdictChip({ verdict, big }: { verdict: Verdict; big?: boolean }) {
  const m = VERDICT_META[verdict] ?? VERDICT_META.no_verdict;
  return (
    <span className={`inline-block rounded-full border font-medium ${m.cls} ${big ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-0.5 text-xs'}`}>
      {m.label}
    </span>
  );
}
