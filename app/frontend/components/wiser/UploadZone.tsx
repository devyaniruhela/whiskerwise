'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { validateImageClient } from '@/lib/imageValidation';
import { uploadImageToCloudinary, CloudinaryUploadResult } from '@/lib/cloudinaryUpload';

type ZoneState = 'empty' | 'checking' | 'uploading' | 'pass' | 'fail';

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
      // Tier 0 server check (sharp): format + dimensions
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
        className={`relative flex h-44 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed p-4 text-center transition
          ${state === 'pass' ? 'border-primary-400 bg-primary-50' : state === 'fail' ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-primary-300'}`}
      >
        {preview && state === 'pass' ? (
          <>
            <Image src={preview} alt={label} fill className="object-cover opacity-90" unoptimized />
            <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-primary-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> {label} added
            </span>
            <span className="absolute right-2 top-2 rounded-full bg-white/95 p-1.5 text-gray-500">
              <RefreshCw className="h-3.5 w-3.5" />
            </span>
          </>
        ) : state === 'checking' || state === 'uploading' ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            <span className="text-sm text-gray-500">{state === 'checking' ? 'Checking photo…' : 'Uploading…'}</span>
          </>
        ) : (
          <>
            {state === 'fail' ? <XCircle className="h-6 w-6 text-red-400" /> : <Camera className="h-6 w-6 text-primary-500" />}
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <span className="text-xs text-gray-400">{hint}</span>
          </>
        )}
      </button>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
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
