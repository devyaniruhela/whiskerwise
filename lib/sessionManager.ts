/**
 * Session creation and user-agent parsing.
 * Used on server (API) and can be used on client for building session payloads.
 */

import { UAParser } from 'ua-parser-js';
import type { SessionData, SessionDeviceType } from '@/types/session';
import { SESSION_DAYS, SESSION_STORAGE_KEY } from '@/types/session';

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const DEVICE_TYPES: SessionDeviceType[] = ['mobile', 'tablet', 'desktop'];

function parseDeviceType(ua: string): SessionDeviceType {
  const parser = new UAParser(ua);
  const type = parser.getDevice().type;
  if (type === 'mobile') return 'mobile';
  if (type === 'tablet') return 'tablet';
  return 'desktop';
}

function parseBrowser(ua: string): string {
  const parser = new UAParser(ua);
  const browser = parser.getBrowser();
  const name = browser.name;
  return name && name.length > 0 ? name : 'Unknown';
}

function parseOS(ua: string): string {
  const parser = new UAParser(ua);
  const os = parser.getOS();
  const name = os.name;
  return name && name.length > 0 ? name : 'Unknown';
}

/**
 * Normalize OS string to one of: iOS, Android, Windows, MacOS, Linux.
 */
export function normalizeOS(os: string): string {
  const lower = os.toLowerCase();
  if (lower.includes('ios') || lower.includes('iphone') || lower.includes('ipad')) return 'iOS';
  if (lower.includes('android')) return 'Android';
  if (lower.includes('windows')) return 'Windows';
  if (lower.includes('mac')) return 'MacOS';
  if (lower.includes('linux') || lower.includes('ubuntu') || lower.includes('fedora')) return 'Linux';
  return os || 'Unknown';
}

/**
 * Create a new session object with parsed UA and metadata.
 */
export function createSession(params: {
  id?: string;
  userAgent: string;
  referrer: string | null;
  landingPage: string;
}): SessionData {
  const id = params.id ?? generateSessionId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  const deviceType = parseDeviceType(params.userAgent);
  const browser = parseBrowser(params.userAgent);
  const os = normalizeOS(parseOS(params.userAgent));

  return {
    id,
    user_agent: params.userAgent,
    device_type: deviceType,
    browser,
    os,
    referrer: params.referrer ?? null,
    landing_page: params.landingPage,
    visited_profile_page: false,
    landing_main_cta_clicked: false,
    landing_personalise_cta_clicked: false,
    profile_analyze_cta_clicked: false,
    page_views: 0,
    actions_count: 0,
    time_on_site_sec: 0,
    num_uploads: 0,
    num_analyses: 0,
    num_personalized_analyses: 0,
    num_generic_analyses: 0,
    email_captured: null,
    phone_captured: null,
    user_id: null,
    session_status: 'active',
    last_active: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    created_at: now.toISOString(),
  };
}

/** Fill missing session fields (e.g. after loading old session from localStorage). */
export function normalizeSessionData(partial: Partial<SessionData> & { id: string }): SessionData {
  const now = new Date().toISOString();
  const exp = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: partial.id,
    user_agent: partial.user_agent ?? '',
    device_type: partial.device_type ?? 'desktop',
    browser: partial.browser ?? 'Unknown',
    os: partial.os ?? 'Unknown',
    referrer: partial.referrer ?? null,
    landing_page: partial.landing_page ?? '/now-wiser',
    visited_profile_page: partial.visited_profile_page ?? false,
    landing_main_cta_clicked: partial.landing_main_cta_clicked ?? false,
    landing_personalise_cta_clicked: partial.landing_personalise_cta_clicked ?? false,
    profile_analyze_cta_clicked: partial.profile_analyze_cta_clicked ?? false,
    page_views: partial.page_views ?? 0,
    actions_count: partial.actions_count ?? 0,
    time_on_site_sec: partial.time_on_site_sec ?? 0,
    num_uploads: partial.num_uploads ?? 0,
    num_analyses: partial.num_analyses ?? 0,
    num_personalized_analyses: partial.num_personalized_analyses ?? 0,
    num_generic_analyses: partial.num_generic_analyses ?? 0,
    email_captured: partial.email_captured ?? null,
    phone_captured: partial.phone_captured ?? null,
    user_id: partial.user_id ?? null,
    session_status: partial.session_status ?? 'active',
    last_active: partial.last_active ?? now,
    expires_at: partial.expires_at ?? exp,
    created_at: partial.created_at ?? now,
  };
}

/**
 * Get current session ID from localStorage (client-only). Returns null on server or if no session.
 */
export function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { id?: string };
    return data?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Check if Do Not Track is requested (client passes this; don't store PII when true).
 */
export function isDoNotTrack(dntHeader: string | null): boolean {
  return dntHeader === '1' || (dntHeader ?? '').toLowerCase() === 'true';
}
