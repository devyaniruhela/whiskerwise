'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, CircleAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import type { AnalysisState } from '@/types';

const POLL_MS = 1500;
const STAGE_ORDER = ['queued', 'qc', 'extracting', 'awaiting_confirmation', 'assessing', 'explaining', 'done'];

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

  useEffect(() => { poll(); return () => { stop.current = true; }; }, [poll]);

  async function confirm(ok: boolean) {
    if (!id) return;
    setConfirming(true);
    const res = await api.confirm(id, ok, ok ? undefined : note || undefined).catch(() => null);
    setConfirming(false);
    if (!ok) return setFailed(res?.guidance ?? 'Thanks — please retake the photos.');
    setState((s) => (s ? { ...s, status: 'processing', stage: 'assessing', stage_label: 'Scoring against nutrition standards' } : s));
    setTimeout(poll, POLL_MS);
  }

  if (!id) return <p className="text-sm text-gray-500">Missing analysis id.</p>;

  if (failed) {
    return (
      <div className="mx-auto max-w-md pt-10 text-center">
        <CircleAlert className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-4 font-serif text-xl">We need a better look</h1>
        <p className="mt-2 text-sm text-gray-500">{failed}</p>
        <ul className="mx-auto mt-4 max-w-xs list-disc text-left text-xs text-gray-400">
          <li>Bright, even light — no glare or shadows</li>
          <li>Hold steady; fill the frame with the panel</li>
          <li>Ingredients &amp; analysis table fully visible</li>
        </ul>
        <Button className="mt-6" onClick={() => router.push('/food-input')}>Retake photos</Button>
      </div>
    );
  }

  if (state?.status === 'awaiting_confirmation' && state.extract) {
    const e = state.extract;
    return (
      <div className="mx-auto max-w-md pt-6">
        <h1 className="font-serif text-xl">Quick check — does this look right?</h1>
        <p className="mt-1 text-sm text-gray-500">We read this off the pack before judging it.</p>
        <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-soft">
          <p className="font-medium text-gray-900">{e.brand ?? 'Unknown brand'} · {e.variant ?? ''}</p>
          <p className="mt-1 text-xs text-gray-500">
            {[e.type, e.lifestage, e.adequacy].filter(Boolean).join(' · ')}
          </p>
          {e.ingredients && e.ingredients.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              <span className="font-medium text-gray-700">Ingredients: </span>
              {e.ingredients.slice(0, 8).join(', ')}{e.ingredients.length > 8 ? '…' : ''}
            </p>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <Button className="flex-1" disabled={confirming} onClick={() => confirm(true)}>Looks right</Button>
          <Button variant="bordered" className="flex-1" disabled={confirming} onClick={() => confirm(false)}>Something’s off</Button>
        </div>
        <textarea
          value={note}
          onChange={(ev) => setNote(ev.target.value)}
          placeholder="Optional: tell us what’s wrong (helps us improve)"
          className="mt-3 w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-primary-400 focus:outline-none"
          rows={2}
        />
      </div>
    );
  }

  const currentIdx = STAGE_ORDER.indexOf(state?.stage ?? 'queued');
  const steps = [
    { key: 'qc', label: 'Checking your photos' },
    { key: 'extracting', label: 'Reading the label' },
    { key: 'assessing', label: 'Scoring against nutrition standards' },
    { key: 'explaining', label: 'Writing your report' },
  ];
  return (
    <div className="mx-auto max-w-sm pt-14">
      <h1 className="text-center font-serif text-xl">Analysing…</h1>
      <div className="mt-8 space-y-4">
        {steps.map((s) => {
          const idx = STAGE_ORDER.indexOf(s.key);
          const done = currentIdx > idx;
          const active = state?.stage === s.key;
          return (
            <div key={s.key} className="flex items-center gap-3">
              {done ? <CheckCircle2 className="h-5 w-5 text-primary-600" />
                : active ? <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
                : <span className="h-5 w-5 rounded-full border-2 border-gray-200" />}
              <span className={`text-sm ${active ? 'font-medium text-gray-900' : done ? 'text-gray-500' : 'text-gray-300'}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LoadingPage() {
  return <Suspense fallback={null}><LoadingInner /></Suspense>;
}
