# Wiser — Project Context

_Last updated: 07 Jul 2026_

What Wiser is, what we already have, and what we want to build. No deliberation history — current state only.

## What Wiser is

A web tool for Indian cat parents: photograph a cat-food pack (front + back) → get a plain-language **Buy / Skip (with conditions)** verdict, grounded in standards, optionally personalised to one or more cats.

## What we already have

- **Old code** — `past work/wiser-by-whisker-wise/` (parked Next.js 15 FE + n8n webhook proxy). **Reuse:** design system, UI primitives, Cloudinary upload, client image validation, session tracking, `CatProfile`/`ExtractedData` types, and the profile/report/food-input pages (monoliths, to be rewritten in pieces). **Don't reuse:** the n8n analyze proxy and extract-normalizer; there is no rules engine, KB, or Claude layer in it.
- **Research corpus** — `00-cat-care-research/`: standards (IS-11968, FEDIAF 2025, AAFCO profiles + ingredient list, WSAVA, NRC), therapeutic/allergy/senior references, and 30+ sample packs (front/back photos + an extracted CSV).
- **Data-model spec** — `Whisker Wise…extract-data-model.csv`: Users, OTP, Cats (multi), Images (with QC fields), Extracts raw/processed, product & ingredient dims.
- **Knowledge base** — `kb/`: life-stage, nutrient thresholds (IS-11968 applied), ingredient master (49 rows), `SOURCES.md`, `ingredient-master-rules.md`.

## What we want to build

The **3-layer tool**: Gemini extracts the label → **deterministic rules engine** scores it against `kb/` → Claude writes the report; a tiered image-QC gate sits up front. MVP output is a **Buy / Buy-with-conditions / Skip** verdict personalised to the selected cat(s), across four judgments — adequacy (complete vs complementary), life-stage suitability, guaranteed-analysis adequacy, ingredient quality — plus non-prescriptive health nudges. Delivered as a **FastAPI** service behind the existing Next.js BFF (async + polling), with Cloudinary for images and Postgres for persistence. Full spec in `Wiser_PRD_MVP.md`.

## Locked decisions

- Standards priority **IS-11968 → FEDIAF → AAFCO, WSAVA governing**.
- **Layer 2 is deterministic** (code over structured KB files) — LLMs only at the edges. No RAG for MVP.
- **Extraction = Gemini** (kept from prior work); **Layer 3 (report) also runs on Gemini for MVP** — the whole pipeline uses the one Gemini key; Claude is an optional Layer-3 upgrade later, behind a vendor-agnostic interface.
- **Therapeutic/vet diets** get a `vet_diet` guidance track (state pack purpose → match to each cat's conditions → always route to vet), **not** a Buy/Skip. See `kb/06_verdict_logic.md` §3.
- **Build in place** under `01-wiser/app/` (`frontend/` + `backend/`); the backend **reads `kb/` in place** as the single source of truth. Never modify `past work/` — lift FE assets by copying.
- **Multi-cat** = one food verdict + per-cat callouts.
- **Taurine** applied at IS 0.10%; FEDIAF 0.20%-wet is a formulation differentiator target, not the pass/fail line.
- **Senior** = management-only (adult tier + cited callouts).
- **Build the backend fresh**; lift FE assets from the old repo, don't build on it.
- **Body condition: 9-point → 4-point mapping (D, 07 Jul 2026).** The data model's canonical field is the WSAVA 9-point `body_condition_score`; the cat-profile form shows a simpler 4-bucket picker mapped from it: **1–3 "A bit skinny" · 4–5 "Just right" · 6–7 "A bit chonky" · 8–9 "Overweight."** This is a **display-only mapping** — no Layer-2 rule currently consumes body condition (MVP has no calorie/portion scoring), so the mapping lives in the FE (`constants/cat-data.ts` successor in `app/frontend/`), not in `kb/`. Revisit if a future rule (e.g. weight-management nudge) needs to read the 9-point value directly.

## Open decisions (D)

- **Sign off the verdict roll-up** — `kb/06_verdict_logic.md` v2 is drafted (incl. D's redlines + therapeutic track); awaiting approval. No longer deferred.
- **Health-condition nudge copy** — v1 drafted by Claude in `kb/05_health_nudges.md` for D to edit; 5 of 11 conditions still `NEEDS_SOURCE` (arthritis, dental, heart disease/HCM, hyperthyroidism, GI/IBD).
- **Health-condition list scope** — old FE/current dropdown has 11 conditions; decide whether to keep all 11 or narrow to a smaller covered set.
- **KB polish** — source-fill the `NEEDS_SOURCE`/`PARTIAL` ingredient rows; ingredient verification (deprioritized).
- **Go-live only** (not build blockers): FastAPI hosting + managed Postgres. Dev runs on localhost + SQLite.

_Resolved: Gemini key (in env) · Anthropic key not needed for MVP (Layer 3 on Gemini) · Cloudinary (exists)._
