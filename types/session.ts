// Session tracking types (V1 anonymous, V2 link to user)

export type SessionDeviceType = 'mobile' | 'tablet' | 'desktop';
export type SessionStatus = 'active' | 'converted' | 'abandoned';

export interface SessionData {
  // Core session identification
  id: string; // UUID
  user_agent: string;
  device_type: SessionDeviceType;
  browser: string;
  os: string;
  referrer: string | null;
  landing_page: string;

  // Navigation tracking (high-level flags)
  visited_profile_page: boolean; // true if user ever visited /profile
  landing_main_cta_clicked: boolean; // true if clicked "Analyze Food" on landing
  landing_personalise_cta_clicked: boolean; // true if clicked "Personalise" on landing
  profile_analyze_cta_clicked: boolean; // true if clicked "Analyze" on profile page

  // Activity counters
  page_views: number;
  actions_count: number; // QC pass/fail, Analysis start/complete
  time_on_site_sec: number; // Increment every 10s while tab active
  num_uploads: number; // QC pass image +=1
  num_analyses: number; // Total analyses (personalized + generic)
  num_personalized_analyses: number; // Count of analyses WITH personalise=true (>= 1 cat selected)
  num_generic_analyses: number; // Count of analyses without personalisation

  // User info capture
  email_captured: string | null;
  phone_captured: string | null;
  user_id: string | null; // V2 only (when login added)

  // Session lifecycle
  session_status: SessionStatus; // converted once user "linked" to id
  last_active: string; // ISO timestamp in UTC
  expires_at: string; // created_at + 30 days
  created_at: string; // UTC timestamp
  last_sync?: string; // Added by API when forwarding to n8n
}

export const SESSION_STORAGE_KEY = 'ww_session';
export const SESSION_COOKIE_NAME = 'ww_session_id';
export const SESSION_DAYS = 30;

export type CTASource = 'landing_main' | 'landing_personalise' | 'profile';

export type TrackActionType =
  | 'upload'
  | 'qc_pass'
  | 'qc_fail'
  | 'analysis_start'
  | 'analysis_complete'
  | string;
