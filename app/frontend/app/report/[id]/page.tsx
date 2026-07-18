'use client';

import { Suspense, use, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ExtractReview, type ReviewFeedback } from '@/components/wiser/ExtractReview';
import { ReportView, type ReportRow } from '@/components/wiser/ReportView';
import { api } from '@/lib/api';
import type { ExtractSummary } from '@/types';

type Row = ReportRow & { extract?: ExtractSummary | null };

/* Report page (PRD §8.3/§8.6.5): shared ReportView plus the extraction section.
   /report/{id}?view=extract auto-opens and scrolls to the extraction review: same
   surface as the in-flow one, addressable per scan for test sessions. */
function ReportInner({ id }: { id: string }) {
  const view = useSearchParams().get('view');
  const [report, setReport] = useState<Row | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractOpen, setExtractOpen] = useState(view === 'extract');
  const [review, setReview] = useState<ReviewFeedback>('idle');
  const extractRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.report(id).then((r) => setReport(r as Row)).catch(() => setError('Report not found.'));
  }, [id]);

  // Deferred a tick: Next's post-navigation scroll-to-top otherwise cancels the smooth scroll
  useEffect(() => {
    if (!report || view !== 'extract') return;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    const t = setTimeout(() => extractRef.current?.scrollIntoView({ behavior, block: 'start' }), 150);
    return () => clearTimeout(t);
  }, [report, view]);

  function handleFeedback(choice: Exclude<ReviewFeedback, 'idle'>, note: string) {
    setReview(choice);
    if (choice !== 'skip') api.confirm(id, choice === 'good', note.trim() || undefined).catch(() => null);
  }

  if (error) return <main className="pt-32 text-center text-base text-ink-muted">{error}</main>;
  if (!report) {
    return (
      <main className="mx-auto max-w-lg px-4 pt-28" aria-busy>
        {[0, 1, 2].map((i) => (
          <div key={i} className="shimmer mb-4 rounded-md" style={{ height: i === 0 ? 120 : 72 }} />
        ))}
      </main>
    );
  }

  const name = typeof window !== 'undefined' ? localStorage.getItem('wiser_name') : null;

  return (
    <div className="bg-grid-paper min-h-screen">
      <main className="mx-auto w-full max-w-lg px-4 pb-16 pt-24">
        <ReportView report={report} name={name} />
        {report.extract && (
          <div ref={extractRef} className="mt-8 scroll-mt-24">
            <ExtractReview
              extract={report.extract}
              open={extractOpen}
              onToggle={setExtractOpen}
              feedback={review}
              onFeedback={handleFeedback}
              title="What we read off the pack"
              showSkip={false}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <Suspense fallback={null}><ReportInner id={id} /></Suspense>;
}
