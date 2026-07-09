'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from '@phosphor-icons/react';
import { Button, Input } from '@/components/ui';
import { UploadZone } from '@/components/wiser/UploadZone';
import { CatForm, avatarSrc } from '@/components/wiser/CatForm';
import { api } from '@/lib/api';
import type { CatProfile } from '@/types';
import type { CloudinaryUploadResult } from '@/lib/cloudinaryUpload';

function FoodInputInner() {
  const router = useRouter();
  const params = useSearchParams();
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
    const pre = params.get('preselectCat');
    if (pre) {
      setPersonalise(true);
      setSelected([pre]);
    }
  }, [params]);

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
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-24">
      <h1 className="font-serif text-3xl text-ink">Scan a pack</h1>
      <p className="mt-1 text-base text-ink-muted">Two photos and about a minute — that’s all it takes.</p>

      <Input label="Your name" className="mt-7" value={name}
        onChange={(e) => setName(e.target.value)} placeholder="So we can say hi" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <UploadZone category="front" label="Front of pack" hint="Brand & product name visible" onUploaded={setFront} />
        <UploadZone category="back" label="Back of pack" hint="Ingredients & analysis table visible" onUploaded={setBack} />
      </div>

      <div className="mt-6 rounded-md border border-hairline bg-paper p-4">
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <div>
            <span className="font-sans text-sm font-semibold text-ink">Personalise for my cats</span>
            <p className="mt-0.5 text-sm text-ink-muted">Life-stage fit and health callouts, cat by cat</p>
          </div>
          <input type="checkbox" checked={personalise} onChange={(e) => setPersonalise(e.target.checked)}
            className="h-5 w-5 accent-emerald" />
        </label>
        {personalise && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {cats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected((s) => (s.includes(c.id!) ? s.filter((x) => x !== c.id) : [...s, c.id!]))}
                className={`flex min-h-[42px] items-center gap-2 rounded-md border py-1 pl-1 pr-3.5 font-sans text-sm transition-colors duration-150
                  ${selected.includes(c.id!) ? 'border-emerald bg-sel font-semibold text-emerald' : 'border-hairline-strong text-ink-muted hover:bg-sel/50'}`}
              >
                <Image src={avatarSrc(c.avatar)} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
                {c.cat_name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowCatForm(true)}
              className="flex min-h-[42px] items-center gap-1.5 rounded-md border border-dashed border-hairline-strong px-3.5 font-sans text-sm text-ink-muted transition-colors hover:border-emerald/60 hover:text-emerald"
            >
              <Plus size={16} aria-hidden /> Add cat
            </button>
          </div>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-iron">{error}</p>}
      <Button className="mt-5 w-full" onClick={submit} loading={submitting}>
        Analyse this food
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
    </main>
  );
}

export default function FoodInput() {
  return <Suspense fallback={null}><FoodInputInner /></Suspense>;
}
