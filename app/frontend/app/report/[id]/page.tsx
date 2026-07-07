'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui';
import { VerdictChip } from '@/components/wiser/VerdictBits';
import { api } from '@/lib/api';
import type { Report } from '@/types';

type Row = Report & { analysis_id: string; brand?: string | null; variant?: string | null };

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [report, setReport] = useState<Row | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thumb, setThumb] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    api.report(id).then((r) => setReport(r as Row)).catch(() => setError('Report not found.'));
  }, [id]);

  async function sendFeedback() {
    if (thumb === null) return;
    await api.feedback(id, thumb, comment || undefined).catch(() => null);
    setFeedbackSent(true);
  }

  if (error) return <p className="pt-10 text-center text-sm text-gray-500">{error}</p>;
  if (!report) return <p className="pt-10 text-center text-sm text-gray-400">Loading report…</p>;

  const name = typeof window !== 'undefined' ? localStorage.getItem('wiser_name') : null;
  const isVet = report.verdict === 'vet_diet';

  return (
    <div className="mx-auto max-w-lg">
      {/* NOTE: placeholder report layout — final format/copy is D's, see report_template.md */}
      {name && <p className="text-sm text-gray-400">Hi {name}, here’s our read:</p>}
      <div className="mt-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">{report.brand ?? ''} {report.variant ?? ''}</p>
          <h1 className="mt-1 font-serif text-2xl leading-snug">{report.headline}</h1>
        </div>
        <VerdictChip verdict={report.verdict} big />
      </div>

      {report.data_quality_warning && (
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">{report.data_quality_warning}</p>
      )}

      {isVet && (
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          <p>{report.therapeutic_purpose}</p>
          <ul className="mt-2 space-y-1">
            {report.per_cat_suitability.map((c, i) => <li key={i}>{c.note}</li>)}
          </ul>
          <p className="mt-2 text-xs font-medium">{report.vet_disclaimer}</p>
        </div>
      )}

      {report.conditions.length > 0 && (
        <ul className="mt-4 space-y-2">
          {report.conditions.map((c, i) => (
            <li key={i} className="rounded-xl border border-gray-100 bg-white p-3 text-sm text-gray-700 shadow-soft">{c}</li>
          ))}
        </ul>
      )}

      {report.per_cat_callouts.length > 0 && (
        <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-soft">
          <h2 className="text-sm font-medium text-gray-800">For your cats</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-gray-600">
            {report.per_cat_callouts.map((c, i) => <li key={i}>{c.note}</li>)}
          </ul>
        </div>
      )}

      {report.health_nudges.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
          <h2 className="text-sm font-medium text-amber-900">Worth discussing with your vet</h2>
          <ul className="mt-2 space-y-2 text-xs leading-relaxed text-amber-900/90">
            {report.health_nudges.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}

      {report.detailed_rationale && (
        <details className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-soft">
          <summary className="cursor-pointer text-sm font-medium text-gray-800">Why this verdict</summary>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{report.detailed_rationale}</p>
        </details>
      )}

      {report.standards_cited.length > 0 && (
        <p className="mt-4 text-xs text-gray-400">Checked against: {report.standards_cited.join(' · ')}</p>
      )}

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-soft">
        {feedbackSent ? (
          <p className="text-sm text-primary-700">Thanks — that helps us get better.</p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-800">Was this report helpful?</p>
            <div className="mt-2 flex items-center gap-2">
              <button onClick={() => setThumb(true)} aria-label="Helpful"
                className={`rounded-full border p-2 ${thumb === true ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-400'}`}>
                <ThumbsUp className="h-4 w-4" />
              </button>
              <button onClick={() => setThumb(false)} aria-label="Not helpful"
                className={`rounded-full border p-2 ${thumb === false ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-200 text-gray-400'}`}>
                <ThumbsDown className="h-4 w-4" />
              </button>
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Anything to add? (optional)"
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
              />
              <Button variant="secondary" onClick={sendFeedback} disabled={thumb === null}>Send</Button>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link href="/food-input" className="text-sm font-medium text-primary-700 hover:underline">Scan another pack →</Link>
      </div>
    </div>
  );
}
