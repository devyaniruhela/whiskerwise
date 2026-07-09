'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, CircleNotch, WarningCircle } from '@phosphor-icons/react';
import { Button, Textarea, CodeBadge } from '@/components/ui';
import { api } from '@/lib/api';
import type { AnalysisState } from '@/types';

const POLL_MS = 1500;
const STAGE_ORDER = ['queued', 'qc', 'extracting', 'awaiting_confirmation', 'assessing', 'explaining', 'done'];
const STEPS = [
  { key: 'qc', label: 'Checking your photos' },
  { key: 'extracting', label: 'Reading the label' },
  { key: 'assessing', label: 'Scoring against nutrition standards' },
  { key: 'explaining', label: 'Writing your report' },
];

function LoadingInner() {
  const router = useRouter();
  const id = useSearchParams().get('analysis_id');
  const [state, setState] = useState<AnalysisState | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [confirming, setConfirming] = useState(false);
  const stop = useRef(false);

  const poll = useCallback(async () => {
    if (!id || stop.current) return;
    try {
      const s = await api.poll(id);
      setState(s);
      if (s.status === 'done') return router.push(`/report/${id}`);
      if (['qc_failed', 'no_verdict', 'error'].includes(s.status)) {
        setFailed(s.guidance ?? 'We couldn’t finish this scan — please try again.');
        return;
      }
      if (s.status !== 'awaiting_confirmation') setTimeout(poll, POLL_MS);
    } catch {
      setTimeout(poll, POLL_MS * 2);
    }
  }, [id, router]);

  // reset the stop flag on (re)mount — React StrictMode mounts twice in dev, and without
  // this the cleanup's stop=true would kill every poll after the first one.
  useEffect(() => { stop.current = false; poll(); return () => { stop.current = true; }; }, [poll]);

  async function confirm(ok: boolean) {
    if (!id) return;
    setConfirming(true);
    const res = await api.confirm(id, ok, ok ? undefined : note || undefined).catch(() => null);
    setConfirming(false);
    if (!ok) return setFailed(res?.guidance ?? 'Thanks — please retake the photos.');
    setState((s) => (s ? { ...s, status: 'processing', stage: 'assessing' } : s));
    setTimeout(poll, POLL_MS);
  }

  if (!id) return <main className="pt-32 text-center text-sm text-ink-muted">Missing analysis id.</main>;

  if (failed) {
    return (
      <main className="mx-auto max-w-md px-4 pt-32 text-center">
        <WarningCircle size={40} className="mx-auto text-ochre" aria-hidden />
        <h1 className="mt-4 font-serif text-2xl text-ink">We need a better look</h1>
        <p className="mt-2 text-base text-ink-muted">{failed}</p>
        <ul className="mx-auto mt-5 max-w-xs list-disc pl-5 text-left text-sm leading-relaxed text-ink-muted">
          <li>Bright, even light — no glare or shadows</li>
          <li>Hold steady; fill the frame with the panel</li>
          <li>Ingredients &amp; analysis table fully visible</li>
        </ul>
        <Button className="mt-7" onClick={() => router.push('/food-input')}>Retake photos</Button>
      </main>
    );
  }

  /* Extraction confirm checkpoint — kept sober (write flow); data in mono per token lanes */
  if (state?.status === 'awaiting_confirmation' && state.extract) {
    const e = state.extract;
    return (
      <main className="mx-auto max-w-md px-4 pb-16 pt-28">
        <h1 className="font-serif text-2xl text-ink">Quick check — does this look right?</h1>
        <p className="mt-1.5 text-base text-ink-muted">This is what we read off the pack, before any judging.</p>
        <div className="mt-5 rounded-md border border-hairline bg-paper p-4 shadow-raised">
          <p className="font-sans text-base font-semibold text-ink">
            {e.brand ?? 'Unknown brand'}{e.variant ? ` · ${e.variant}` : ''}
          </p>
          <p className="mt-1.5 flex flex-wrap gap-1.5">
            {[e.type, e.lifestage, e.adequacy].filter(Boolean).map((v) => <CodeBadge key={v}>{v}</CodeBadge>)}
          </p>
          {e.ingredients && e.ingredients.length > 0 && (
            <p className="mt-3 font-mono text-sm leading-relaxed text-ink-muted">
              {e.ingredients.slice(0, 8).join(', ')}{e.ingredients.length > 8 ? '…' : ''}
            </p>
          )}
        </div>
        <div className="mt-5 flex gap-3">
          <Button className="flex-1" disabled={confirming} onClick={() => confirm(true)}>Looks right</Button>
          <Button variant="secondary" className="flex-1" disabled={confirming} onClick={() => confirm(false)}>Something’s off</Button>
        </div>
        <Textarea className="mt-4" label="What’s wrong? (optional — helps us improve)" rows={2}
          value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="e.g. the brand name is misread" />
      </main>
    );
  }

  const currentIdx = STAGE_ORDER.indexOf(state?.stage ?? 'queued');
  return (
    <main className="mx-auto max-w-sm px-4 pt-36">
      <h1 className="text-center font-serif text-2xl text-ink">Analysing…</h1>
      <div className="mt-9 space-y-5">
        {STEPS.map((s) => {
          const idx = STAGE_ORDER.indexOf(s.key);
          const done = currentIdx > idx;
          const active = state?.stage === s.key;
          return (
            <div key={s.key} className="flex items-center gap-3">
              {done ? <CheckCircle size={22} weight="fill" className="text-emerald" aria-hidden />
                : active ? <CircleNotch size={22} className="animate-spin text-emerald" aria-hidden />
                : <span className="h-[22px] w-[22px] rounded-full border-2 border-hairline-strong" aria-hidden />}
              <span className={`font-sans text-base ${active ? 'font-semibold text-ink' : done ? 'text-ink-muted' : 'text-ink-faint'}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default function LoadingPage() {
  return <Suspense fallback={null}><LoadingInner /></Suspense>;
}
