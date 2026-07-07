# Old Code Context — `past work/wiser-by-whisker-wise/`

_Written 07 Jul 2026._ Full read-through of the old codebase so it doesn't need re-reading. Per `CLAUDE.md`: this code is **reference only, never modify in place** — lift assets by copying into `app/frontend/`. Where this doc says "reuse as-is," "rewrite," or "drop," that's the call for the new build.

---

## 1. What it is

Parked Next.js 15.1.3 / React 19 / TypeScript / Tailwind app. No backend of its own — everything persists to `localStorage`, and the one "real" analysis call is a proxy to an external n8n webhook. No database, no auth backend, no rules engine, no LLM calls anywhere in this repo.

```
"dependencies": lucide-react, next@15.1.3, react@19, react-dom@19, sharp@0.34.5, ua-parser-js, uuid
"devDependencies": tailwindcss, autoprefixer, postcss, typescript, @types/*
scripts: dev (next dev -H 0.0.0.0 -p 3000), dev:clean, dev:3001, dev:local, build, start, lint
```

Env vars it expects: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`, `N8N_WEBHOOK_URL_ANALYZE`, `N8N_WEBHOOK_URL_SESSION`, `NEXT_PUBLIC_SITE_URL` (optional, for OG metadata).

`docs/` folder has its own summaries (`DESIGN_SYSTEM_SUMMARY.md`, `SESSION_TRACKING.md`, `DIRECTORY_STRUCTURE.md`, `QUICK_REFERENCE.md`, `RESTRUCTURE_SUMMARY.md`) — not read in depth here, only this document is needed going forward.

---

## 2. Directory map

```
app/
  page.tsx                 — landing/hero (duplicate of now-wiser/page.tsx, no useSession wired)
  now-wiser/page.tsx        — the actual linked landing page (Header links here as "home")
  profile/page.tsx          — user + multi-cat profile, scan history (monolith, 1330 lines)
  food-input/page.tsx       — upload + QC + personalize + submit (monolith, 1658 lines)
  loading-page/page.tsx     — staged progress screen + polls localStorage for analyze result (658 lines)
  report/page.tsx           — "just completed" report view, reads ww_extract from localStorage (523 lines)
  report/[id]/page.tsx      — report-by-id view, currently 100% mock data keyed off id (284 lines)
  about/page.tsx, layout.tsx, error.tsx, loading.tsx, not-found.tsx, global-error.tsx
  api/
    validate-image/route.ts — sharp-based server QC (working, reusable as-is)
    analyze/route.ts        — proxy to N8N_WEBHOOK_URL_ANALYZE (drop — replace with FastAPI call)
    session/route.ts        — session cookie + proxy to N8N_WEBHOOK_URL_SESSION (partially reusable)
components/
  layout/Header.tsx, Footer.tsx, AboutSection.tsx
  ui/Button.tsx, Input.tsx, Badge.tsx, index.ts   — design-system-driven primitives
  SessionTracker.tsx        — mounts useSession() at root layout, no own UI
lib/
  cloudinaryUpload.ts       — direct browser→Cloudinary upload (reusable as-is)
  imageValidation.ts        — client-side file type/size checks (reusable as-is)
  cookieManager.ts          — session cookie get/set/clear (reusable as-is)
  sessionManager.ts         — session object create/normalize + UA parsing (reusable as-is)
  extractNormalizer.ts      — normalizes n8n's extract shape → ExtractedData (drop/rewrite — n8n-specific)
  validation.ts             — name/phone/email/DOB validators (reusable as-is)
  errorMessages.ts          — QC_ERROR_MESSAGES map (reusable, but see §10 duplication issue)
  design-system.ts          — typed getters over config/design-system.json (reusable as-is)
hooks/useSession.ts         — the session tracking hook (reusable as-is, mostly)
types/index.ts, analysis.ts, session.ts   — shared TS types (see §3)
constants/cat-data.ts       — avatars, body conditions, health conditions, country codes (reusable as-is)
config/design-system.json   — color/spacing/component token source of truth (reusable as-is)
python/calculations/        — empty (.gitkeep only, nothing built)
archive/                    — old static HTML, not relevant
```

---

## 3. Shared types (`types/`)

### `types/index.ts`
- `QCState = 'empty' | 'uploading' | 'checking' | 'pass' | 'fail'`
- `StepState = 'pending' | 'in-progress' | 'complete' | 'failed' | 'locked' | 'unlocking'`
- `CatProfile`: `id, name, avatar, ageYears, ageMonths, bodyCondition, healthConditions[], otherHealthDesc?, selected, weightKg?, dob?, neuteringStatus?('neutered'|'not_neutered'|'unknown'), outdoorAccess?(bool), activityLevel?('lightly'|'moderately'|'very')`. **Note:** `healthConditions` here is an array of the *display label strings* from `HEALTH_CONDITIONS` (e.g. `"Food allergies/sensitivities"`), not the PRD's normalized enum (`arthritis`/`dental`/`diabetes`/`allergies`) — needs mapping when wiring to the new backend contract.
- `ProfileUser`: `firstName, lastName, phone, email, countryCode?` (default `+91`)
- `ScanHistoryItem`: `id, thumbnails[], reportRating?, brand?, variant?, scannedAt?`
- `BodyCondition`: `id, label, desc, image`
- `CatAvatar`: `id, image`
- `ExtractedData` — the old FE's extraction shape (camelCase, flat, no per-standard basis distinction): `brand, product_name` (no, actually no product_name field — just `variant`), `lifestage, type, typeMethod, adequacy, texture, aafcoCertified, otherCertifications[], claims[], intendedUse, ingredients[], additives[], guaranteedAnalysis{protein,fat,fibre,ash,moisture,others:[{label,value}]}, taurineAdded, weight, price, priceCurrency, metEnergy100g, manufacturerName, manufacturerContact, countryOrigin, dateManufacture, dateExpiry, translatedFlag, confidence?`. **This predates the PRD's `LabelData`/`Extracts raw/processed` split** — doesn't have `format`/`completeness_claim`/`declared_life_stage` naming, doesn't separate raw vs processed, doesn't have `unreadable_fields` or `extraction_confidence` as a first-class enum (has a loose `confidence?: number`). Treat as legacy shape to migrate away from, not the target contract (PRD §6 / `extract-data-model.csv` are the target).
- `StepData`: `label, detail, qcError?`

### `types/analysis.ts`
- `ImageData`: `imageId, cloudinaryUrl, category: 'front'|'back'`
- `AnalysisPayload` (what old FE posts to `/api/analyze`): `analysis_id, session_id, personalise_flag, cat_ids[], images[], cta_source, timestamp`. **This matches the PRD §9.2 contract almost exactly** — good sign, the new `/api/analyze` BFF route can keep this shape.
- `StoredAnalysisImage`: images pending analysis, kept in localStorage under key `ww_analysis_images` (`ANALYSIS_IMAGES_STORAGE_KEY`)
- `AnalyzeImageError` / `AnalyzeErrorResponse` / `AnalyzeSuccessResponse` — old n8n response shapes (n8n-specific, don't carry forward)
- `StoredAnalyzeResult`: `{ ok, status?, data }`, stored at `ww_analyze_result_{analysisId}` (`ANALYZE_RESULT_PREFIX`) — this is the localStorage polling mechanism the loading page reads (see §4.3)

### `types/session.ts`
- `SessionData`: anonymous session tracking object — device/browser/OS (via `ua-parser-js`), navigation flags (`visited_profile_page`, three CTA-click flags), counters (`page_views`, `actions_count`, `time_on_site_sec`, `num_uploads`, `num_analyses`, `num_personalized_analyses`, `num_generic_analyses`), captured contact (`email_captured`, `phone_captured`, DNT-aware), `user_id` (null until V2 login exists), `session_status: 'active'|'converted'|'abandoned'`, timestamps, `expires_at` (30 days).
- Storage: `localStorage` key `ww_session` (`SESSION_STORAGE_KEY`); cookie name `ww_session_id` (`SESSION_COOKIE_NAME`), 30-day HttpOnly/SameSite=Lax.

---

## 4. Pages — flow and state

### 4.1 `now-wiser/page.tsx` (linked landing) / `page.tsx` (near-duplicate root)
Hero + 3-step "how it works" + 4 flip-cards ("Why Wiser": ingredient quality, global standards, personalization w/ CTA, red flags) + About + Footer. `now-wiser` wires `trackCTAClick` via `useSession`; `page.tsx` doesn't (looks stale/unused — Header always links "home" to `/now-wiser`, so `app/page.tsx` may be dead code). CTA → `/food-input` (main) or `/food-input?personalize=true` (from the personalization flip-card).

### 4.2 `profile/page.tsx` (1330 lines — monolith)
- localStorage keys: `ww_userProfile`, `ww_userName`, `ww_cats`, `ww_scanHistory`.
- User section: name/phone(with country code)/email, inline edit, validated via `lib/validation.ts`. On save, calls `captureEmail`/`capturePhone` from `useSession`.
- Cat profiles: full CRUD (add/edit/delete with confirm modal). Required fields to save a cat: name, body condition, ≥1 health condition (+ description if "Other"); age (years or months, at least one non-zero) and weight/DOB/neutering/outdoor/activity are validated with inline errors but **not required to save** — `isCatComplete()` computes a separate "Complete"/"Missing details" badge shown per cat card without blocking save. Per-cat "scan food" deep link: `/food-input?from=profile&personalize=true&preselectCat={id}`.
- Scan history: shows top 2 scans normally, "View more" expands to a paginated (5/page) date-grouped timeline. In dev mode with no real history, seeds 5 `SAMPLE_SCANS` — **remove this demo-data fallback in the rewrite**.
- Everything here is `localStorage`-only; no backend calls except the session capture ones.

### 4.3 `food-input/page.tsx` (1658 lines — monolith)
- Query params: `?personalize=true` (personalized flow UI), `?from=profile`, `?preselectCat={id}`.
- Two `UploadZone` components (front/back) drive a QC state machine: `empty → checking (client validate) → uploading (POST /api/validate-image, then Cloudinary) → pass/fail`. Client validation (`validateImageClient`) runs first; only if it passes does it POST to `/api/validate-image` (sharp-based dimension/format re-check), then straight to `uploadImageToCloudinary` (no separate "Gemini QC" step exists in old code — that's new for Tier-1 in the PRD).
- On pass, image metadata is stored in `localStorage['ww_analysis_images']` as `StoredAnalysisImage[]`.
- Personalization: inline cat-add/edit form (near-duplicate of the one in `profile/page.tsx`, slightly different required-field set: name + body condition + ≥1 health condition + age required to save here, no weight/DOB/neutering required at all). Selected cats tracked via `cat.selected` boolean on each `CatProfile`.
- Submit (`handleSubmit`): requires name + both images `pass`; if personalized flow, requires ≥1 selected cat. Builds `AnalysisPayload` (matches PRD/`types/analysis.ts` shape), stashes user/cat state into several `ww_*` localStorage keys for the next page to read, **fires `POST /api/analyze` but does NOT await it** — writes the eventual result to `localStorage['ww_analyze_result_' + analysisId]` when it resolves, and immediately `router.push`es to `/loading-page?analysis_id=...&return=...`. This fire-and-forget-then-poll-localStorage pattern is the old equivalent of the PRD's real async job / polling design — the new FE should replace it with real polling against `GET /analyze/{id}` instead of a same-tab promise + localStorage handoff (this pattern breaks if the user closes the tab or it's a different device).

### 4.4 `loading-page/page.tsx` (658 lines)
- Reads `ww_userName`, `ww_imageFront`, `ww_imageBack`, `ww_cats`, `ww_personalizing`, `ww_selectedCatNames` from localStorage (written by food-input just before navigating here) to render the staged progress UI with the user's own images.
- Step UI: 5 steps (`StepState[]`), first 3 are **time-driven** (3s/5s/6s hardcoded, `STEP_DURATIONS_MS`), step 4 waits for the actual response. This matches PRD §8.2's "may be time-driven if backend returns in one shot" note but should be replaced with real stage transitions once FastAPI exposes them.
- Polling: `setInterval`-free — actually just re-checks `localStorage.getItem(ANALYZE_RESULT_PREFIX + analysisId)` every `POLL_INTERVAL_MS=500` inside a `useEffect`, since the result is written by the *same tab* that's still open (fire-and-forget fetch from food-input). Normalizes n8n's several possible response shapes (raw array, `.extract`, `.data`, error array) via `lib/extractNormalizer.ts`.
- **Contains leftover debug instrumentation:** several `fetch('http://127.0.0.1:7245/ingest/...')` calls wrapped in `// #region agent log` / `// #endregion` blocks, posting internal state to a local debug server for a past debugging session. **Do not carry these into the new app** — dead weight at best, a stray network call to localhost at worst.
- On success, stores normalized data to `localStorage['ww_extract']` and navigates to `/report`; on error, shows an error modal with a message from `lib/errorMessages.ts`.

### 4.5 `report/page.tsx` (523 lines) vs `report/[id]/page.tsx` (284 lines)
Two separate, largely duplicate report UIs:
- **`report/page.tsx`** — "just completed" view. Reads `ww_extract` from localStorage (falls back to a hardcoded mock `ExtractedData` if absent, pulling brand/variant from separate `ww_detectedBrand`/`ww_detectedVariant` keys that nothing else in the codebase writes — dead code path). Also reads `ww_imageFront`/`ww_imageBack` for a front/back image toggle. Has a feedback textarea + "does this look right" 3-button verification (match/incorrect/unable) that only does `console.log` — no persistence.
- **`report/[id]/page.tsx`** — "view a past scan" by id. **100% mock** — `buildMockDataForId(id)` returns one of two hardcoded `ExtractedData` objects based on whether `id === 'sample-2'`; not wired to any real storage or backend at all. Same verification UI pattern as above (also `console.log`-only, then a 3s-delay modal + redirect to `/profile`).
- Both display: basic info (brand/variant/lifestage/type/adequacy/texture/weight), guaranteed analysis (protein/fat/fibre/ash/moisture + dynamic "others"), manufacturer info (name/contact/country/expiry). **Neither has any Buy/Skip verdict, headline, conditions, or health-nudge UI** — that's entirely new for the PRD's `Report` object (§6.3) and needs building from scratch, not adapting from here.

---

## 5. API routes (`app/api/`)

### `POST /api/validate-image` — **reuse as-is**
Sharp-based server-side QC. Accepts multipart form (`image` or `file` field). Checks: MIME in `{jpeg,jpg,png,heic,heif,webp}`, size ≤15MB, non-zero, then `sharp(buffer).metadata()` for width/height (fails if either is 0 or sharp throws). Returns `{valid, error?, dimensions?}`. Reads optional `X-Session-Id` header for dev logging only. This is exactly PRD's "Tier 0 — Client check" building block — lift directly into the new backend/FE boundary.

### `POST /api/analyze` — **drop, replace**
Validates `AnalysisPayload` shape, forwards verbatim as JSON to `N8N_WEBHOOK_URL_ANALYZE`, relays the response (or `{error}` on failure/misconfiguration). Per PRD §9.2, this is exactly the slot the new FastAPI call fills — same request validation logic is reusable, but the forward target changes from n8n webhook to `ANALYZE_API_URL`, and the response contract changes from "whatever n8n returns" to the PRD's async `{analysis_id, status}` shape.

### `GET/POST /api/session` — **partially reusable**
- `GET`: reads/creates a session-id cookie (via `lib/cookieManager.ts`), returns `{sessionId}`.
- `POST`: validates a `SessionData` payload, whitelists fields via `SESSION_PAYLOAD_KEYS`, computes an `eventType` (`session_start` > `contact_capture` > `analysis_complete` > `analysis_start`, else `null`) and **only** forwards to `N8N_WEBHOOK_URL_SESSION` on those snapshot moments (8s timeout, swallows errors). The session-cookie half is reusable as-is; the n8n-forwarding half needs a new destination (or can be dropped for MVP — PRD doesn't currently spec analytics as in-scope).

---

## 6. `lib/` utilities

- **`cloudinaryUpload.ts`** — `uploadImageToCloudinary(file, category)`: generates `imageId` (UUID) as Cloudinary `public_id`, unsigned upload via `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`, returns `{imageId, cloudinaryUrl, assetId, width, height, sizeBytes, format}`. **Reuse as-is.**
- **`imageValidation.ts`** — `validateImageClient(file)`: client-only type+size check (same limits as the server route). Exports the MIME/extension allowlists and 15MB constant. **Reuse as-is.**
- **`cookieManager.ts`** — `getSessionIdFromRequest`, `setSessionCookie`, `clearSessionCookie` (HttpOnly, 30-day, SameSite=Lax). **Reuse as-is** for whatever session/auth cookie the new login system needs.
- **`sessionManager.ts`** — `createSession`, `normalizeSessionData` (fills missing fields safely), `getSessionId` (client), `isDoNotTrack`, OS/browser/device parsing via `ua-parser-js`. **Reuse as-is** if anonymous session tracking is kept; otherwise superseded once real login/`User` table exists.
- **`extractNormalizer.ts`** — `normalizeWebhookExtract`, `normalizeN8nSuccessResponse`, `mergeN8nItems`, etc. All shaped around **n8n's specific response quirks** (snake_case/camelCase mixing, arrays of extracted_data items to merge, GA "others" nutrient parsing keeping exact string values). **Drop or heavily rewrite** — the new FastAPI service will return the PRD's own `Report`/`LabelData` shape directly, no n8n-shape guessing needed. The "others" nutrient handling logic (keep exact string value, no numeric coercion) is a reasonable pattern worth keeping conceptually.
- **`validation.ts`** — name (letters/spaces/hyphens/apostrophes only), phone (exactly 10 digits, optional), email (basic regex, optional), DOB (not future, not >25y ago). **Reuse as-is.**
- **`errorMessages.ts`** — `QC_ERROR_MESSAGES` keyed by error code (`download_failed`, `unsupported_format`, `unclear`, `lighting_issue`, `low_resolution`, `not_cat_food`, `parse_error`, `unknown_error`, `invalid_image_categories`, `missing_image_category`) + `getErrorMessage()`. **Note the duplication in §10** before reusing.
- **`design-system.ts`** — typed getters (`getButtonClasses`, `getBadgeClasses`, `getInputClasses`, `getCardClasses`, `getSelectClasses`, `getTextareaClasses`, `getCheckboxClasses`, modal/shadow/transition/spacing/border-radius/gradient getters) over `config/design-system.json`. **Reuse as-is.**

---

## 7. `hooks/useSession.ts` — **reuse as-is** (if anonymous session tracking is kept)
Client hook wrapping `sessionManager`: inits from `GET /api/session` + localStorage merge, ticks `time_on_site_sec` every 10s, debounced/immediate sync to `POST /api/session` (5-min periodic + on-action immediate), exposes `trackPageView`, `trackAction`, `trackProfileVisit`, `trackCTAClick`, `trackImageUpload`, `trackAnalysisComplete`, `captureEmail`/`capturePhone` (DNT-aware), `linkToUser` (for when real login exists), `syncNow`.

---

## 8. `constants/cat-data.ts` — **reuse as-is**
`CAT_AVATARS` (15 preset avatar image ids), `BODY_CONDITIONS` (4-point: underweight/ideal/overweight/obese, each with label+desc+image — **not** the WSAVA 9-point scale that `extract-data-model.csv`'s `body_condition_score` field expects; reconcile when wiring `Cats` table), `HEALTH_CONDITIONS` (11 display-label options ending in "Other (please describe)" — needs mapping to the PRD's normalized condition enum: `arthritis, dental, diabetes, allergies`, plus extras not in the PRD list like heart disease/hyperthyroidism/IBD/kidney/urinary that the PRD's health-nudge scope doesn't currently cover), `NEUTERING_OPTIONS`, `OUTDOOR_OPTIONS`, `ACTIVITY_LEVELS`, `COUNTRY_CODES` (30 countries, `+91` default), and a **second, slightly different** `QC_ERROR_MESSAGES` map (see §10).

---

## 9. Design system
- `config/design-system.json`: color scales (primary/secondary/emerald/gray/red + presumably blue/amber/green, truncated on read) with a custom `primary` scale where 500 and 600 are both `#6cb257` and a `dark` variant `#3d7c32`; plus component tokens for button/badge/input/card/select/textarea/checkbox/modal, shadows, transitions, spacing, border-radius, gradients.
- `components/ui/{Button,Input,Badge}.tsx` — thin wrappers over `lib/design-system.ts` getters, forwardRef, standard HTML attribute passthrough. **Reuse as-is.**
- `components/layout/Header.tsx` — fixed header, Home icon → `/now-wiser`, logo → `/now-wiser`, Cat+sparkle icon → `/profile`. `components/layout/Footer.tsx`, `AboutSection.tsx` — not read in depth, standard marketing sections.

---

## 10. Known issues / gotchas — do not carry over uncritically

1. **Debug telemetry left in `loading-page/page.tsx`**: multiple `fetch('http://127.0.0.1:7245/ingest/...')` calls (search for `#region agent log`) posting internal state to a local debug endpoint. Leftover from a past debugging session — strip entirely in the rewrite.
2. **Two different `QC_ERROR_MESSAGES` maps** with overlapping but inconsistent copy: `lib/errorMessages.ts` (more formal tone, includes `download_failed`/`invalid_image_categories`/`missing_image_category`) vs `constants/cat-data.ts` (more casual/conversational tone, includes `file_too_large`/`resolution_too_low`, missing others). `food-input/page.tsx` doesn't actually appear to use either map for its own inline errors (it builds ad hoc `Error: ${message}` strings from the API response) — `loading-page` uses `lib/errorMessages.ts`. Reconcile into one source before reuse.
3. **`app/page.tsx` looks like dead/stale code** — near-identical to `now-wiser/page.tsx` but missing `useSession` wiring, and nothing in the app links to `/` directly (Header always points home to `/now-wiser`). Confirm before porting whether `/` needs to exist at all in the new app or should just redirect to `/now-wiser`'s equivalent.
4. **`profile/page.tsx` seeds fake `SAMPLE_SCANS` in dev mode** when no real scan history exists — demo-data fallback, drop in the rewrite.
5. **`report/page.tsx` has a dead fallback path** reading `ww_detectedBrand`/`ww_detectedVariant` keys that no other file ever writes.
6. **`report/[id]/page.tsx` is 100% mock** (`buildMockDataForId`) — not wired to any real per-scan storage; don't mistake it for a working report-by-id implementation.
7. **The verification UI ("Does this look right?") on both report pages only `console.log`s** — no backend call, no persistence. If PRD wants user-verification feedback captured, this needs real wiring, not adaptation.
8. **`ExtractedData` (old) vs `LabelData`/`Report` (PRD §6)**: different shapes and field names throughout (see §3) — treat the PRD's contract as the target and old `ExtractedData` as a shape to migrate away from, not extend.
9. **Body condition scale mismatch**: old code's 4-point `BODY_CONDITIONS` vs `extract-data-model.csv`'s WSAVA 9-point `body_condition_score` — needs an explicit mapping or a UI change if the 9-point scale is required.
10. **Health condition list mismatch**: old code's 11 free-text-label conditions vs PRD's 4 normalized conditions with health-nudge copy (`arthritis, dental, diabetes, allergies`) — decide whether to keep the wider old list (and only nudge on the 4 PRD covers) or narrow the UI to match PRD scope.
11. **Async/polling pattern is same-tab-only**: the current "fire fetch, don't await, poll localStorage for the same key from the same tab" pattern silently breaks on tab close/refresh or a second device. The PRD's real `GET /analyze/{id}` polling (§9.2) fixes this — don't port the localStorage-polling mechanism itself, only the staged-progress *UI* built on top of it.

---

## 11. Reuse map — quick reference for the build

| Reuse as-is | Rewrite/adapt | Drop |
|---|---|---|
| `lib/cloudinaryUpload.ts`, `lib/imageValidation.ts`, `lib/cookieManager.ts`, `lib/sessionManager.ts`, `lib/validation.ts`, `lib/design-system.ts` | `app/api/validate-image` logic (move/reuse under new BFF), `app/api/session` (keep cookie half, replace n8n forward), `hooks/useSession.ts` (keep if anonymous tracking retained), `constants/cat-data.ts` (reuse content, reconcile enums against PRD/data-model per §10.9–10.10), `lib/errorMessages.ts` (reconcile with the other QC message map first) | `app/api/analyze` (n8n proxy logic), `lib/extractNormalizer.ts` (n8n-shape-specific), all mock-data fallbacks (`SAMPLE_SCANS`, `buildMockDataForId`, `ww_detectedBrand` fallback), debug telemetry calls in `loading-page`, the same-tab localStorage-polling mechanism (keep only the staged-progress UI it drives) |
| `components/ui/*`, `components/layout/Header.tsx`/`Footer.tsx`/`AboutSection.tsx`, `config/design-system.json` | `app/profile/page.tsx`, `app/food-input/page.tsx`, `app/loading-page/page.tsx`, `app/report/page.tsx`, `app/report/[id]/page.tsx` — all are monoliths to split into smaller components and rewire to the real FastAPI contract; keep their validation rules, required-field logic, and UX copy as reference, not their storage/data-fetching internals | `app/page.tsx` if confirmed dead (see §10.3) |
| `types/analysis.ts`'s `AnalysisPayload`/`ImageData` (matches PRD §9.2 contract closely) | `types/index.ts`'s `ExtractedData`, `CatProfile`, `ProfileUser` — align field names/enums to PRD §6 / `extract-data-model.csv` before reusing | `types/analysis.ts`'s n8n-specific response types (`AnalyzeSuccessResponse`, `AnalyzeErrorResponse`, `isN8nErrorArray`, etc.) |
