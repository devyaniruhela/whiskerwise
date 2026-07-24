'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { MEDIA_FIT } from './media';

const STAMP = '/whisker-wise-logo-stamp-bw.png';
/** fraction of the track width a drag must cover to commit to the next slide */
const COMMIT = 0.2;

type Slide = { src: string; kind: 'product' | 'stamp' };

/** Product gallery: infinite swipe (last wraps back to the first) with the
 *  Whisker Wise stamp always closing the loop, so every product ends on
 *  "curated with care" (D, 18 Jul 2026).
 *
 *  A transform track rather than scroll-snap: true looping scroll-snap needs
 *  cloned slides plus a scroll-position reset that janks badly on iOS, whereas
 *  index arithmetic gives wraparound for free. The thumbnail strip stays the
 *  primary accessible control; dragging is enhancement layered on top. */
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const slides: Slide[] = [
    ...images.map((src) => ({ src, kind: 'product' as const })),
    { src: STAMP, kind: 'stamp' as const },
  ];
  const n = slides.length;

  const [active, setActive] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);

  const go = useCallback((next: number) => setActive(((next % n) + n) % n), [n]);

  // a variant switch remounts this via key, but guard anyway if the set shrinks
  useEffect(() => {
    if (active > n - 1) setActive(0);
  }, [active, n]);

  function onPointerDown(e: React.PointerEvent) {
    if (n < 2) return;
    startX.current = e.clientX;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (startX.current === null) return;
    setDrag(e.clientX - startX.current);
  }

  function onPointerUp() {
    if (startX.current === null) return;
    const width = trackRef.current?.clientWidth ?? 1;
    if (Math.abs(drag) > width * COMMIT) go(active + (drag < 0 ? 1 : -1));
    startX.current = null;
    setDragging(false);
    setDrag(0);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); }
  }

  const label = (i: number) =>
    slides[i].kind === 'stamp' ? 'Whisker Wise mark' : `${alt}, image ${i + 1}`;

  return (
    <div>
      <div
        ref={trackRef}
        role="group"
        aria-roledescription="carousel"
        aria-label={alt}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="relative aspect-square touch-pan-y select-none overflow-hidden rounded-lg border border-hairline bg-paper shadow-raised"
      >
        {slides.map((s, i) => {
          const offset = i - active;
          const pct = offset * 100 + (drag / (trackRef.current?.clientWidth || 1)) * 100;
          return (
            <div
              key={`${s.src}-${i}`}
              className="absolute inset-0 transition-transform duration-200 ease-out"
              style={{
                transform: `translateX(${pct}%)`,
                // keep the neighbours mounted so a drag reveals them, hide the rest
                visibility: Math.abs(offset) <= 1 ? 'visible' : 'hidden',
                ...(dragging ? { transitionDuration: '0ms' } : null),
              }}
              aria-hidden={i !== active}
            >
              {s.kind === 'stamp' ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-6">
                  {/* stamp +50% (D, 24 Jul); the closing line keeps its size */}
                  <Image src={STAMP} alt="" width={270} height={234} className="h-auto max-w-full opacity-70" aria-hidden />
                  <p className="text-center font-hand text-xl text-ink-muted">
                    Curated with care by Whisker Wise
                  </p>
                </div>
              ) : failed[i] ? (
                <div className="flex h-full items-center justify-center">
                  <Image src={STAMP} alt="" width={96} height={83} className="opacity-25" aria-hidden />
                </div>
              ) : (
                <Image
                  src={s.src}
                  alt={i === active ? label(i) : ''}
                  fill
                  sizes="(min-width: 768px) 45vw, 90vw"
                  priority={i === 0}
                  // whole product, never cropped: see media.ts
                  className={`${MEDIA_FIT} p-4`}
                  onError={() => setFailed((f) => ({ ...f, [i]: true }))}
                  draggable={false}
                />
              )}
            </div>
          );
        })}

        {n > 1 && (
          <>
            <ArrowButton side="left" onClick={() => go(active - 1)} />
            <ArrowButton side="right" onClick={() => go(active + 1)} />
          </>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        Image {active + 1} of {n}
      </p>

      {n > 1 && (
        <div className="scrollbar-thin mt-3 flex gap-2.5 overflow-x-auto pb-1" role="listbox" aria-label="Product images">
          {slides.map((s, i) => (
            <button
              key={`${s.src}-thumb-${i}`}
              type="button"
              role="option"
              aria-selected={i === active}
              aria-label={label(i)}
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border transition-colors ${
                i === active ? 'border-iron' : 'border-hairline hover:border-hairline-strong'
              }`}
            >
              <Image
                src={s.src}
                alt=""
                fill
                sizes="64px"
                className={s.kind === 'stamp' ? 'object-contain p-2 opacity-40' : `${MEDIA_FIT} p-1`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ArrowButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? CaretLeft : CaretRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous image' : 'Next image'}
      // no resting plate (D): the glyph alone sits over the photo, but hover,
      // focus and press all still light it up the way a plated button would
      className={`absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint opacity-60 transition-all duration-150 hover:bg-paper/80 hover:text-ink hover:opacity-100 focus-visible:bg-paper/80 focus-visible:text-ink focus-visible:opacity-100 active:scale-95 active:bg-paper active:text-ink active:opacity-100 ${
        side === 'left' ? 'left-1' : 'right-1'
      }`}
    >
      <Icon size={16} aria-hidden />
    </button>
  );
}
