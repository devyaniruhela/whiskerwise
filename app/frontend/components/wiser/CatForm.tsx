'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { PencilSimple, Plus, X } from '@phosphor-icons/react';
import { Button, Input, Select } from '@/components/ui';
import { ACTIVITY_LEVELS, BODY_CONDITIONS, CAT_AVATARS, HEALTH_CONDITIONS, NEUTERING_OPTIONS } from '@/constants/cat-data';
import type { CatProfile } from '@/types';

const NONE = 'No known health conditions';
const BC_RATING: Record<string, number> = { underweight: 1, ideal: 2, overweight: 3, obese: 4 };
const MAX_WEIGHT_KG = 15;

export function avatarSrc(avatar?: string | null): string {
  return CAT_AVATARS.find((a) => a.id === avatar)?.image
    ?? CAT_AVATARS[Math.abs((avatar ?? '').length) % CAT_AVATARS.length].image;
}

function Req() {
  return <span className="text-iron" aria-hidden> *</span>;
}

function Pill({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[38px] rounded-md border px-3.5 py-1.5 font-sans text-sm transition-colors duration-150
        ${selected ? 'border-emerald bg-sel font-semibold text-emerald' : 'border-hairline-strong text-ink-muted hover:bg-sel/50'}`}
    >
      {children}
    </button>
  );
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function ageFromDob(dob: string): { years: number; months: number } {
  const d = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  let months = now.getMonth() - d.getMonth();
  if (now.getDate() < d.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  return { years: Math.max(0, years), months: Math.max(0, months) };
}

type Errors = Partial<Record<'name' | 'age' | 'months' | 'dob' | 'body' | 'health' | 'other' | 'weight', string>>;

export function CatForm({ initial, saveLabel = 'Save', showAddAnother = false, onSave, onClose }: {
  initial?: CatProfile;
  saveLabel?: string;
  showAddAnother?: boolean;
  onSave: (cat: CatProfile) => Promise<void>;
  onClose: () => void;
}) {
  const freshAvatar = () => CAT_AVATARS[Math.floor(Math.random() * CAT_AVATARS.length)].id;
  const blank = (): CatProfile => ({
    cat_name: '', cat_age_year: 0, cat_age_month: 0, health_condition: [],
    body_condition: null, avatar: freshAvatar(),
  });
  const [cat, setCat] = useState<CatProfile>(initial ?? blank);
  const [otherDesc, setOtherDesc] = useState(
    initial?.health_condition.find((c) => c.startsWith('Other'))?.replace(/^Other:\s*/, '') ?? '',
  );
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const maxDob = useMemo(todayISO, []);

  const set = (patch: Partial<CatProfile>) => setCat((c) => ({ ...c, ...patch }));
  const clearErr = (k: keyof Errors) => setErrors((e) => ({ ...e, [k]: undefined }));

  function onDob(value: string) {
    if (value && value > maxDob) {
      setErrors((e) => ({ ...e, dob: "Date of birth can't be in the future." }));
      set({ cat_dob: value });
      return;
    }
    clearErr('dob');
    if (value) {
      const { years, months } = ageFromDob(value);
      set({ cat_dob: value, cat_age_year: years, cat_age_month: months });
      setErrors((e) => ({ ...e, age: undefined, months: undefined }));
    } else {
      set({ cat_dob: null });
    }
  }

  function toggleCondition(label: string) {
    clearErr('health');
    setCat((c) => ({
      ...c,
      health_condition: c.health_condition.includes(label)
        ? c.health_condition.filter((x) => x !== label)
        : [...c.health_condition.filter((x) => (label === NONE ? false : x !== NONE)), label],
    }));
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!cat.cat_name.trim()) e.name = 'Give your cat a name.';
    const months = cat.cat_age_month || 0;
    const years = cat.cat_age_year || 0;
    if (!years && !months && !cat.cat_dob) e.age = 'Add an age: years, months, or a date of birth.';
    if (months > 12) e.months = 'Months go from 1 to 12. For older cats, use years.';
    if (months < 0) e.months = 'Months go from 1 to 12.';
    if (!cat.body_condition) e.body = 'Pick the body condition that fits best.';
    if (cat.health_condition.length === 0) e.health = "Choose one, or 'No known health conditions.'";
    if (cat.health_condition.some((c) => c.startsWith('Other')) && !otherDesc.trim())
      e.other = 'Tell us a little about the condition.';
    if (cat.weight_kg != null && cat.weight_kg > MAX_WEIGHT_KG)
      e.weight = 'That seems high for a cat. Enter kilograms, e.g. 400 g is 0.4 kg.';
    if (cat.cat_dob && cat.cat_dob > maxDob) e.dob = "Date of birth can't be in the future.";
    return e;
  }

  async function persist(): Promise<boolean> {
    const e = validate();
    setErrors(e);
    if (Object.values(e).some(Boolean)) return false;
    setBusy(true);
    try {
      const conditions = cat.health_condition
        .filter((c) => c !== NONE)
        .map((c) => (c.startsWith('Other') && otherDesc ? `Other: ${otherDesc}` : c));
      await onSave({ ...cat, health_condition: conditions });
      return true;
    } catch (err) {
      setErrors((prev) => ({ ...prev, name: err instanceof Error ? err.message : 'Could not save, try again.' }));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function save() { if (await persist()) onClose(); }
  async function saveAndAddAnother() {
    if (await persist()) { setCat(blank()); setOtherDesc(''); setErrors({}); setPickingAvatar(false); }
  }

  const showOther = cat.health_condition.some((c) => c.startsWith('Other'));

  return (
    <div className="fixed inset-0 z-backdrop flex items-end justify-center bg-graphite/50 sm:items-center sm:p-6">
      <div className="z-modal max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-t-lg bg-seashell p-6 shadow-raised-lg sm:rounded-lg">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-2xl text-ink">{initial ? `${initial.cat_name}'s passport` : 'Add your cat'}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-ink-faint transition-colors hover:text-ink">
            <X size={20} />
          </button>
        </div>

        {/* avatar + name */}
        <div className="flex items-start gap-4">
          <button type="button" onClick={() => setPickingAvatar((p) => !p)} aria-label="Change display picture" className="group relative mt-6 shrink-0">
            <Image src={avatarSrc(cat.avatar)} alt="" width={72} height={72}
              className="h-[72px] w-[72px] rounded-full border border-hairline-strong object-cover" />
            <span className="absolute -bottom-1 -right-1 rounded-full border border-hairline bg-paper p-1.5 text-ink-muted shadow-raised transition-colors group-hover:text-emerald">
              <PencilSimple size={13} aria-hidden />
            </span>
          </button>
          <Input label={<>Name<Req /></>} className="flex-1" value={cat.cat_name} error={errors.name}
            onChange={(e) => { set({ cat_name: e.target.value }); clearErr('name'); }} placeholder="e.g. Toto" />
        </div>
        {pickingAvatar && (
          <div className="mt-3 grid grid-cols-5 gap-2 rounded-md border border-hairline bg-paper p-3">
            {CAT_AVATARS.map((a) => (
              <button key={a.id} type="button" aria-label={`Avatar ${a.id}`}
                onClick={() => { set({ avatar: a.id }); setPickingAvatar(false); }}
                className={`rounded-full p-0.5 transition-transform hover:scale-105 ${cat.avatar === a.id ? 'ring-2 ring-emerald' : ''}`}>
                <Image src={a.image} alt="" width={52} height={52} className="h-12 w-12 rounded-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* age */}
        <p className="mb-1.5 mt-5 font-sans text-sm font-semibold text-ink">Age<Req /></p>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Age: years" type="number" min={0} max={30} value={cat.cat_age_year || ''}
            onChange={(e) => { set({ cat_age_year: +e.target.value || 0 }); clearErr('age'); }} />
          <Input label="+ months" type="number" min={0} max={12} value={cat.cat_age_month || ''} error={errors.months}
            onChange={(e) => { set({ cat_age_month: +e.target.value || 0 }); clearErr('age'); clearErr('months'); }} />
          <Input label="Date of birth" type="date" max={maxDob} value={cat.cat_dob ?? ''} error={errors.dob}
            onChange={(e) => onDob(e.target.value)} hint="auto-fills age" />
        </div>
        {errors.age && <p className="mt-1 text-sm text-iron">{errors.age}</p>}

        {/* body condition: image left, text right */}
        <p className="mb-2 mt-5 font-sans text-sm font-semibold text-ink">Body condition<Req /></p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {BODY_CONDITIONS.map((bc) => (
            <button
              key={bc.id}
              type="button"
              onClick={() => { set({ body_condition: BC_RATING[bc.id] }); clearErr('body'); }}
              className={`flex items-center gap-3 rounded-md border p-2 text-left transition-colors duration-150
                ${cat.body_condition === BC_RATING[bc.id] ? 'border-emerald bg-sel' : 'border-hairline-strong bg-paper hover:bg-sel/40'}`}
            >
              <Image src={bc.image} alt={bc.label} width={200} height={150}
                className="h-24 w-1/2 shrink-0 rounded object-contain" />
              <span className="min-w-0 flex-1">
                <span className="block font-sans text-sm font-semibold text-ink">{bc.label}</span>
                <span className="mt-0.5 block whitespace-pre-line text-xs leading-snug text-ink-muted">{bc.desc}</span>
              </span>
            </button>
          ))}
        </div>
        {errors.body && <p className="mt-1 text-sm text-iron">{errors.body}</p>}

        {/* health conditions */}
        <p className="mb-2 mt-5 font-sans text-sm font-semibold text-ink">Health conditions<Req /></p>
        <div className="flex flex-wrap gap-2">
          {HEALTH_CONDITIONS.map((label) => (
            <Pill key={label} selected={cat.health_condition.includes(label)} onClick={() => toggleCondition(label)}>
              {label}
            </Pill>
          ))}
        </div>
        {errors.health && <p className="mt-1 text-sm text-iron">{errors.health}</p>}
        {showOther && (
          <Input className="mt-3" label={<>Tell us more<Req /></>} placeholder="Describe the condition" error={errors.other}
            value={otherDesc} onChange={(e) => { setOtherDesc(e.target.value); clearErr('other'); }} />
        )}

        {/* passport extras (optional) */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input label="Weight (kg)" type="number" step="0.1" min={0} value={cat.weight_kg ?? ''} error={errors.weight}
            hint="exact, if you know it" placeholder="e.g. 4.5"
            onChange={(e) => { set({ weight_kg: e.target.value ? +e.target.value : null }); clearErr('weight'); }} />
          <Select label="Neutering status" value={cat.neuter_status}
            options={NEUTERING_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            onChange={(v) => set({ neuter_status: v })} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 font-sans text-sm font-semibold text-ink">Goes outdoors?</p>
            <div className="flex gap-2">
              <Pill selected={cat.environment === 'indoor-outdoor'} onClick={() => set({ environment: 'indoor-outdoor' })}>Yes</Pill>
              <Pill selected={cat.environment === 'indoor only'} onClick={() => set({ environment: 'indoor only' })}>No</Pill>
            </div>
          </div>
          <Select label="Activity level" value={cat.activity_level}
            options={ACTIVITY_LEVELS.map((o) => ({ value: o.value, label: o.label }))}
            onChange={(v) => set({ activity_level: v })} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={save} loading={busy} className="flex-1">{saveLabel}</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
        {showAddAnother && (
          <button type="button" onClick={saveAndAddAnother} disabled={busy}
            className="mt-3 inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-emerald underline underline-offset-4 transition-colors hover:text-emerald-bright disabled:opacity-50">
            <Plus size={15} aria-hidden /> Add another cat
          </button>
        )}
      </div>
    </div>
  );
}
