// BFF client: all backend calls go through /api/backend/* (Next proxy → FastAPI).
import { getAccessToken } from './supabase';
import type { AnalysisState, CatProfile, ExtractSummary, HistoryItem, Report, UserProfile } from '@/types';

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`/api/backend/${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error((await res.text().catch(() => '')) || `API ${res.status}`);
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  analyze: (payload: unknown) => call<{ analysis_id: string }>('analyze', { method: 'POST', body: JSON.stringify(payload) }),
  poll: (id: string) => call<AnalysisState>(`analyze/${id}`),
  // Extraction-review feedback: persisted signal only, never gates the report (PRD §8.6.7)
  confirm: (id: string, confirmed: boolean, note?: string) =>
    call<void>(`analyze/${id}/confirm`, { method: 'POST', body: JSON.stringify({ confirmed, note }) }),
  feedback: (id: string, feedback_yn: boolean, feedback_comments?: string) =>
    call<void>(`analyze/${id}/feedback`, { method: 'POST', body: JSON.stringify({ feedback_yn, feedback_comments }) }),
  me: () => call<UserProfile>('me'),
  saveMe: (profile: UserProfile) => call<void>('me', { method: 'PUT', body: JSON.stringify(profile) }),
  cats: () => call<CatProfile[]>('cats'),
  saveCat: (cat: CatProfile) => call<CatProfile>('cats', { method: 'POST', body: JSON.stringify(cat) }),
  deleteCat: (id: string) => call<void>(`cats/${id}`, { method: 'DELETE' }),
  reports: () => call<HistoryItem[]>('reports'),
  report: (id: string) =>
    call<Report & { analysis_id: string; brand?: string; variant?: string; created_at?: string; extract?: ExtractSummary | null }>(`report/${id}`),
};
