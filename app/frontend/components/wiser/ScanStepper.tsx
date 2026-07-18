'use client';

import { useMemo } from 'react';
import { CaretDown, Check, LockSimple, LockSimpleOpen, X } from '@phosphor-icons/react';

/* Post-scan progress stepper (PRD §8.6.1/§8.6.2): pinned under the app header for the
   whole flow, including above the report. Visual per ui-inspo/progress-bar.png translated
   to Wiser tokens: numbered circles, filled+check on complete, caret over the active step,
   connector segments that fill in emerald. */

export type StepState =
  | 'pending'        // muted, not reached
  | 'active'         // caret + spinner ring
  | 'done'           // emerald fill + check
  | 'locked'         // step 5, general run: padlock, never unlocks (§8.6.3)
  | 'locked-active'  // padlock with the caret while it "runs"
  | 'unlocked'       // step 5, personalised: open lock + confetti
  | 'error';         // step 1 when the flow stops (§8.4)

export interface ScanStep {
  label: string;
  state: StepState;
}

const CONFETTI_COLOURS = ['#0C7355', '#F6C2C9', '#A34700', '#F5E7CF', '#08513D'];

function Confetti() {
  // Deterministic fan so SSR/CSR match; transform+opacity only, reduced-motion kills it.
  const pieces = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const dist = 34 + (i % 3) * 14;
        return {
          tx: `${Math.round(Math.cos(angle) * dist)}px`,
          ty: `${Math.round(Math.sin(angle) * dist - 10)}px`,
          rot: `${(i % 2 ? 1 : -1) * (120 + i * 17)}deg`,
          colour: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
          round: i % 3 === 0,
          delay: `${(i % 4) * 40}ms`,
        };
      }),
    [],
  );
  return (
    <span aria-hidden className="absolute inset-0">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`confetti-piece ${p.round ? 'rounded-full' : 'rounded-[1px]'}`}
          style={{ '--tx': p.tx, '--ty': p.ty, '--rot': p.rot, backgroundColor: p.colour, animationDelay: p.delay } as React.CSSProperties}
        />
      ))}
    </span>
  );
}

function Circle({ state, index }: { state: StepState; index: number }) {
  const base = 'relative z-[1] flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-300';
  if (state === 'done')
    return (
      <span className={`${base} border-emerald bg-emerald text-seashell`}>
        <Check size={15} weight="bold" className="animate-pop" aria-hidden />
      </span>
    );
  if (state === 'unlocked')
    return (
      <span className={`${base} border-emerald bg-emerald text-seashell`}>
        <LockSimpleOpen size={15} weight="bold" className="animate-pop" aria-hidden />
        <Confetti />
      </span>
    );
  if (state === 'error')
    return (
      <span className={`${base} border-iron bg-iron text-seashell`}>
        <X size={14} weight="bold" aria-hidden />
      </span>
    );
  if (state === 'locked' || state === 'locked-active')
    return (
      <span className={`${base} border-dashed border-hairline-strong bg-seashell text-ink-faint`}>
        <LockSimple size={14} aria-hidden />
      </span>
    );
  const active = state === 'active';
  return (
    <span
      className={`${base} font-sans text-[13px] font-semibold ${
        active ? 'border-emerald bg-paper text-emerald' : 'border-hairline-strong bg-seashell text-ink-faint'
      }`}
    >
      {index + 1}
      {active && (
        <span
          aria-hidden
          className="absolute -inset-[7px] animate-[spin_1.1s_linear_infinite] rounded-full border-2 border-emerald/20 border-t-emerald/70"
        />
      )}
    </span>
  );
}

export function ScanStepper({ steps }: { steps: ScanStep[] }) {
  const activeIdx = steps.findIndex((s) => s.state === 'active' || s.state === 'locked-active');
  const errorIdx = steps.findIndex((s) => s.state === 'error');
  const lockedIdx = steps.findIndex((s) => s.state === 'locked');
  const lastDone = steps.reduce((acc, s, i) => (s.state === 'done' || s.state === 'unlocked' ? i : acc), -1);
  // Mobile shows one caption. Prefer the active step; then any error; then a still-locked step
  // so its name (the 'Personalising' nudge) is legible without hover; else the last done step.
  const mobileIdx = activeIdx >= 0 ? activeIdx : errorIdx >= 0 ? errorIdx : lockedIdx >= 0 ? lockedIdx : lastDone;
  const filled = (i: number) => ['done', 'unlocked'].includes(steps[i].state);

  return (
    <div className="sticky top-16 z-sticky border-b border-hairline bg-seashell/95 backdrop-blur-sm sm:top-[72px] lg:top-20">
      <ol className="mx-auto grid max-w-xl grid-cols-5 px-2 pt-5 sm:px-6">
        {steps.map((s, i) => {
          const showCaret = s.state === 'active' || s.state === 'locked-active';
          return (
            <li key={s.label} className="relative flex flex-col items-center pb-2 sm:pb-3" aria-current={showCaret ? 'step' : undefined}>
              {i > 0 && (
                <span aria-hidden className="absolute left-[calc(-50%+21px)] right-[calc(50%+21px)] top-[15px] h-0.5 overflow-hidden rounded-full bg-hairline">
                  <span
                    className={`block h-full w-full origin-left bg-emerald transition-transform duration-500 ease-out ${
                      filled(i - 1) ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </span>
              )}
              {showCaret && (
                <CaretDown size={13} weight="bold" aria-hidden className="absolute -top-4 animate-nudge text-emerald" />
              )}
              {/* Hover/focus/tap tooltip: names each step (esp. the locked 'Personalising')
                  without the static label, which is hidden on mobile. Below the circle so it
                  never collides with the fixed header above the sticky bar. */}
              <span className="group relative flex" tabIndex={0} aria-label={s.label}>
                <Circle state={s.state} index={i} />
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-1/2 top-[calc(100%+9px)] z-tooltip -translate-x-1/2 whitespace-nowrap rounded-md bg-graphite px-2.5 py-1 font-sans text-xs font-medium text-seashell opacity-0 shadow-raised-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  <span aria-hidden className="absolute bottom-full left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1 rotate-45 bg-graphite" />
                  {s.label}
                </span>
              </span>
              <span
                className={`mt-1.5 hidden px-0.5 text-center font-sans text-xs leading-tight sm:block ${
                  showCaret ? 'font-semibold text-ink' : filled(i) ? 'text-ink-muted' : s.state === 'error' ? 'font-semibold text-iron' : 'text-ink-faint'
                }`}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
      {mobileIdx >= 0 && (
        <p className={`pb-2.5 text-center font-sans text-xs font-semibold sm:hidden ${steps[mobileIdx].state === 'error' ? 'text-iron' : 'text-ink'}`}>
          {steps[mobileIdx].label}
        </p>
      )}
    </div>
  );
}
