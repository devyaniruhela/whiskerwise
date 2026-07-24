'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CaretDown, PencilSimple, Plus, ShieldCheck, Trash } from '@phosphor-icons/react';
import { Button, Input, Select, VerdictBadge } from '@/components/ui';
import { CatForm, avatarSrc } from '@/components/wiser/CatForm';
import { LocationInput } from '@/components/wiser/LocationInput';
import { BODY_CONDITIONS } from '@/constants/cat-data';
import { api } from '@/lib/api';
import { SHOW_WISER } from '@/lib/flags';
import type { CatProfile, HistoryItem, UserProfile } from '@/types';

const BC_LABEL: Record<number, string> = Object.fromEntries(
  BODY_CONDITIONS.map((b, i) => [i + 1, b.label]),
) as Record<number, string>;

// ── passport display rules (profile brief 24 Jul) ──────────────────────
const IDEAL_BC = 2; // "Just Right"
const bodyConditionText = (bc: number) => (bc === IDEAL_BC ? 'Weighs just right' : BC_LABEL[bc]);
const ENV_LABEL: Record<string, string> = { 'indoor-outdoor': 'Indoor/Outdoor', 'indoor only': 'Indoor only' };
const ACTIVITY_LABEL: Record<string, string> = { very: 'High', moderately: 'Moderate', lightly: 'Low' };
const NONE_CONDITION = 'No known health conditions';

// Optional passport extras, in form order — the "completable" fields. Name, age,
// body condition and health are already required by the form, so they're never missing.
const PASSPORT_FIELDS: [keyof CatProfile, string][] = [
  ['weight_kg', 'weight'], ['neuter_status', 'neutering'],
  ['environment', 'outdoors'], ['activity_level', 'activity'],
];

function missingFieldKeys(cat: CatProfile): (keyof CatProfile)[] {
  return PASSPORT_FIELDS.filter(([k]) => cat[k] == null || cat[k] === '').map(([k]) => k);
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 81 }, (_, i) => String(CURRENT_YEAR - i)).map(
  (y) => ({ value: y, label: y }),
);

type MeErrors = Partial<Record<'first_name' | 'num_cats' | 'cat_parent_since', string>>;

export default function ProfilePage() {
  const [me, setMe] = useState<UserProfile>({});
  const [meOpen, setMeOpen] = useState(false);
  const [meSaved, setMeSaved] = useState(false);
  const [savingMe, setSavingMe] = useState(false);
  const [meErrors, setMeErrors] = useState<MeErrors>({});
  const [cats, setCats] = useState<CatProfile[]>([]);
  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  const [editing, setEditing] = useState<CatProfile | 'new' | null>(null);
  const [focusField, setFocusField] = useState<string | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<CatProfile | null>(null);

  useEffect(() => {
    api.me().then((m) => setMe(m ?? {})).catch(() => null);
    api.cats().then(setCats).catch(() => setCats([]));
    api.reports().then(setHistory).catch(() => setHistory([]));
  }, []);

  function validateMe(): MeErrors {
    const e: MeErrors = {};
    if (!me.first_name?.trim()) e.first_name = 'Add your first name.';
    if (me.num_cats == null || me.num_cats < 1) e.num_cats = 'How many cats do you have? (1 or more)';
    if (me.cat_parent_since == null) e.cat_parent_since = 'Pick the year you became a cat parent.';
    return e;
  }

  async function saveMe() {
    const e = validateMe();
    setMeErrors(e);
    if (Object.values(e).some(Boolean)) { setMeOpen(true); return; }
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

  function editCat(cat: CatProfile, field?: keyof CatProfile) {
    setFocusField(field as string | undefined);
    setEditing(cat);
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-24">
      {me.first_name && (
        <p className="mb-3 font-serif text-2xl text-ink">Hi {me.first_name}!</p>
      )}

      {/* ── your details ───────────────────────────────────────────────── */}
      <section className="rounded-md border border-hairline bg-paper shadow-raised">
        <button
          type="button"
          onClick={() => setMeOpen((o) => !o)}
          aria-expanded={meOpen}
          className="flex w-full items-center justify-between p-4 text-left"
        >
          <div>
            <h1 className="font-serif text-2xl text-ink">Your details</h1>
            <p className="mt-0.5 text-sm text-ink-muted">Let&apos;s get to know you, shall we?</p>
          </div>
          <CaretDown size={18} className={`shrink-0 text-ink-faint transition-transform duration-200 ${meOpen ? 'rotate-180' : ''}`} aria-hidden />
        </button>
        {meOpen && (
          <div className="border-t border-hairline p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="First name" value={me.first_name ?? ''} error={meErrors.first_name}
                onChange={(e) => { setMe((m) => ({ ...m, first_name: e.target.value || null })); setMeErrors((x) => ({ ...x, first_name: undefined })); }} />
              <Input label="Last name" value={me.last_name ?? ''} onChange={setMeField('last_name')} />
              <Input label="Number of cats" type="number" min={1} step={1} value={me.num_cats ?? ''} error={meErrors.num_cats}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  setMe((m) => ({ ...m, num_cats: Number.isFinite(n) ? n : null }));
                  setMeErrors((x) => ({ ...x, num_cats: undefined }));
                }} />
              <Select label="Cat parent since" placeholder="Year" value={me.cat_parent_since != null ? String(me.cat_parent_since) : null}
                options={YEAR_OPTIONS}
                onChange={(v) => { setMe((m) => ({ ...m, cat_parent_since: +v })); setMeErrors((x) => ({ ...x, cat_parent_since: undefined })); }} />
              {meErrors.cat_parent_since && <p className="-mt-2 text-sm text-iron sm:col-start-2">{meErrors.cat_parent_since}</p>}
              <Input label="Phone number" type="tel" placeholder="+91…" value={me.phone_number ?? ''} onChange={setMeField('phone_number')} />
              <Input label="Email" type="email" value={me.email ?? ''} onChange={setMeField('email')} />
              <LocationInput className="sm:col-span-2" value={me.location ?? ''}
                onChange={(v) => setMe((m) => ({ ...m, location: v || null }))} />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={saveMe} loading={savingMe}>Save details</Button>
              {meSaved && <span className="text-sm font-semibold text-emerald">Saved.</span>}
            </div>
          </div>
        )}
      </section>

      {/* ── cat passports ───────────────────────────────────────────────── */}
      <h2 className="mt-10 font-serif text-2xl text-ink">Cat passports</h2>
      <div className="mt-4 space-y-4">
        {cats.length === 0 && (
          <div className="rounded-md border border-dashed border-hairline-strong p-8 text-center">
            <p className="text-base text-ink-muted">We are missing your cat(s)</p>
            <p className="mt-1 text-sm text-ink-faint">Add your cats to get personalised insights</p>
          </div>
        )}
        {cats.map((cat) => {
          const missing = missingFieldKeys(cat);
          const onlyNone = cat.health_condition.length === 1 && cat.health_condition[0] === NONE_CONDITION;
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
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button aria-label={`Edit ${cat.cat_name}`} onClick={() => editCat(cat)}
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
                {cat.weight_kg != null && <div><dt className="text-ink-faint">Weight</dt><dd className="font-mono text-ink">{cat.weight_kg.toFixed(1)} kg</dd></div>}
                {cat.cat_dob && <div><dt className="text-ink-faint">Born</dt><dd className="font-mono text-ink">{cat.cat_dob}</dd></div>}
                {cat.body_condition != null && <div><dt className="text-ink-faint">Body</dt><dd className="text-ink">{bodyConditionText(cat.body_condition)}</dd></div>}
                {cat.neuter_status && <div><dt className="text-ink-faint">Neutering</dt><dd className="text-ink">{cat.neuter_status.replace('_', ' ')}</dd></div>}
                {cat.environment && <div><dt className="text-ink-faint">Environment</dt><dd className="text-ink">{ENV_LABEL[cat.environment] ?? cat.environment}</dd></div>}
                {cat.activity_level && <div><dt className="text-ink-faint">Activity</dt><dd className="text-ink">{ACTIVITY_LABEL[cat.activity_level] ?? cat.activity_level}</dd></div>}
              </dl>
              {cat.health_condition.length > 0 && (
                <div className="mt-3 border-t border-hairline pt-3">
                  <p className="text-sm text-ink-faint">Health conditions</p>
                  <p className={`mt-0.5 text-sm ${onlyNone ? 'text-ink-muted' : 'text-ochre'}`}>{cat.health_condition.join(' · ')}</p>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between gap-3">
                {missing.length > 0 ? (
                  <button onClick={() => editCat(cat, missing[0])}
                    className="text-left text-sm font-semibold text-iron underline underline-offset-4 hover:text-iron-deep">
                    Add missing details
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald">
                    <ShieldCheck size={18} weight="fill" aria-hidden /> Passport complete
                  </span>
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
        <Button variant="secondary" className="w-full border-dashed" onClick={() => { setFocusField(undefined); setEditing('new'); }}>
          <Plus size={16} aria-hidden /> Add your cat
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
          <p className="text-base text-ink-muted">No cat food scanned yet.</p>
          <p className="mt-1 text-sm text-ink-faint">Verdict for every food scanned by you, for your cat lives here.</p>
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
          focusField={focusField}
          onClose={() => { setEditing(null); setFocusField(undefined); }}
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
