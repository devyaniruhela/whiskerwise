'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { MapPin } from '@phosphor-icons/react';

/** Location field with real-place suggestions from OpenStreetMap's Nominatim
 *  geocoder (free, no key). Debounced; suggestions are normalised to a single
 *  "City, State, Country" string — the only shape we store. Nothing is saved
 *  until the user picks a suggestion or leaves their typed text as-is. */

type Suggestion = { label: string; key: string };

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

type NominatimAddress = {
  city?: string; town?: string; village?: string; municipality?: string;
  state?: string; state_district?: string; country?: string;
};

function toCityStateCountry(a: NominatimAddress): string | null {
  const city = a.city || a.town || a.village || a.municipality;
  const state = a.state || a.state_district;
  const parts = [city, state, a.country].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

export function LocationInput({
  value,
  onChange,
  className = '',
  label = 'Location',
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  label?: string;
}) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  // when a suggestion is picked we don't want the value-sync effect to reopen
  const justPicked = useRef(false);

  // keep the visible text in sync if the parent value changes (e.g. loaded from BE)
  useEffect(() => { setQuery(value); }, [value]);

  // debounced Nominatim lookup
  useEffect(() => {
    if (justPicked.current) { justPicked.current = false; return; }
    const q = query.trim();
    if (q.length < 3) { setSuggestions([]); setLoading(false); return; }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5`;
        const res = await fetch(url, { signal: ctrl.signal, headers: { 'Accept-Language': 'en' } });
        const rows: { address?: NominatimAddress }[] = await res.json();
        const seen = new Set<string>();
        const out: Suggestion[] = [];
        for (const r of rows) {
          const label = r.address ? toCityStateCountry(r.address) : null;
          if (label && !seen.has(label)) { seen.add(label); out.push({ label, key: label }); }
        }
        setSuggestions(out);
        setOpen(out.length > 0);
      } catch {
        /* aborted or offline: leave suggestions as-is */
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  function pick(s: Suggestion) {
    justPicked.current = true;
    setQuery(s.label);
    onChange(s.label);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div className={className} ref={rootRef}>
      <label htmlFor={inputId} className="mb-1.5 block font-sans text-sm font-semibold text-ink">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
          <MapPin size={18} aria-hidden />
        </span>
        <input
          id={inputId}
          autoComplete="off"
          placeholder="Start typing a city…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); }}
          onFocus={() => suggestions.length && setOpen(true)}
          className="w-full rounded-md border border-hairline-strong bg-paper py-2.5 pl-10 pr-3.5 font-sans text-base text-ink placeholder:text-ink-faint transition-colors duration-150 hover:border-graphite/50"
        />
        {open && suggestions.length > 0 && (
          <ul
            role="listbox"
            className="absolute left-0 right-0 top-full z-dropdown mt-1 max-h-64 overflow-y-auto rounded-md border border-hairline bg-paper py-1 shadow-raised-lg"
          >
            {suggestions.map((s) => (
              <li key={s.key} role="option" aria-selected={s.label === value}>
                <button type="button" onClick={() => pick(s)}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left font-sans text-sm text-ink transition-colors hover:bg-sel">
                  <MapPin size={15} className="shrink-0 text-ink-faint" aria-hidden />
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-1 text-sm text-ink-faint">
        {loading ? 'Searching…' : 'Pick a suggestion to save it as city, state, country.'}
      </p>
    </div>
  );
}
