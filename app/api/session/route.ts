import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionIdFromRequest,
  setSessionCookie,
} from '@/lib/cookieManager';
import type { SessionData } from '@/types/session';

/**
 * GET: Return current session ID (from cookie or create new and set cookie).
 * Client uses this to init or restore session and then syncs from localStorage.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    let sessionId = getSessionIdFromRequest(cookieHeader);

    if (!sessionId) {
      sessionId = crypto.randomUUID();
      const res = NextResponse.json({ sessionId });
      setSessionCookie(res, sessionId);
      return res;
    }

    return NextResponse.json({ sessionId });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[session GET]', err);
    }
    return NextResponse.json(
      { error: 'Session init failed' },
      { status: 500 }
    );
  }
}

/** All session fields we accept from client and forward to n8n */
const SESSION_PAYLOAD_KEYS: (keyof SessionData)[] = [
  'id',
  'user_agent',
  'device_type',
  'browser',
  'os',
  'referrer',
  'landing_page',
  'visited_profile_page',
  'landing_main_cta_clicked',
  'landing_personalise_cta_clicked',
  'profile_analyze_cta_clicked',
  'page_views',
  'actions_count',
  'time_on_site_sec',
  'num_uploads',
  'num_analyses',
  'num_personalized_analyses',
  'num_generic_analyses',
  'email_captured',
  'phone_captured',
  'user_id',
  'session_status',
  'last_active',
  'expires_at',
  'created_at',
];

function validateSessionPayload(body: unknown): body is SessionData {
  if (!body || typeof body !== 'object') return false;
  const o = body as Record<string, unknown>;
  if (typeof o.id !== 'string' || o.id.length === 0) return false;
  if (typeof o.last_active !== 'string') return false;
  return true;
}

/**
 * Determine snapshot event type for this sync. Only forward to n8n on these moments.
 * Priority: session_start (first sync) > contact_capture > analysis_complete > analysis_start.
 */
function getEventType(sessionData: Record<string, unknown>): string | null {
  const lastSync = sessionData.last_sync;
  const hasContact =
    (sessionData.email_captured && String(sessionData.email_captured).trim()) ||
    (sessionData.phone_captured && String(sessionData.phone_captured).trim());
  const numAnalyses = Number(sessionData.num_analyses ?? 0);
  const ctaClicked =
    sessionData.landing_main_cta_clicked === true ||
    sessionData.landing_personalise_cta_clicked === true ||
    sessionData.profile_analyze_cta_clicked === true;

  if (!lastSync) return 'session_start';
  if (hasContact) return 'contact_capture';
  if (numAnalyses > 0) return 'analysis_complete';
  if (ctaClicked) return 'analysis_start';
  return null;
}

/**
 * POST: Receive session data from client, validate, forward to n8n only on snapshot moments.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!validateSessionPayload(body)) {
      return NextResponse.json(
        { error: 'Invalid session payload' },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {};
    const bodyObj = body as unknown as Record<string, unknown>;
    for (const key of SESSION_PAYLOAD_KEYS) {
      const v = bodyObj[key];
      if (v !== undefined) payload[key] = v;
    }
    const syncedAt = new Date().toISOString();
    payload.last_sync = syncedAt;

    const eventType = getEventType(payload);
    const webhookUrl = process.env.N8N_WEBHOOK_URL_SESSION;

    if (eventType && webhookUrl && webhookUrl.trim()) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            event_type: eventType,
            synced_at: syncedAt,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok && process.env.NODE_ENV === 'development') {
          console.warn('[session POST] n8n webhook not ok', res.status);
        }
      } catch (e) {
        clearTimeout(timeout);
        if (process.env.NODE_ENV === 'development') {
          console.warn('[session POST] n8n webhook error', e);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[session POST]', err);
    }
    return NextResponse.json(
      { error: 'Session sync failed' },
      { status: 500 }
    );
  }
}
