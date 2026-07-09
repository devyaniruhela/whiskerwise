'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { PencilSimple, X } from '@phosphor-icons/react';
import { Button, Input, Select } from '@/components/ui';
import { ACTIVITY_LEVELS, BODY_CONDITIONS, CAT_AVATARS, HEALTH_CONDITIONS, NEUTERING_OPTIONS } from '@/constants/cat-data';
import type { CatProfile } from '@/types';

const NONE = 'No known health conditions';
const BC_RATING: Record<string, number> = { underweight: 1, ideal: 2, overweight: 3, obese: 4 };

export function avatarSrc(avatar?: string | null): string {
  return CAT_AVATARS.find((a) => a.id === avatar)?.image
    ?? CAT_AVATARS[Math.abs((avatar ?? '').length) % CAT_AVATARS.length].image;
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

export function CatForm({ initial, onSave, onClose }: {
  initial?: CatProfile;
  onSave: (cat: CatProfile) => Promise<void>;
  onClose: () => void;
}) {
  const randomAvatar = useMemo(() => CAT_AVATARS[Math.floor(Math.random() * CAT_AVATARS.length)].id, []);
  const [cat, setCat] = useState<CatProfile>(initial ?? {
    cat_name: '', cat_age_year: 0, cat_age_month: 0, health_condition: [],
    body_condition: null, avatar: randomAvatar,
  });
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const [otherDesc, setOtherDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<CatProfile>) => setCat((c) => ({ ...c, ...patch }));

  function toggleCondition(label: string) {
    setCat((c) => ({
      ...c,
      health_condition: c.health_condition.includes(label)
        ? c.health_condition.filter((x) => x !== label)
        : [...c.health_condition.filter((x) => (label === NONE ? false : x !== NONE)), label],
    }));
  }

  async function save() {
    if (!cat.cat_name.trim()) return setError('Give your cat a name.');
    if (!cat.body_condition) return setError('Pick the body condition that looks most like them.');
    if (!cat.cat_age_year && !cat.cat_age_month && !cat.cat_dob) return setError('Add an age — years, months, or a date of birth.');
    if (cat.health_condition.length === 0) return setError('Pick a health condition, or "No known health conditions."');
    setSaving(true);
    setError(null);
    try {
      const conditions = cat.health_condition
        .filter((c) => c !== NONE)
        .map((c) => (c.startsWith('Other') && otherDesc ? `Other: ${otherDesc}` : c));
      await onSave({ ...cat, health_condition: conditions });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save — try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-backdrop flex items-end justify-center bg-graphite/50 sm:items-center sm:p-6">
      <div className="z-modal max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-t-lg bg-seashell p-6 shadow-raised-lg sm:rounded-lg">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-2xl text-ink">{initial ? `${initial.cat_name}'s passport` : 'Add a cat'}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-ink-faint transition-colors hover:text-ink">
            <X size={20} />
          </button>
        </div>

        {/* avatar + name */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setPickingAvatar((p) => !p)}
            aria-label="Change display picture"
            className="group relative shrink-0"
          >
            <Image src={avatarSrc(cat.avatar)} alt="" width={72} height={72}
              className="h-[72px] w-[72px] rounded-full border border-hairline-strong object-cover" />
            <span className="absolute -bottom-1 -right-1 rounded-full border border-hairline bg-paper p-1.5 text-ink-muted shadow-raised transition-colors group-hover:text-emerald">
              <PencilSimple size={13} aria-hidden />
            </span>
          </button>
          <Input label="Name" className="flex-1" value={cat.cat_name}
            onChange={(e) => set({ cat_name: e.target.value })} placeholder="e.g. Toto" />
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
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Input label="Age — years" type="number" min={0} max={30} value={cat.cat_age_year || ''}
            onChange={(e) => set({ cat_age_year: +e.target.value || 0 })} />
          <Input label="+ months" type="number" min={0} max={11} value={cat.cat_age_month || ''}
            onChange={(e) => set({ cat_age_month: +e.target.value || 0 })} />
          <Input label="Date of birth" type="date" value={cat.cat_dob ?? ''}
            onChange={(e) => set({ cat_dob: e.target.value || null })} hint="if known" />
        </div>

        {/* body condition — big visual pickers */}
        <p className="mb-2 mt-5 font-sans text-sm font-semibold text-ink">Body condition</p>
        <div className="grid grid-cols-2 gap-3">
          {BODY_CONDITIONS.map((bc) => (
            <button
              key={bc.id}
              type="button"
              onClick={() => set({ body_condition: BC_RATING[bc.id] })}
              className={`rounded-md border p-3 text-left transition-colors duration-150
                ${cat.body_condition === BC_RATING[bc.id] ? 'border-emerald bg-sel' : 'border-hairline-strong bg-paper hover:bg-sel/40'}`}
            >
              <Image src={bc.image} alt={bc.label} width={220} height={140}
                className="mx-auto h-24 w-auto object-contain sm:h-28" />
              <span className="mt-2 block font-sans text-sm font-semibold text-ink">{bc.label}</span>
              <span className="mt-0.5 block whitespace-pre-line text-xs leading-snug text-ink-muted">{bc.desc}</span>
            </button>
          ))}
        </div>

        {/* health conditions */}
        <p className="mb-2 mt-5 font-sans text-sm font-semibold text-ink">Health conditions</p>
        <div className="flex flex-wrap gap-2">
          {HEALTH_CONDITIONS.map((label) => (
            <Pill key={label} selected={cat.health_condition.includes(label)} onClick={() => toggleCondition(label)}>
              {label}
            </Pill>
          ))}
        </div>
        {cat.health_condition.some((c) => c.startsWith('Other')) && (
          <Input className="mt-3" label="Tell us more" placeholder="Describe the condition"
            value={otherDesc} onChange={(e) => setOtherDesc(e.target.value)} />
        )}

        {/* passport extras */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input label="Weight (kg)" type="number" step="0.1" min={0} max={20} value={cat.weight_kg ?? ''}
            onChange={(e) => set({ weight_kg: e.target.value ? +e.target.value : null })} hint="exact, if you know it" />
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

        {error && <p className="mt-4 text-sm text-iron">{error}</p>}
        <div className="mt-6 flex gap-3">
          <Button onClick={save} loading={saving} className="flex-1">Save passport</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
