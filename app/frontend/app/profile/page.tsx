'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CaretDown, PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { Button, Input, VerdictBadge } from '@/components/ui';
import { CatForm, avatarSrc } from '@/components/wiser/CatForm';
import { BODY_CONDITIONS } from '@/constants/cat-data';
import { api } from '@/lib/api';
import { SHOW_WISER } from '@/lib/flags';
import type { CatProfile, HistoryItem, UserProfile } from '@/types';

const BC_LABEL: Record<number, string> = Object.fromEntries(
  BODY_CONDITIONS.map((b, i) => [i + 1, b.label]),
) as Record<number, string>;

const PASSPORT_FIELDS: [keyof CatProfile, string][] = [
  ['weight_kg', 'weight'], ['cat_dob', 'date of birth'], ['neuter_status', 'neutering'],
  ['environment', 'outdoors'], ['activity_level', 'activity'],
];

function missingFields(cat: CatProfile): string[] {
  return PASSPORT_FIELDS.filter(([k]) => cat[k] == null || cat[k] === '').map(([, label]) => label);
}

export default function ProfilePage() {
  const [me, setMe] = useState<UserProfile>({});
  const [meOpen, setMeOpen] = useState(false);
  const [meSaved, setMeSaved] = useState(false);
  const [savingMe, setSavingMe] = useState(false);
  const [cats, setCats] = useState<CatProfile[]>([]);
  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  const [editing, setEditing] = useState<CatProfile | 'new' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CatProfile | null>(null);

  useEffect(() => {
    api.me().then((m) => setMe(m ?? {})).catch(() => null);
    api.cats().then(setCats).catch(() => setCats([]));
    api.reports().then(setHistory).catch(() => setHistory([]));
  }, []);

  async function saveMe() {
    setSavingMe(true);
    try {
      await api.saveMe(me);
      setMeSaved(true);
      setTimeout(() => setMeSaved(false), 2500);
    } finally {
      setSavingMe(false);
    }
  }

  const setMeField = (k: keyof UserProfile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setMe((m) => ({ ...m, [k]: e.target.value || null }));

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-24">
      {/* ── your details (all optional) ─────────────────────────────── */}
      <section className="rounded-md border border-hairline bg-paper shadow-raised">
        <button
          type="button"
          onClick={() => setMeOpen((o) => !o)}
          aria-expanded={meOpen}
          className="flex w-full items-center justify-between p-4 text-left"
        >
          <div>
            <h1 className="font-serif text-2xl text-ink">Your details</h1>
            <p className="mt-0.5 text-sm text-ink-muted">All optional: we only use it to serve you better.</p>
          </div>
          <CaretDown size={18} className={`shrink-0 text-ink-faint transition-transform duration-200 ${meOpen ? 'rotate-180' : ''}`} aria-hidden />
        </button>
        {meOpen && (
          <div className="border-t border-hairline p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="First name" value={me.first_name ?? ''} onChange={setMeField('first_name')} />
              <Input label="Last name" value={me.last_name ?? ''} onChange={setMeField('last_name')} />
              <Input label="Phone number" type="tel" placeholder="+91…" value={me.phone_number ?? ''} onChange={setMeField('phone_number')} />
              <Input label="Email" type="email" value={me.email ?? ''} onChange={setMeField('email')} />
              <Input label="Location" placeholder="City" value={me.location ?? ''} onChange={setMeField('location')} className="sm:col-span-2" />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={saveMe} loading={savingMe}>Save details</Button>
              {meSaved && <span className="text-sm font-semibold text-emerald">Saved.</span>}
            </div>
          </div>
        )}
      </section>

      {/* ── cat passports ───────────────────────────────────────────── */}
      <h2 className="mt-10 font-serif text-2xl text-ink">Cat passports</h2>
      <div className="mt-4 space-y-4">
        {cats.length === 0 && (
          <div className="rounded-md border border-dashed border-hairline-strong p-8 text-center">
            <p className="text-base text-ink-muted">No cats yet.</p>
            <p className="mt-1 text-sm text-ink-faint">Add your first cat to personalise every verdict.</p>
          </div>
        )}
        {cats.map((cat) => {
          const missing = missingFields(cat);
          return (
            <article key={cat.id} className="rounded-md border border-hairline bg-paper p-4 shadow-raised">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Image src={avatarSrc(cat.avatar)} alt="" width={56} height={56}
                    className="h-14 w-14 rounded-full border border-hairline object-cover" />
                  <div>
                    <h3 className="font-serif text-xl text-ink">{cat.cat_name}</h3>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      {cat.cat_age_year ? `${cat.cat_age_year}y ` : ''}{cat.cat_age_month ? `${cat.cat_age_month}m` : ''}
                      {cat.body_condition ? ` · ${BC_LABEL[cat.body_condition]}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button aria-label={`Edit ${cat.cat_name}`} onClick={() => setEditing(cat)}
                    className="rounded-md p-2 text-ink-faint transition-colors hover:text-emerald">
                    <PencilSimple size={18} />
                  </button>
                  <button aria-label={`Remove ${cat.cat_name}`} onClick={() => setConfirmDelete(cat)}
                    className="rounded-md p-2 text-ink-faint transition-colors hover:text-iron">
                    <Trash size={18} />
                  </button>
                </div>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-hairline pt-3 text-sm sm:grid-cols-3">
                {cat.weight_kg != null && <div><dt className="text-ink-faint">Weight</dt><dd className="font-mono text-ink">{cat.weight_kg} kg</dd></div>}
                {cat.cat_dob && <div><dt className="text-ink-faint">Born</dt><dd className="font-mono text-ink">{cat.cat_dob}</dd></div>}
                {cat.neuter_status && <div><dt className="text-ink-faint">Neutering</dt><dd className="text-ink">{cat.neuter_status.replace('_', ' ')}</dd></div>}
                {cat.environment && <div><dt className="text-ink-faint">Outdoors</dt><dd className="text-ink">{cat.environment === 'indoor only' ? 'no' : 'yes'}</dd></div>}
                {cat.activity_level && <div><dt className="text-ink-faint">Activity</dt><dd className="text-ink">{cat.activity_level}</dd></div>}
              </dl>
              {cat.health_condition.length > 0 && (
                <p className="mt-2 text-sm text-ochre">{cat.health_condition.join(' · ')}</p>
              )}

              <div className="mt-3 flex items-center justify-between gap-3">
                {missing.length > 0 ? (
                  <button onClick={() => setEditing(cat)}
                    className="text-left text-sm text-ink-faint underline decoration-dotted underline-offset-4 hover:text-emerald">
                    Passport incomplete: add {missing.slice(0, 3).join(', ')}{missing.length > 3 ? '…' : ''}
                  </button>
                ) : (
                  <span className="text-sm font-semibold text-emerald">Passport complete</span>
                )}
                {SHOW_WISER && (
                  <Link href={`/food-input?preselectCat=${cat.id}`}
                    className="shrink-0 rounded-md bg-emerald px-3.5 py-2 font-sans text-sm font-semibold text-seashell transition-colors hover:bg-emerald-deep">
                    Scan food
                  </Link>
                )}
              </div>
            </article>
          );
        })}
        <Button variant="secondary" className="w-full border-dashed" onClick={() => setEditing('new')}>
          <Plus size={16} aria-hidden /> Add a cat
        </Button>
      </div>

      {/* ── scan history timeline (Wiser-only; hidden when SHOW_WISER off) ── */}
      {SHOW_WISER && (<>
      <h2 className="mt-10 font-serif text-2xl text-ink">Scan history</h2>
      {history === null ? (
        <div className="mt-4 space-y-3" aria-busy>
          {[0, 1].map((i) => <div key={i} className="h-16 animate-pulse rounded-md bg-hairline" />)}
        </div>
      ) : history.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-hairline-strong p-8 text-center">
          <p className="text-base text-ink-muted">No scans yet.</p>
          <p className="mt-1 text-sm text-ink-faint">Every verdict you get will line up here as a timeline.</p>
          <Link href="/food-input" className="mt-4 inline-block font-sans text-sm font-semibold text-emerald underline underline-offset-4 hover:text-emerald-bright">
            Scan your first pack →
          </Link>
        </div>
      ) : (
        <ol className="ml-2 mt-5 border-l-2 border-hairline-strong pl-5">
          {history.map((h) => (
            <li key={h.analysis_id} className="relative pb-6 last:pb-0">
              <span className="absolute -left-[27px] top-2 h-3 w-3 rounded-full border-2 border-seashell bg-emerald" aria-hidden />
              <Link href={`/report/${h.analysis_id}`}
                className="block rounded-md border border-hairline bg-paper p-3 shadow-raised transition-transform duration-150 ease-out hover:-translate-y-0.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate font-sans text-sm font-semibold text-ink">
                    {[h.brand, h.variant].filter(Boolean).join(' · ') || 'Scanned pack'}
                  </p>
                  <VerdictBadge verdict={h.verdict} />
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-ink-muted">{h.headline}</p>
                <p className="mt-1 font-mono text-xs text-ink-faint">
                  {new Date(h.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      )}
      </>)}

      {editing && (
        <CatForm
          initial={editing === 'new' ? undefined : editing}
          saveLabel="Save passport"
          showAddAnother={editing === 'new'}
          onClose={() => setEditing(null)}
          onSave={async (cat) => {
            const saved = await api.saveCat(cat);
            setCats((cs) => {
              const rest = cs.filter((c) => c.id !== saved.id);
              return [...rest, saved].sort((a, b) => a.cat_name.localeCompare(b.cat_name));
            });
          }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-backdrop flex items-center justify-center bg-graphite/50 p-6">
          <div className="z-modal w-full max-w-sm rounded-lg bg-seashell p-6 shadow-raised-lg">
            <p className="text-base text-ink">Remove {confirmDelete.cat_name}&apos;s passport?</p>
            <div className="mt-5 flex gap-3">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={async () => {
                  await api.deleteCat(confirmDelete.id!);
                  setCats((cs) => cs.filter((c) => c.id !== confirmDelete.id));
                  setConfirmDelete(null);
                }}
              >
                Remove
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(null)}>Keep</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
