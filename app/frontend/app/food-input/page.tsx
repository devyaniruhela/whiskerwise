'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { UploadZone } from '@/components/wiser/UploadZone';
import { CatForm } from '@/components/wiser/CatForm';
import { api } from '@/lib/api';
import type { CatProfile } from '@/types';
import type { CloudinaryUploadResult } from '@/lib/cloudinaryUpload';

export default function FoodInput() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [personalise, setPersonalise] = useState(false);
  const [cats, setCats] = useState<CatProfile[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [showCatForm, setShowCatForm] = useState(false);
  const [front, setFront] = useState<CloudinaryUploadResult | null>(null);
  const [back, setBack] = useState<CloudinaryUploadResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(localStorage.getItem('wiser_name') ?? '');
    api.cats().then(setCats).catch(() => setCats([]));
  }, []);

  async function submit() {
    if (!name.trim()) return setError('Tell us your name — it’s just for the greeting.');
    if (!front || !back) return setError('We need both the front and the back of the pack.');
    if (personalise && selected.length === 0) return setError('Select at least one cat, or turn personalisation off.');
    setSubmitting(true);
    setError(null);
    localStorage.setItem('wiser_name', name.trim());
    const analysis_id = crypto.randomUUID();
    try {
      await api.analyze({
        analysis_id,
        session_id: null,
        personalise_flag: personalise,
        cat_ids: personalise ? selected : [],
        images: [
          { imageId: front.imageId, cloudinaryUrl: front.cloudinaryUrl, category: 'front' },
          { imageId: back.imageId, cloudinaryUrl: back.cloudinaryUrl, category: 'back' },
        ],
        cta_source: 'food-input',
        timestamp: new Date().toISOString(),
      });
      router.push(`/loading?analysis_id=${analysis_id}`);
    } catch (e) {
      setSubmitting(false);
      setError(e instanceof Error ? e.message : 'Could not start the analysis — try again.');
    }
  }

  return (
    <div>
      <h1 className="font-serif text-2xl">Scan a pack</h1>
      <p className="mt-1 text-sm text-gray-500">Two photos and ~a minute — that’s all it takes.</p>

      <label className="mb-1 mt-6 block text-sm font-medium text-gray-700">Your name</label>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="So we can say hi" />

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <UploadZone category="front" label="Front of pack" hint="Brand & product name visible" onUploaded={setFront} />
        <UploadZone category="back" label="Back of pack" hint="Ingredients & analysis table visible" onUploaded={setBack} />
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-soft">
        <label className="flex cursor-pointer items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-800">Personalise for my cats</span>
            <p className="text-xs text-gray-400">Life-stage fit and health callouts per cat</p>
          </div>
          <input type="checkbox" checked={personalise} onChange={(e) => setPersonalise(e.target.checked)} className="h-5 w-5 accent-primary-600" />
        </label>
        {personalise && (
          <div className="mt-3 flex flex-wrap gap-2">
            {cats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected((s) => (s.includes(c.id!) ? s.filter((x) => x !== c.id) : [...s, c.id!]))}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${selected.includes(c.id!) ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-gray-200 text-gray-600'}`}
              >
                {c.cat_name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowCatForm(true)}
              className="flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-500 hover:border-primary-300"
            >
              <Plus className="h-4 w-4" /> Add cat
            </button>
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <Button className="mt-5 w-full" onClick={submit} disabled={submitting}>
        {submitting ? 'Starting…' : 'Analyse this food'}
      </Button>

      {showCatForm && (
        <CatForm
          onClose={() => setShowCatForm(false)}
          onSave={async (cat) => {
            const saved = await api.saveCat(cat);
            setCats((cs) => [...cs, saved]);
            if (saved.id) setSelected((s) => [...s, saved.id!]);
          }}
        />
      )}
    </div>
  );
}
