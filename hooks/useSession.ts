'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createSession, isDoNotTrack, normalizeSessionData } from '@/lib/sessionManager';
import type { SessionData, TrackActionType, CTASource } from '@/types/session';
import { SESSION_STORAGE_KEY } from '@/types/session';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const TIME_TICK_MS = 10 * 1000; // 10 seconds
const SYNC_DEBOUNCE_MS = 2000;

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    localStorage.setItem('_ww_test', '1');
    localStorage.removeItem('_ww_test');
    return localStorage;
  } catch {
    return null;
  }
}

function loadFromStorage(): SessionData | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionData> & { id?: string };
    const id = parsed?.id;
    if (!id) return null;
    return normalizeSessionData({ ...parsed, id });
  } catch {
    return null;
  }
}

function saveToStorage(data: SessionData): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[useSession] localStorage set failed', e);
    }
  }
}

function mergeSession(
  existing: SessionData | null,
  sessionId: string,
  pathname: string
): SessionData {
  const now = new Date();
  const dnt = typeof navigator !== 'undefined' ? isDoNotTrack(navigator.doNotTrack ?? '') : false;

  if (existing && existing.id === sessionId) {
    const merged = {
      ...existing,
      last_active: now.toISOString(),
      ...(dnt && (existing.email_captured || existing.phone_captured)
        ? { email_captured: null, phone_captured: null }
        : {}),
    };
    return normalizeSessionData(merged);
  }

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const referrer = typeof document !== 'undefined' ? (document.referrer || null) : null;
  const landing = pathname && pathname.length > 0 ? pathname : '/now-wiser';

  return createSession({
    id: sessionId,
    userAgent,
    referrer,
    landingPage: landing,
  });
}

export interface UseSessionReturn {
  session: SessionData | null;
  sessionId: string | null;
  isReady: boolean;
  trackPageView: (path: string) => void;
  trackAction: (actionType: TrackActionType) => void;
  updateSession: (updates: Partial<SessionData>, immediate?: boolean) => void;
  trackProfileVisit: () => void;
  trackCTAClick: (ctaSource: CTASource) => void;
  trackImageUpload: () => void;
  trackAnalysisComplete: (wasPersonalized: boolean) => void;
  captureEmail: (email: string) => void;
  capturePhone: (phone: string) => void;
  linkToUser: (userId: string) => void;
  syncNow: () => void;
}

export function useSession(): UseSessionReturn {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const persistAndSync = useCallback((next: SessionData, immediate = false) => {
    setSession(next);
    saveToStorage(next);

    const doSync = () => {
      if (typeof window === 'undefined') return;
      const run = () => {
        fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        }).catch(() => {});
      };
      if (typeof (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback === 'function') {
        (window as unknown as { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(run);
      } else {
        setTimeout(run, 100);
      }
    };

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    if (immediate) {
      doSync();
    } else {
      syncTimeoutRef.current = setTimeout(doSync, SYNC_DEBOUNCE_MS);
    }
  }, []);

  const syncNow = useCallback(() => {
    const current = loadFromStorage();
    if (current) persistAndSync(current, true);
  }, [persistAndSync]);

  const updateSession = useCallback(
    (updates: Partial<SessionData>, immediate = false) => {
      setSession((prev) => {
        if (!prev) return null;
        const next = normalizeSessionData({
          ...prev,
          ...updates,
          last_active: new Date().toISOString(),
        });
        saveToStorage(next);
        persistAndSync(next, immediate);
        return next;
      });
    },
    [persistAndSync]
  );

  // Init: GET session id, merge with localStorage, start time tick and periodic sync
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const res = await fetch('/api/session');
        if (cancelled) return;
        const data = await res.json();
        const id = data?.sessionId ?? null;
        if (!id) {
          setIsReady(true);
          return;
        }
        setSessionId(id);
        const existing = loadFromStorage();
        const path = pathname ?? '/now-wiser';
        const next = mergeSession(existing, id, path);
        next.page_views = (next.page_views || 0) + 1;
        setSession(next);
        saveToStorage(next);
        persistAndSync(next, false);
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[useSession] init failed', e);
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    };
    init();
    return () => {
      cancelled = true;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  // Time on site: increment every 10s when tab is active
  useEffect(() => {
    if (!sessionId || !session) return;
    const tick = () => {
      setSession((prev) => {
        if (!prev) return null;
        const next = normalizeSessionData({
          ...prev,
          time_on_site_sec: (prev.time_on_site_sec || 0) + 1,
          last_active: new Date().toISOString(),
        });
        saveToStorage(next);
        return next;
      });
    };
    timeTickRef.current = setInterval(tick, TIME_TICK_MS);
    return () => {
      if (timeTickRef.current) clearInterval(timeTickRef.current);
    };
  }, [sessionId, session?.id]);

  // Periodic sync every 5 min (only on snapshot moments per API; client still sends payload)
  useEffect(() => {
    if (!session) return;
    intervalRef.current = setInterval(() => {
      const current = loadFromStorage();
      if (current) persistAndSync(current, true);
    }, SYNC_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session?.id, persistAndSync]);

  const trackPageView = useCallback(
    (path: string) => {
      setSession((prev) => {
        if (!prev) return null;
        const next = normalizeSessionData({
          ...prev,
          page_views: (prev.page_views || 0) + 1,
          last_active: new Date().toISOString(),
        });
        saveToStorage(next);
        persistAndSync(next, false);
        return next;
      });
    },
    [persistAndSync]
  );

  const trackAction = useCallback(
    (actionType: TrackActionType) => {
      setSession((prev) => {
        if (!prev) return null;
        const next = normalizeSessionData({
          ...prev,
          actions_count: (prev.actions_count || 0) + 1,
          last_active: new Date().toISOString(),
        });
        saveToStorage(next);
        persistAndSync(next, true);
        return next;
      });
    },
    [persistAndSync]
  );

  const trackProfileVisit = useCallback(() => {
    updateSession({ visited_profile_page: true }, false);
  }, [updateSession]);

  const trackCTAClick = useCallback(
    (ctaSource: CTASource) => {
      setSession((prev) => {
        if (!prev) return null;
        const updates: Partial<SessionData> = {
          actions_count: (prev.actions_count || 0) + 1,
          last_active: new Date().toISOString(),
        };
        if (ctaSource === 'landing_main') updates.landing_main_cta_clicked = true;
        else if (ctaSource === 'landing_personalise') updates.landing_personalise_cta_clicked = true;
        else if (ctaSource === 'profile') updates.profile_analyze_cta_clicked = true;
        const next = normalizeSessionData({ ...prev, ...updates });
        saveToStorage(next);
        persistAndSync(next, true);
        return next;
      });
    },
    [persistAndSync]
  );

  const trackImageUpload = useCallback(() => {
    setSession((prev) => {
      if (!prev) return null;
      const next = normalizeSessionData({
        ...prev,
        num_uploads: (prev.num_uploads || 0) + 1,
        actions_count: (prev.actions_count || 0) + 1,
        last_active: new Date().toISOString(),
      });
      saveToStorage(next);
      persistAndSync(next, true);
      return next;
    });
  }, [persistAndSync]);

  const trackAnalysisComplete = useCallback(
    (wasPersonalized: boolean) => {
      setSession((prev) => {
        if (!prev) return null;
        const next = normalizeSessionData({
          ...prev,
          num_analyses: (prev.num_analyses || 0) + 1,
          actions_count: (prev.actions_count || 0) + 1,
          num_personalized_analyses: wasPersonalized
            ? (prev.num_personalized_analyses || 0) + 1
            : prev.num_personalized_analyses || 0,
          num_generic_analyses: !wasPersonalized
            ? (prev.num_generic_analyses || 0) + 1
            : prev.num_generic_analyses || 0,
          last_active: new Date().toISOString(),
        });
        saveToStorage(next);
        persistAndSync(next, true);
        return next;
      });
    },
    [persistAndSync]
  );

  const dnt = typeof navigator !== 'undefined' ? isDoNotTrack(navigator.doNotTrack ?? '') : false;

  const captureEmail = useCallback(
    (email: string) => {
      if (dnt) return;
      updateSession({ email_captured: email?.trim() || null }, true);
    },
    [dnt, updateSession]
  );

  const capturePhone = useCallback(
    (phone: string) => {
      if (dnt) return;
      updateSession({ phone_captured: phone?.trim() || null }, true);
    },
    [dnt, updateSession]
  );

  const linkToUser = useCallback(
    (userId: string) => {
      updateSession({ user_id: userId, session_status: 'converted' }, true);
    },
    [updateSession]
  );

  return {
    session,
    sessionId,
    isReady,
    trackPageView,
    trackAction,
    updateSession,
    trackProfileVisit,
    trackCTAClick,
    trackImageUpload,
    trackAnalysisComplete,
    captureEmail,
    capturePhone,
    linkToUser,
    syncNow,
  };
}
