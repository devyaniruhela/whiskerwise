'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ThumbsDown, ThumbsUp } from '@phosphor-icons/react';
import { Button, CodeBadge, VerdictBadge } from '@/components/ui';
import { VerdictStamp } from '@/components/wiser/VerdictStamp';
import { api } from '@/lib/api';
import type { Report } from '@/types';

type Row = Report & { analysis_id: string; brand?: string | null; variant?: string | null };

/* NOTE: placeholder report layout — final format/copy is D's (report_template.md).
   Report = read flow: grid-paper wash, content in solid cards, voice in the rationale. */
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

  if (error) return <main className="pt-32 text-center text-base text-ink-muted">{error}</main>;
  if (!report) {
    return (
      <main className="mx-auto max-w-lg px-4 pt-28" aria-busy>
        {[0, 1, 2].map((i) => (
          <div key={i} className="mb-4 animate-pulse rounded-md bg-hairline" style={{ height: i === 0 ? 120 : 72 }} />
        ))}
      </main>
    );
  }

  const name = typeof window !== 'undefined' ? localStorage.getItem('wiser_name') : null;
  const isVet = report.verdict === 'vet_diet';

  return (
    <div className="bg-grid-paper min-h-screen">
      <main className="mx-auto w-full max-w-lg px-4 pb-16 pt-24">
        {name && <p className="text-sm text-ink-muted">Hi {name}, here’s our read:</p>}

        {/* verdict — clean and clear, zero ornament competing with the call */}
        <section className="mt-3 rounded-lg border border-hairline bg-paper p-5 shadow-raised">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-sans text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {[report.brand, report.variant].filter(Boolean).join(' · ')}
              </p>
              <h1 className="mt-2 font-serif text-[1.65rem] leading-snug text-ink">{report.headline}</h1>
              <div className="mt-3"><VerdictBadge verdict={report.verdict} big /></div>
            </div>
            <VerdictStamp verdict={report.verdict} size={120} />
          </div>
          {report.data_quality_warning && (
            <p className="mt-4 rounded-md bg-ochre-tint p-3 text-sm text-ochre">{report.data_quality_warning}</p>
          )}
        </section>

        {isVet && (
          <section className="mt-4 rounded-md border border-graphite/20 bg-petal p-4 text-graphite">
            <p className="text-sm leading-relaxed">{report.therapeutic_purpose}</p>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed">
              {report.per_cat_suitability.map((c, i) => <li key={i}>{c.note}</li>)}
            </ul>
            <p className="mt-3 text-sm font-semibold">{report.vet_disclaimer}</p>
          </section>
        )}

        {report.conditions.length > 0 && (
          <section className="mt-4 rounded-md border border-hairline bg-paper p-4 shadow-raised">
            <h2 className="font-sans text-sm font-semibold text-ink">Conditions on this verdict</h2>
            <ul className="mt-2 space-y-2">
              {report.conditions.map((c, i) => (
                <li key={i} className="border-b border-hairline pb-2 text-sm leading-relaxed text-ink-muted last:border-0 last:pb-0">
                  {c}
                </li>
              ))}
            </ul>
          </section>
        )}

        {report.per_cat_callouts.length > 0 && (
          <section className="mt-4 rounded-md border border-hairline bg-paper p-4 shadow-raised">
            <h2 className="font-sans text-sm font-semibold text-ink">For your cats</h2>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-ink-muted">
              {report.per_cat_callouts.map((c, i) => <li key={i}>{c.note}</li>)}
            </ul>
          </section>
        )}

        {report.health_nudges.length > 0 && (
          <section className="mt-4 rounded-md border border-hairline bg-paper p-4 shadow-raised">
            <h2 className="font-sans text-sm font-semibold text-ink">Worth discussing with your vet</h2>
            <ul className="mt-2 space-y-3 text-sm leading-relaxed text-ink-muted">
              {report.health_nudges.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          </section>
        )}

        {report.detailed_rationale && (
          <details className="mt-4 rounded-md border border-hairline bg-paper p-4 shadow-raised">
            <summary className="cursor-pointer font-sans text-sm font-semibold text-ink">Why this verdict</summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">{report.detailed_rationale}</p>
          </details>
        )}

        {report.standards_cited.length > 0 && (
          <p className="mt-5 flex flex-wrap items-center gap-1.5 text-sm text-ink-faint">
            Checked against {report.standards_cited.map((s) => <CodeBadge key={s}>{s}</CodeBadge>)}
          </p>
        )}

        {/* report feedback — test-flow instrumentation; removed for the main flow later */}
        <section className="mt-6 rounded-md border border-hairline bg-paper p-4 shadow-raised">
          {feedbackSent ? (
            <p className="text-sm font-semibold text-emerald">Thanks — that helps us get better.</p>
          ) : (
            <>
              <p className="font-sans text-sm font-semibold text-ink">Was this report helpful?</p>
              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => setThumb(true)} aria-label="Helpful" aria-pressed={thumb === true}
                  className={`rounded-md border p-2.5 transition-colors ${thumb === true ? 'border-emerald bg-emerald-tint text-emerald' : 'border-hairline-strong text-ink-faint hover:text-ink'}`}>
                  <ThumbsUp size={18} weight={thumb === true ? 'fill' : 'regular'} />
                </button>
                <button onClick={() => setThumb(false)} aria-label="Not helpful" aria-pressed={thumb === false}
                  className={`rounded-md border p-2.5 transition-colors ${thumb === false ? 'border-iron bg-iron-tint text-iron' : 'border-hairline-strong text-ink-faint hover:text-ink'}`}>
                  <ThumbsDown size={18} weight={thumb === false ? 'fill' : 'regular'} />
                </button>
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Anything to add? (optional)"
                  aria-label="Feedback comment"
                  className="min-h-[44px] flex-1 rounded-md border border-hairline-strong bg-paper px-3 text-sm text-ink placeholder:text-ink-faint"
                />
                <Button variant="secondary" onClick={sendFeedback} disabled={thumb === null}>Send</Button>
              </div>
            </>
          )}
        </section>

        <div className="mt-7 text-center">
          <Link href="/food-input" className="font-sans text-sm font-semibold text-emerald underline underline-offset-4 hover:text-emerald-bright">
            Scan another pack →
          </Link>
        </div>
      </main>
    </div>
  );
}
