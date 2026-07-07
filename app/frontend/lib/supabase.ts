// Identity only (anonymous sign-in v1) — data access always goes through the BFF →
// FastAPI → direct Postgres, never Supabase's Data API. Degrades gracefully: without
// env values the app still works (backend maps missing auth to its dev user).
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null | undefined;

export function supabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client = url && key ? createClient(url, key) : null;
  return client;
}

/** Session token for API calls; signs in anonymously on first visit. */
export async function getAccessToken(): Promise<string | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  if (data.session) return data.session.access_token;
  const { data: anon, error } = await sb.auth.signInAnonymously();
  if (error) { console.warn('anonymous sign-in failed:', error.message); return null; }
  return anon.session?.access_token ?? null;
}
