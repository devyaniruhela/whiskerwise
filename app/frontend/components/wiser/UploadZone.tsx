'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowsClockwise, Camera, CheckCircle, CircleNotch, XCircle } from '@phosphor-icons/react';
import { validateImageClient } from '@/lib/imageValidation';
import { uploadImageToCloudinary, CloudinaryUploadResult } from '@/lib/cloudinaryUpload';

type ZoneState = 'empty' | 'checking' | 'uploading' | 'pass' | 'fail';

/** Write-flow surface: sober, fast, forgiving (DESIGN.md). */
export function UploadZone({ category, label, hint, onUploaded }: {
  category: 'front' | 'back';
  label: string;
  hint: string;
  onUploaded: (result: CloudinaryUploadResult | null) => void;
}) {
  const [state, setState] = useState<ZoneState>('empty');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    onUploaded(null);
    setState('checking');
    const client = validateImageClient(file);
    if (!client.valid) {
      setState('fail');
      setError(client.error ?? 'That file won’t work — try a JPG or PNG under 15MB.');
      return;
    }
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/validate-image', { method: 'POST', body: form });
      const check = await res.json();
      if (!check.valid) {
        setState('fail');
        setError(check.error ?? 'We couldn’t read that image — try another photo.');
        return;
      }
      setState('uploading');
      const uploaded = await uploadImageToCloudinary(file, category);
      setPreview(URL.createObjectURL(file));
      setState('pass');
      onUploaded(uploaded);
    } catch (e) {
      setState('fail');
      setError(e instanceof Error ? e.message : 'Upload failed — please try again.');
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`relative flex h-44 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-md border-2 border-dashed p-4 text-center transition-colors duration-150
          ${state === 'pass' ? 'border-emerald bg-emerald-tint/60' : state === 'fail' ? 'border-iron bg-iron-tint/60' : 'border-hairline-strong bg-paper hover:border-emerald/60'}`}
      >
        {preview && state === 'pass' ? (
          <>
            <Image src={preview} alt={label} fill className="object-cover opacity-90" unoptimized />
            <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-sm bg-paper/95 px-2.5 py-1 font-sans text-xs font-semibold text-emerald">
              <CheckCircle size={14} weight="fill" aria-hidden /> {label} added
            </span>
            <span className="absolute right-2 top-2 rounded-sm bg-paper/95 p-1.5 text-ink-muted">
              <ArrowsClockwise size={14} aria-hidden />
            </span>
          </>
        ) : state === 'checking' || state === 'uploading' ? (
          <>
            <CircleNotch size={24} className="animate-spin text-emerald" aria-hidden />
            <span className="text-sm text-ink-muted">{state === 'checking' ? 'Checking photo…' : 'Uploading…'}</span>
          </>
        ) : (
          <>
            {state === 'fail'
              ? <XCircle size={26} className="text-iron" aria-hidden />
              : <Camera size={26} className="text-emerald" aria-hidden />}
            <span className="font-sans text-sm font-semibold text-ink">{label}</span>
            <span className="text-xs text-ink-faint">{hint}</span>
          </>
        )}
      </button>
      {error && <p className="mt-1.5 text-sm text-iron">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}
