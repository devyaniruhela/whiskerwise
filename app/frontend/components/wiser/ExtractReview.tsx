'use client';

import { useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { Button, CodeBadge, Textarea } from '@/components/ui';
import type { ExtractSummary } from '@/types';

/* Extracted-label review (PRD §8.6.4/§8.6.5): one surface, two homes: in-flow on the
   scan progress screen, and on the report page (linkable via /report/{id}?view=extract).
   Shows everything read off the pack, ingredients first; feedback is persisted signal
   only and never gates the report. The feedback scaffolding is testing-phase UI. */

export type ReviewFeedback = 'idle' | 'good' | 'off' | 'skip';

interface Props {
  extract: ExtractSummary;
  open: boolean;
  onToggle: (open: boolean) => void;
  feedback: ReviewFeedback;
  onFeedback: (choice: Exclude<ReviewFeedback, 'idle'>, note: string) => void;
  title?: string;
  /** hide the tertiary skip CTA outside the live flow (report page) */
  showSkip?: boolean;
}

const pct = (v?: number | null) => (v == null ? null : `${+(v * 100).toFixed(1)}%`);

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 first:mt-0">
      <h3 className="font-sans text-sm font-semibold text-ink">{label}</h3>
      <div className="mt-1.5">{children}</div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-hairline py-1.5 last:border-0">
      <dt className="font-sans text-sm text-ink-muted">{label}</dt>
      <dd className="text-right font-mono text-sm text-ink">{value}</dd>
    </div>
  );
}

const FEEDBACK_NOTE: Record<Exclude<ReviewFeedback, 'idle'>, string> = {
  good: 'Thanks: you marked this read as accurate.',
  off: 'Logged: we’ll check this read against your photos.',
  skip: 'No problem: you can review this any time from your report.',
};

const HEADER_CHIP: Partial<Record<ReviewFeedback, string>> = {
  good: 'Marked accurate',
  off: 'Flagged',
};

export function ExtractReview({ extract: e, open, onToggle, feedback, onFeedback, title, showSkip = true }: Props) {
  const [note, setNote] = useState('');
  const ga = e.guaranteed_analysis;
  const gaRows: [string, string | null][] = [
    ['Protein', pct(ga?.protein)],
    ['Fat', pct(ga?.fat)],
    ['Fibre', pct(ga?.fibre)],
    ['Ash', pct(ga?.ash)],
    ['Moisture', pct(ga?.moisture)],
  ];
  const declaredGa = gaRows.filter(([, v]) => v != null);
  const unreadable = (e.unreadable_fields ?? []).filter(Boolean);

  return (
    <section className="rounded-lg border border-hairline bg-paper shadow-raised">
      <button
        type="button"
        onClick={() => onToggle(!open)}
        aria-expanded={open}
        className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span>
          <span className="block font-sans text-base font-semibold text-ink">{title ?? 'What we read off the pack'}</span>
          <span className="mt-0.5 block text-sm text-ink-muted">Straight from the label: before any judging.</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {HEADER_CHIP[feedback] && (
            <span className={`font-sans text-xs font-semibold ${feedback === 'good' ? 'text-emerald' : 'text-ochre'}`}>
              {HEADER_CHIP[feedback]}
            </span>
          )}
          <CaretDown size={16} aria-hidden className={`text-ink-faint transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="border-t border-hairline px-4 py-4">
            <p className="font-sans text-base font-semibold text-ink">
              {e.brand ?? 'Unknown brand'}
              {e.variant ? ` · ${e.variant}` : ''}
            </p>
            <p className="mt-2 flex flex-wrap gap-1.5">
              {[e.type, e.lifestage, e.adequacy].filter((v) => v && v !== 'unknown').map((v) => (
                <CodeBadge key={v}>{v}</CodeBadge>
              ))}
              {e.aafco_certified && <CodeBadge>AAFCO certified</CodeBadge>}
              {e.translated_flag && <CodeBadge>translated{e.detected_language ? ` from ${e.detected_language}` : ''}</CodeBadge>}
            </p>

            {unreadable.length > 0 && (
              <p className="mt-3 rounded-md bg-ochre-tint p-3 text-sm text-ochre">
                We couldn&rsquo;t read: {unreadable.join(', ')}.
              </p>
            )}

            <Section label="Ingredients: pack order">
              {e.ingredients?.length ? (
                <p className="font-mono text-sm leading-relaxed text-ink-muted">{e.ingredients.join(', ')}</p>
              ) : (
                <p className="text-sm text-ochre">Couldn&rsquo;t read the ingredient list.</p>
              )}
            </Section>

            <Section label="Guaranteed analysis">
              {declaredGa.length || ga?.others?.length ? (
                <dl>
                  {declaredGa.map(([label, value]) => (
                    <Detail key={label} label={label} value={value} />
                  ))}
                  {ga?.others?.map((o) => (
                    <Detail key={o.label} label={o.label} value={o.value} />
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-ochre">No analysis table found on the pack.</p>
              )}
            </Section>

            {(e.claims?.length ?? 0) > 0 && (
              <Section label="Claims on the pack">
                <ul className="space-y-1">
                  {e.claims!.map((c) => (
                    <li key={c} className="font-mono text-sm text-ink-muted">&ldquo;{c}&rdquo;</li>
                  ))}
                </ul>
              </Section>
            )}

            {(e.additives?.length ?? 0) > 0 && (
              <Section label="Additives">
                <p className="font-mono text-sm leading-relaxed text-ink-muted">{e.additives!.join(', ')}</p>
              </Section>
            )}

            <Section label="The fine print">
              <dl>
                {e.taurine_added != null && <Detail label="Taurine added" value={e.taurine_added ? 'yes' : 'no'} />}
                {e.weight_g != null && <Detail label="Net weight" value={`${e.weight_g} g`} />}
                {e.met_energy_100g && <Detail label="Energy / 100 g" value={e.met_energy_100g} />}
                {e.texture && <Detail label="Texture" value={e.texture} />}
                {e.intended_use && <Detail label="Intended use" value={e.intended_use} />}
                {(e.other_certifications?.length ?? 0) > 0 && (
                  <Detail label="Other certifications" value={e.other_certifications!.join(', ')} />
                )}
                {e.confidence != null && <Detail label="Read confidence" value={e.confidence.toFixed(2)} />}
              </dl>
            </Section>
          </div>

          {/* Feedback capture: testing-phase scaffolding (PRD §8.6.5); persisted to Extract_feedback */}
          <div className="border-t border-hairline px-4 py-4">
            {feedback === 'idle' ? (
              <>
                <p className="font-sans text-sm font-semibold text-ink">Does this match the pack?</p>
                <Textarea
                  className="mt-2"
                  rows={2}
                  value={note}
                  onChange={(ev) => setNote(ev.target.value)}
                  placeholder="Anything we misread? (optional)"
                  aria-label="Notes on what we read"
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button onClick={() => onFeedback('good', note)}>Looks good</Button>
                  <Button variant="secondary" onClick={() => onFeedback('off', note)}>Something&rsquo;s off</Button>
                  {showSkip && (
                    <Button variant="tertiary" onClick={() => onFeedback('skip', note)}>Can&rsquo;t check now</Button>
                  )}
                </div>
              </>
            ) : (
              <p className={`text-sm font-semibold ${feedback === 'off' ? 'text-ochre' : 'text-emerald'}`}>
                {FEEDBACK_NOTE[feedback]}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
