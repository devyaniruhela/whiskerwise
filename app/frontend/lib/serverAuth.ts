// Server-side identity for the Next.js CRUD routes — the TypeScript counterpart of
// the backend's app/backend/app/auth.py. Verifies the Supabase anon JWT and returns
// the user's UUID (which mirrors auth.users.id). No token / invalid token → the same
// fixed dev user the Python side uses, so local curl works without a real session.
import { createClient } from '@supabase/supabase-js';

export const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  '';

// A stateless client used only to verify tokens (no session persistence server-side).
const authClient =
  URL && KEY ? createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } }) : null;

export interface Identity {
  userId: string;
  sessionId: string | null; // Supabase session id from the JWT, for session/device stamping
}

function bearer(req: Request): string | null {
  const h = req.headers.get('authorization');
  return h && h.includes(' ') ? h.split(' ', 2)[1] || null : null;
}

// Read one claim from the JWT payload WITHOUT verifying — only ever called after
// getUser() has already verified the token; lets us pull session_id, which the
// user object doesn't expose.
function claim(token: string, key: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
    return payload?.[key] ?? null;
  } catch {
    return null;
  }
}

/** Verified Supabase user → its id; otherwise the dev user (mirrors auth.py). */
export async function identify(req: Request): Promise<Identity> {
  const token = bearer(req);
  if (token && authClient) {
    try {
      const { data, error } = await authClient.auth.getUser(token);
      if (!error && data.user) return { userId: data.user.id, sessionId: claim(token, 'session_id') };
    } catch {
      // fall through to dev user
    }
  }
  return { userId: DEV_USER_ID, sessionId: token ? claim(token, 'session_id') : null };
}
