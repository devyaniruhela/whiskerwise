/**
 * Server-side session cookie management.
 * Used by API routes to set/read the HTTP-only session cookie.
 */

import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, SESSION_DAYS } from '@/types/session';

const MAX_AGE_SEC = SESSION_DAYS * 24 * 60 * 60;

/**
 * Get session ID from request cookies (server-side only).
 */
export function getSessionIdFromRequest(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`));
  const value = match?.[1]?.trim();
  return value && value.length > 0 ? value : null;
}

/**
 * Append Set-Cookie header for session ID to the response.
 * HTTP-only, 30 days, SameSite=Lax.
 */
export function setSessionCookie(response: NextResponse, sessionId: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE_SEC,
    path: '/',
  });
}

/**
 * Clear session cookie (e.g. on logout or expiry).
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
