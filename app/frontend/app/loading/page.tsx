'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CornersOut, ListMagnifyingGlass, Sun, WarningCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui';
import { ExtractReview, type ReviewFeedback } from '@/components/wiser/ExtractReview';
import { ReportSkeleton } from '@/components/wiser/ReportSkeleton';
import { ReportView } from '@/components/wiser/ReportView';
import { ScanStepper, type ScanStep, type StepState } from '@/components/wiser/ScanStepper';
import { api } from '@/lib/api';
import type { ExtractSummary, Report } from '@/types';

/* Post-scan flow (PRD §8.6): pinned 5-step stepper + a detail region that moves through
   reading → extract review → report skeleton → the report itself, all on one page so the
   stepper stays above the report (§8.6.1). Steps 2–5 are perceived-performance cover for
   the real report generation (§8.6.3); the extract review never gates the report: the
   one hard stop is low extraction confidence (§8.4). */

const POLL_MS = 1500;
const STEP_MS = 3000; // per filler step: placeholder timing, tune against measured backend latency
const MAX_NAME_CHARS = 14; // single-cat label limit before falling back to "your cats" ([Open], §8.6.7)

const FAIL_STATUSES = ['qc_failed', 'no_verdict', 'error'];

function step5Label(catNames: string[]): string {
  if (catNames.length === 0) return 'Personalising';
  if (catNames.length === 1 && catNames[0].length <= MAX_NAME_CHARS) return `Personalising for ${catNames[0]}`;
  return 'Personalising for your cats';
}

function ErrorState({ guidance, onRetry }: { guidance: string | null; onRetry: () => void }) {
  const tips = [
    { icon: Sun, title: 'Bright, even light', detail: 'No glare or hard shadows on the pack.' },
    { icon: CornersOut, title: 'Fill the frame', detail: 'Hold steady: the panel should cover most of the shot.' },
    { icon: ListMagnifyingGlass, title: 'Back panel matters most', detail: 'Ingredients and the analysis table fully visible.' },
  ];
  return (
    <div className="mx-auto max-w-md pt-8 text-center" role="alert">
      <WarningCircle size={40} className="mx-auto text-ochre" aria-hidden />
      <h1 className="mt-4 font-serif text-2xl text-ink">Uh oh. Looks like we couldn&rsquo;t read the label too well.</h1>
      {guidance && <p className="mt-2 text-base text-ink-muted">{guidance}</p>}
      <ul className="mt-6 space-y-2 text-left">
        {tips.map((t) => (
          <li key={t.title} className="flex items-start gap-3 rounded-md border border-hairline bg-paper p-3 shadow-raised">
            <t.icon size={20} className="mt-0.5 shrink-0 text-emerald" aria-hidden />
            <span>
              <span className="block font-sans text-sm font-semibold text-ink">{t.title}</span>
              <span className="block text-sm text-ink-muted">{t.detail}</span>
            </span>
          </li>
        ))}
      </ul>
      <Button className="mt-7" onClick={onRetry}>Try again</Button>
    </div>
  );
}

function LoadingInner() {
  const router = useRouter();
  // Capture once: the report reveal swaps the URL to /report/{id} (no query) via
  // history.replaceState, and Next syncs useSearchParams: reading live would drop the id.
  const search = useSearchParams();
  const idRef = useRef<string | null>(null);
  if (idRef.current === null) idRef.current = search.get('analysis_id');
  const id = idRef.current;
  const [extract, setExtract] = useState<ExtractSummary | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [catNames, setCatNames] = useState<string[]>([]);
  const [phase, setPhase] = useState(0); // 0 reading · 1–4 active step index · 5 timeline done
  const [reviewOpen, setReviewOpen] = useState(true);
  const [review, setReview] = useState<ReviewFeedback>('idle');
  const stop = useRef(false);
  const name = typeof window !== 'undefined' ? localStorage.getItem('wiser_name') : null;

  // Cat names for the "Personalising for {cat}" label: handed off by food-input (§8.6.3)
  useEffect(() => {
    if (!id) return;
    try {
      setCatNames(JSON.parse(sessionStorage.getItem(`wiser_scan_cats:${id}`) ?? '[]'));
    } catch { /* general run */ }
  }, [id]);

  const poll = useCallback(async () => {
    if (!id || stop.current) return;
    try {
      const s = await api.poll(id);
      if (s.extract) setExtract((cur) => cur ?? s.extract!);
      if (FAIL_STATUSES.includes(s.status)) {
        setFailed(s.guidance ?? 'We couldn’t finish this scan: please try again.');
        return;
      }
      if (s.status === 'done' && s.report) return setReport(s.report);
      setTimeout(poll, POLL_MS);
    } catch {
      setTimeout(poll, POLL_MS * 2);
    }
  }, [id]);

  // reset the stop flag on (re)mount: React StrictMode mounts twice in dev, and without
  // this the cleanup's stop=true would kill every poll after the first one.
  useEffect(() => { stop.current = false; poll(); return () => { stop.current = true; }; }, [poll]);

  // Extraction landed → run the timed steps 2–5 (§8.6.3); report generates behind them.
  useEffect(() => {
    if (!extract) return;
    setPhase(1);
    const timers = [2, 3, 4, 5].map((p, i) => setTimeout(() => setPhase(p), STEP_MS * (i + 1)));
    return () => timers.forEach(clearTimeout);
  }, [extract]);

  // "Preparing insights" auto-collapses the review if it's still open (§8.6.4)
  useEffect(() => { if (phase === 3) setReviewOpen(false); }, [phase]);

  const personalised = catNames.length > 0;
  const revealed = phase >= 5 && report !== null && !failed;

  // Report rendered in place: swap the URL so refresh/share land on the real report route (§8.6.5)
  useEffect(() => {
    if (!revealed || !id) return;
    window.history.replaceState(null, '', `/report/${id}`);
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    window.scrollTo({ top: 0, behavior });
  }, [revealed, id]);

  const steps: ScanStep[] = useMemo(() => {
    const labels = ['Reading the label', 'Evaluating ingredients', 'Analysing nutritional profile', 'Preparing insights', step5Label(catNames)];
    // Any failure is presented as a label-reading stop (§8.4): error pins to step 1,
    // the rest reset to pending, regardless of how far the filler timers got.
    if (failed) return labels.map((label, i) => ({ label, state: (i === 0 ? 'error' : 'pending') as StepState }));
    return labels.map((label, i) => {
      let state: StepState;
      if (i === 4 && !personalised) state = phase === 4 ? 'locked-active' : 'locked';
      else if (i === 4 && phase >= 5) state = report ? 'unlocked' : 'active';
      else if (i < phase) state = 'done';
      else if (i === phase) state = 'active';
      else state = 'pending';
      return { label, state };
    });
  }, [catNames, personalised, phase, report, failed]);

  const detailLine = useMemo(() => {
    if (phase === 1) return 'Sizing up each ingredient against the standards…';
    if (phase === 2) return 'Reading the numbers: protein, fat, and what they mean…';
    if (phase === 3) return 'Pulling your report together…';
    if (phase >= 4 && !personalised) return 'General read this time: add your cat next time for a tailored one.';
    if (phase === 4) return catNames.length === 1 ? `Tailoring the read to ${catNames[0]}…` : 'Tailoring the read to your cats…';
    return 'Almost there…';
  }, [phase, personalised, catNames]);

  function handleFeedback(choice: Exclude<ReviewFeedback, 'idle'>, note: string) {
    setReview(choice);
    setReviewOpen(false);
    if (choice !== 'skip' && id) api.confirm(id, choice === 'good', note.trim() || undefined).catch(() => null);
  }

  if (!id) return <main className="pt-32 text-center text-sm text-ink-muted">Missing analysis id.</main>;

  const activeStep = steps.find((s) => s.state === 'active' || s.state === 'locked-active');

  return (
    <div className="min-h-screen bg-grid-paper pt-16 sm:pt-[72px] lg:pt-20">
      <ScanStepper steps={steps} />
      <p className="sr-only" role="status">
        {failed ? 'The scan stopped: we couldn’t read the label.' : revealed ? 'Your report is ready.' : activeStep?.label}
      </p>

      <main className="mx-auto w-full max-w-lg px-4 pb-16 pt-6">
        {failed ? (
          <ErrorState guidance={failed} onRetry={() => router.push('/food-input')} />
        ) : revealed ? (
          <div className="animate-fade-up">
            <ReportView report={{ ...report!, analysis_id: id, brand: extract?.brand, variant: extract?.variant }} name={name} />
            {extract && (
              <div className="mt-8">
                <ExtractReview
                  extract={extract}
                  open={reviewOpen}
                  onToggle={setReviewOpen}
                  feedback={review}
                  onFeedback={handleFeedback}
                  title="What we read off the pack"
                  showSkip={false}
                />
              </div>
            )}
          </div>
        ) : !extract ? (
          <div className="mx-auto max-w-md pt-8 text-center">
            <h1 className="font-serif text-2xl text-ink">Reading the label</h1>
            <p className="mt-1.5 text-base text-ink-muted">Every word on the pack, front and back: takes a few seconds.</p>
            <div aria-hidden className="mx-auto mt-6 max-w-sm space-y-2.5 rounded-lg border border-hairline bg-paper p-4 shadow-raised">
              {['w-full', 'w-[85%]', 'w-[92%]', 'w-[55%]'].map((w) => (
                <div key={w} className={`shimmer h-3.5 rounded-sm ${w}`} />
              ))}
            </div>
          </div>
        ) : (
          <>
            <p key={detailLine} className="mb-4 animate-fade-up text-center text-sm text-ink-muted">{detailLine}</p>
            <div className="animate-fade-up">
              <ExtractReview
                extract={extract}
                open={reviewOpen}
                onToggle={setReviewOpen}
                feedback={review}
                onFeedback={handleFeedback}
                title="Quick check: is this what’s on the pack?"
              />
            </div>
            {phase >= 3 && (
              <div className="mt-4 animate-fade-up">
                <ReportSkeleton />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function LoadingPage() {
  return <Suspense fallback={null}><LoadingInner /></Suspense>;
}
