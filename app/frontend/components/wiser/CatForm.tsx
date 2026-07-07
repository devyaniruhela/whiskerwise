'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { BODY_CONDITIONS, HEALTH_CONDITIONS } from '@/constants/cat-data';
import type { CatProfile } from '@/types';

const NONE = 'No known health conditions';
const BC_RATING: Record<string, number> = { underweight: 1, ideal: 2, overweight: 3, obese: 4 };

export function CatForm({ initial, onSave, onClose }: {
  initial?: CatProfile;
  onSave: (cat: CatProfile) => Promise<void>;
  onClose: () => void;
}) {
  const [cat, setCat] = useState<CatProfile>(initial ?? {
    cat_name: '', cat_age_year: 0, cat_age_month: 0, health_condition: [], body_condition: null,
  });
  const [otherDesc, setOtherDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCondition(label: string) {
    setCat((c) => {
      let list = c.health_condition.includes(label)
        ? c.health_condition.filter((x) => x !== label)
        : [...c.health_condition.filter((x) => (label === NONE ? false : x !== NONE)), label];
      return { ...c, health_condition: list };
    });
  }

  async function save() {
    if (!cat.cat_name.trim()) return setError('Give your cat a name.');
    if (!cat.body_condition) return setError('Pick a body condition.');
    if (!cat.cat_age_year && !cat.cat_age_month) return setError('Add an age (years or months).');
    if (cat.health_condition.length === 0) return setError('Pick a health condition (or "No known").');
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-soft-xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl">{initial ? `Edit ${initial.cat_name}` : 'Add a cat'}</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
        <Input value={cat.cat_name} onChange={(e) => setCat({ ...cat, cat_name: e.target.value })} placeholder="e.g. Toto" />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Age — years</label>
            <Input type="number" min={0} max={30} value={cat.cat_age_year || ''} onChange={(e) => setCat({ ...cat, cat_age_year: +e.target.value || 0 })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">+ months</label>
            <Input type="number" min={0} max={11} value={cat.cat_age_month || ''} onChange={(e) => setCat({ ...cat, cat_age_month: +e.target.value || 0 })} />
          </div>
        </div>

        <label className="mb-2 mt-4 block text-sm font-medium text-gray-700">Body condition</label>
        <div className="grid grid-cols-2 gap-2">
          {BODY_CONDITIONS.map((bc) => (
            <button
              key={bc.id}
              type="button"
              onClick={() => setCat({ ...cat, body_condition: BC_RATING[bc.id] })}
              className={`rounded-xl border p-2 text-left text-xs transition ${cat.body_condition === BC_RATING[bc.id] ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-200'}`}
            >
              <Image src={bc.image} alt={bc.label} width={72} height={48} className="mx-auto mb-1 h-12 w-auto object-contain" />
              <span className="block font-medium text-gray-800">{bc.label}</span>
              <span className="whitespace-pre-line text-[10px] leading-tight text-gray-400">{bc.desc}</span>
            </button>
          ))}
        </div>

        <label className="mb-2 mt-4 block text-sm font-medium text-gray-700">Health conditions</label>
        <div className="flex flex-wrap gap-1.5">
          {HEALTH_CONDITIONS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => toggleCondition(label)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${cat.health_condition.includes(label) ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-gray-200 text-gray-600 hover:border-primary-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {cat.health_condition.some((c) => c.startsWith('Other')) && (
          <Input className="mt-2" placeholder="Describe the condition" value={otherDesc} onChange={(e) => setOtherDesc(e.target.value)} />
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex gap-2">
          <Button onClick={save} disabled={saving} className="flex-1">{saving ? 'Saving…' : 'Save cat'}</Button>
          <Button variant="bordered" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
