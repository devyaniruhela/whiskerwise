'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { CatForm } from '@/components/wiser/CatForm';
import { VerdictChip } from '@/components/wiser/VerdictBits';
import { BODY_CONDITIONS } from '@/constants/cat-data';
import { api } from '@/lib/api';
import type { CatProfile, HistoryItem } from '@/types';

const BC_LABEL: Record<number, string> = Object.fromEntries(
  BODY_CONDITIONS.map((b, i) => [i + 1, b.label]),
) as Record<number, string>;

export default function ProfilePage() {
  const [cats, setCats] = useState<CatProfile[]>([]);
  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  const [editing, setEditing] = useState<CatProfile | 'new' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CatProfile | null>(null);

  useEffect(() => {
    api.cats().then(setCats).catch(() => setCats([]));
    api.reports().then(setHistory).catch(() => setHistory([]));
  }, []);

  return (
    <div>
      <h1 className="font-serif text-2xl">Your cats</h1>
      <div className="mt-4 space-y-3">
        {cats.length === 0 && (
          <p className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
            No cats yet — add one to personalise your scans.
          </p>
        )}
        {cats.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-soft">
            <div>
              <p className="font-medium text-gray-900">{cat.cat_name}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {cat.cat_age_year ? `${cat.cat_age_year}y ` : ''}{cat.cat_age_month ? `${cat.cat_age_month}m` : cat.cat_age_year ? '' : 'age unknown'}
                {cat.body_condition ? ` · ${BC_LABEL[cat.body_condition]}` : ''}
              </p>
              {cat.health_condition.length > 0 && (
                <p className="mt-1 text-xs text-amber-700">{cat.health_condition.join(' · ')}</p>
              )}
            </div>
            <div className="flex gap-1.5">
              <Link
                href={`/food-input?personalize=true&preselectCat=${cat.id}`}
                className="rounded-full bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100"
              >
                Scan food
              </Link>
              <button aria-label="Edit" onClick={() => setEditing(cat)} className="p-1.5 text-gray-400 hover:text-primary-600"><Pencil className="h-4 w-4" /></button>
              <button aria-label="Delete" onClick={() => setConfirmDelete(cat)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        <Button variant="dashed" className="w-full" onClick={() => setEditing('new')}>
          <Plus className="mr-1 inline h-4 w-4" /> Add a cat
        </Button>
      </div>

      <h2 className="mt-10 font-serif text-xl">Scan history</h2>
      {history === null ? (
        <p className="mt-3 text-sm text-gray-400">Loading…</p>
      ) : history.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">No scans yet.</p>
          <p className="mt-1 text-xs text-gray-400">Your past verdicts will appear here as a timeline.</p>
          <Link href="/food-input" className="mt-3 inline-block text-sm font-medium text-primary-700 hover:underline">
            Scan your first pack →
          </Link>
        </div>
      ) : (
        <ol className="mt-4 space-y-0 border-l border-gray-200 pl-4">
          {history.map((h) => (
            <li key={h.analysis_id} className="relative pb-5">
              <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary-400" />
              <Link href={`/report/${h.analysis_id}`} className="block rounded-xl p-2 transition hover:bg-white hover:shadow-soft">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800">{[h.brand, h.variant].filter(Boolean).join(' · ') || 'Scanned pack'}</p>
                  <VerdictChip verdict={h.verdict} />
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{h.headline}</p>
                <p className="mt-0.5 text-[10px] text-gray-400">{new Date(h.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </Link>
            </li>
          ))}
        </ol>
      )}

      {editing && (
        <CatForm
          initial={editing === 'new' ? undefined : editing}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-soft-xl">
            <p className="text-sm text-gray-800">Remove {confirmDelete.cat_name}&apos;s profile?</p>
            <div className="mt-4 flex gap-2">
              <Button
                className="flex-1"
                onClick={async () => {
                  await api.deleteCat(confirmDelete.id!);
                  setCats((cs) => cs.filter((c) => c.id !== confirmDelete.id));
                  setConfirmDelete(null);
                }}
              >
                Remove
              </Button>
              <Button variant="bordered" className="flex-1" onClick={() => setConfirmDelete(null)}>Keep</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
