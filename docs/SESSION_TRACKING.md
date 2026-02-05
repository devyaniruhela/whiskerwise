# Session Tracking (V1 / V2)

Session tracking identifies anonymous users before login (V1) and can be linked to user accounts later (V2). The session stores **aggregates only** (counts, high-level flags, device info). Per-analysis details are tracked separately in Analysis records.

## Environment variables

Add to `.env.local` (see `.env.example`):

- **`N8N_WEBHOOK_URL_SESSION`** (optional) – n8n webhook URL. When set, the API forwards session payloads to this URL **only on snapshot moments** (see below).

## Snapshot moments (when we forward to n8n)

The API determines an `event_type` and only calls the n8n webhook when one of these applies:

- **`session_start`** – First sync (no `last_sync` yet).
- **`analysis_start`** – User clicked a primary CTA (landing “Analyse Cat Food”, landing “Get personalised insights”, or profile “Analyse”/scan icon).
- **`analysis_complete`** – At least one analysis has been completed (`num_analyses > 0`).
- **`contact_capture`** – Email or phone was captured in profile.

The body sent to n8n includes the full session payload plus `event_type` and `synced_at` (UTC ISO).

## Session data shape (`SessionData`)

- **Core:** `id`, `user_agent`, `device_type`, `browser`, `os`, `referrer`, `landing_page`
- **Navigation flags:** `visited_profile_page`, `landing_main_cta_clicked`, `landing_personalise_cta_clicked`, `profile_analyze_cta_clicked`
- **Counters:** `page_views`, `actions_count`, `time_on_site_sec`, `num_uploads`, `num_analyses`, `num_personalized_analyses`, `num_generic_analyses`
- **User:** `email_captured`, `phone_captured`, `user_id` (V2), `session_status` (`active` | `converted` | `abandoned`)
- **Lifecycle:** `last_active`, `expires_at`, `created_at`, optional `last_sync`

## Getting session ID elsewhere

```ts
import { getSessionId } from '@/lib/sessionManager';

const sessionId = getSessionId(); // string | null (client-only; null on server or if no session)
```

## Cookie

- **Name:** `ww_session_id`
- **Options:** HTTP-only, 30-day expiry, SameSite=Lax, Path=/
- **ID:** Generated with `crypto.randomUUID()` (server) when creating a new session.

## Immediate sync triggers

CTA clicks, analysis complete, email/phone capture, and `linkToUser` trigger an immediate sync. Other updates (e.g. page view, time tick) are debounced or sent on the 5-minute interval; the API still only forwards to n8n when a snapshot moment is detected.

## Privacy

- Do Not Track is respected: when DNT is enabled, `captureEmail` / `capturePhone` do not store PII.
- Session sync is best-effort; failures do not block the user.
