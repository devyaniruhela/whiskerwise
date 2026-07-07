# CLAUDE.md — Wiser project

_Last updated: 06 Jul 2026_

**Session rules (Claude):**
1. Read this file at the start of every session; skim `reference.md` for the file map.
2. **Bump the "Last updated" date above after any edit to this file.**
3. Log every task add/change/completion to `task-manager.md` **without asking**. This file keeps only the *broad* rollup. update that when relevant.
4. Never assert a nutrition standard or ingredient judgment without a source in `kb/SOURCES.md`.

---

## What Wiser is

A web tool for Indian cat parents: photograph a cat-food pack (front + back) → get a plain-language **Buy / Skip (with conditions)** verdict, grounded in standards, optionally personalised to one or more cats. Positioning: "Trust us to help you make better decisions, faster."

**Architecture (3 layers, LLMs only at the edges):** Gemini extracts label → **deterministic rules engine** scores against the KB → Claude writes the report. Tiered image-QC gate up front. Full detail in `Wiser_PRD_MVP.md` §4/§9.

**Tech stack:** Next.js 15 / React 19 / TS / Tailwind front end (reused from `past work/`, talks to Cloudinary + a BFF route); **Python + FastAPI** analysis service (to build); Gemini (extraction + QC), Claude API (Layer 3); Cloudinary (images); Postgres (planned). Standards priority: **IS-11968 → FEDIAF → AAFCO, WSAVA governing.**

## How to build (for Claude Code)

Build **in place**: create the new app under `01-wiser/app/` — `app/frontend/` (Next.js) + `app/backend/` (FastAPI). Own git repo at `01-wiser/`. **Never modify `past work/`**; lift from it by copying.

- **`kb/`** → runtime data. Backend **reads it in place** — the single source of truth. Never hard-code or duplicate its values.
- **`00-cat-care-research/`** → evidence only, already distilled into `kb/`. The running app never reads it. Sample packs (`cat-food/`) are for tests only.
- **`past work/`** → read-only reference. **Copy out** chosen assets (design system, UI primitives, Cloudinary upload, image validation, type shapes) into `app/frontend/`; after copying they belong to the new app.
- **Planning docs** (this file, PRD, context, reference, task-manager) → the spec. Read them, don't bundle them.

One source of truth per thing · new code only under `app/` · the sole intentional duplication is lifting FE assets from `past work/`.

## File guide — what to read / write where

| File                               | Read it for                                                 | Write to it when                                   |
| ---------------------------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| `CLAUDE.md` (this)                 | Session primer, rules, broad status                         | Broad workstream status changes; bump date         |
| `reference.md`                     | Folder/file map, when-to-refer, read-in-depth log           | Structure changes; after reading any file in depth |
| `context.md`                       | Project background, old-code assessment, decisions, open Qs | A decision or major direction changes              |
| `Wiser_PRD_MVP.md`                 | Scope, flow, data model, FE⇄BE contract                     | Spec changes                                       |
| `task-manager.md`                  | **All** detailed tasks/blockers/decisions                   | Every task add/change/completion (no need to ask)  |
| `kb/` + `kb/SOURCES.md`            | Thresholds, life-stage, ingredient judgments + provenance; verdict roll-up in `kb/06_verdict_logic.md`; combining/splitting logic in `kb/ingredient-master-rules.md` | KB edits; keep SOURCES in lockstep                 |
| `00-cat-care-research/`            | Underlying evidence (cite by name)                          | Never write here — read-only corpus                |
| `past work/wiser-by-whisker-wise/` | Reusable FE assets, old routes                              | Don't build on it; lift assets only                |

## Reference guide (what to open before building)

- **Scope / decisions / data model** → `Wiser_PRD_MVP.md`, then `context.md`.
- **Extraction fields** → `…extract-data-model.csv` + `00-cat-care-research/cat-food/cat_food_ingredients.csv`.
- **Nutrition rule / threshold / ingredient** → `kb/` first, source via `kb/SOURCES.md`; underlying docs in `00-cat-care-research/cat-nutrition/`.
- **Condition logic** → `00-cat-care-research/therapeutic/` and `allergies/`.
- **UI / brand** → `web-flow/`, `logo/`, `wiser_services_*.html`.

**KB source discipline:** refer to `kb/SOURCES.md` before citing any standard. **Whenever a KB value is added and mapped to a source, add/update that source's row in `kb/SOURCES.md`** (Status: added/pending). When editing `kb/03_ingredients_master.csv`, follow `kb/ingredient-master-rules.md` for combining/splitting.

---

## Build-readiness — broad rollup

Broad workstreams only. Detailed items, blockers and dates → **`task-manager.md`**.

| Workstream | Covers | Owner | Status | Link |
|---|---|---|---|---|
| Spec | Scope & MVP boundaries, 3-layer flow, FE⇄BE contract, out-of-scope | Claude | done-verify | `Wiser_PRD_MVP.md` |
| Knowledge base | Life-stage, nutrient thresholds, ingredient master, sources | Claude/D | wip | `kb/` |
| Backend build | FastAPI, QC + Gemini extract, rules engine, Claude Layer 3, persistence | Claude | not-started | PRD §9 |
| Accounts & infra | Anthropic + Gemini keys, FastAPI + DB hosting, Cloudinary | D | blocked | `task-manager.md` |
| Data & testing | Sample corpus, extraction bake-off, golden set, eval harness | Claude/D | wip | `task-manager.md` |
| Frontend | Reuse design system, multi-cat, login (OTP), report + polling | Claude | wip | `past work/` |

_Verdict roll-up logic deferred by D. See `task-manager.md` for everything else._
