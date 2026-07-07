# Wiser — Folder & File Reference

_Last updated: 07 Jul 2026 (v2)_

Map of what lives where, and **when to refer to it**. Also a running log of files already read in depth, so we don't re-open them. Update whenever structure changes or a file is read closely.

---

## When to refer (priority guide)

- **Building / deciding scope** → `Wiser_PRD_MVP.md`, then `context.md`.
- **What's left to do / status** → `CLAUDE.md` (broad rollup). `task-manager.md` (detailed); 
- **Data model for all extractions** → `Whisker Wise…extract-data-model.csv` (spec) 
- **Pet food pack extracted data** →  `00-cat-care-research/cat-food/cat_food_ingredients.csv` (real food extracts).
- **Any nutrition threshold / rule / ingredient judgment** → `kb/` first (already distilled), if needed the underlying source via `kb/SOURCES.md`. Never assert a standard without a source there.
- **Condition-specific logic** → `00-cat-care-research/therapeutic/` and `allergies/`.
- **UI / brand** → `web-flow/`, `logo/`, `wiser_services_*.html`.
- **Old code (reference only, don't build on)** → `past work/wiser-by-whisker-wise/`.

## `01-wiser/` — active project

| Path                                                   | What it is                                                                                                                  |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                                            | Session primer: brief context, tech stack, folder guide, broad task rollup. Read at the start of every session or new chat. |
| `context.md`                                           | Project context — what Wiser is, 3-layer architecture, old-codebase assessment, decisions, open Qs.                         |
| `Wiser_PRD_MVP.md`                                     | The MVP PRD — scope, flow, data model, API/FE connection, out-of-scope. Source of truth for what to build.                  |
| `task-manager.md`                                      | Detailed task log (theme·item·owner·status·comment·date). Write on every add/change.                                        |
| `reference.md`                                         | This file — folder/file map + when-to-refer + read-in-depth log.                                                            |
| `kb/`                                                  | **Layer-2 knowledge base** (see below).                                                                                     |
| `Whisker Wise…extract-data-model.csv`                  | Field-by-field spec for extraction tables (Users, OTP, Cats, Images, Extracts raw/processed, product & ingredient dims).    |
| `logo/`, `web-flow/`, `wiser_services_*.html`, `*.png` | Brand assets, UX flow screenshots, service mockups.                                                                         |
| `past work/wiser-by-whisker-wise/`                     | Parked Next.js FE + n8n webhook proxy. Reuse assets, don't build on.                                                        |
| `old-code-context.md`                                  | Full read-through takeaways of `past work/wiser-by-whisker-wise/` — per-file reuse/rewrite/drop map, gotchas. Read this instead of re-opening that folder. |

## `01-wiser/kb/` — knowledge base (Layer-2 inputs)

| File                         | What it is                                                                                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `01_lifestage.csv`           | Age→life-stage map + nutrient tier + senior/medical handling.                                                                                                  |
| `02_nutrient_thresholds.csv` | Cat nutrient minimums, kitten/adult, DM basis, IS-11968 applied + FEDIAF/AAFCO cross-columns.                                                                  |
| `03_ingredients_master.csv`  | Canonical ingredients (49 rows): origin, class, category, purpose, evaluation, flags, function/concern/counterpoint, source. similar ingredients are combined. |
| `05_health_nudges.md`        | Per-condition non-prescriptive nudge copy (10 dropdown conditions + 1 bonus). v1 draft by Claude, 5 rows `NEEDS_SOURCE`, awaiting D's edit. |
| `06_verdict_logic.md`        | Buy / Buy-with-conditions / Skip / vet_diet decision spec (Layer-2 roll-up). v2 — incl. therapeutic track. Tunable. |
| `ingredient-master-rules.md` | Combining/splitting rules + column definitions governing `03`. Read before editing it. |
| `SOURCES.md`                 | Provenance table — only files used as tool sources (added/pending status).                                                                                     |


## `00-cat-care-research/` — research corpus (source knowledge base)

| Path                                                                                                                                                                | What it is                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cat-nutrition/`                                                                                                                                                    | Standards: `IS11968-2019.pdf`, `FEDIAF-…2025…pdf`, `AAFCO_Nutrient_Profiles…pdf`, `AAFCO_Ingredients_List.pdf`, WSAVA toolkit, Cornell feeding, JFMS allergy paper. **Primary for scoring.** |
| `cat-food/cat_food_ingredients.csv`                                                                                                                                 | Structured extraction of real labels — sample data for extraction/assessment.                                                                                                                |
| `cat-food/Cat-food-pics/`                                                                                                                                           | Front/back label photos — raw input examples for Layer-1 vision.                                                                                                                             |
| `therapeutic/`                                                                                                                                                      | Cornell + FEDIAF condition guides (CKD, diabetes, FLUTD, obesity, senior).                                                                                                                   |
| `allergies/`                                                                                                                                                        | Cornell food-allergy + CAVD diet-trial handouts.                                                                                                                                             |
| `feline-VMA-cat-care/`                                                                                                                                              | Feline-VMA brochures (life stages, feeding, dental, senior…).                                                                                                                                |
| `environment-behaviour/`                                                                                                                                            | ISFM house-soiling guidelines.                                                                                                                                                               |
| `650285654-Nutrient-Requirements-of-Dogs-and-Cats.pdf`                                                                                                              | NRC nutrient-requirements book — deep science.                                                                                                                                               |
| `research-paper-combined-ageing-dogs-cats--PMC.pdf`                                                                                                                 | Ageing cats/dogs review — senior evidence, links onward sources.                                                                                                                             |
| `FSSAI_Comp_Labelling-Display_Version-VIII_09_09_2025.pdf`                                                                                                          | Indian labelling requirements (upcoming: claims validation).                                                                                                                                 |
| `5-nutrition-myth-infographics.pdf`, `Nutrition-Label-USA/EU-16_9.pdf`, `Principles-of-Wellness-FINAL.pdf`, `Home_Dental_Care_for_Cats_AVDC.pdf`, `fecal-chart.pdf` | Education/label-anatomy/wellness references.                                                                                                                                                 |

---

## Read-in-depth log (don't re-open these — summary captured)

| File | Read | Key takeaways captured |
|------|------|------------------------|
| `cat-nutrition/IS11968-2019.pdf` | Tbl 2 pp.8–9, defs pp.3–4 | Full cat nutrient minimums by kitten/adult, **dry-matter basis**; protein 30/26, fat 9, taurine 0.10%, Ca 1.0/0.6, P 0.8/0.5; contaminant maxes (Tbl 3). Life stages = kitten (6wk–12mo) + adult only. → `kb/02`, `kb/01` |
| `cat-nutrition/FEDIAF-…2025…pdf` | Tbl III-4 p.18, III-5 p.19 | Cat levels per 100g DM; taurine dry 0.10 / wet 0.20; protein adult 25 / growth 28–30; vitamins A/D/E. → `kb/02` |
| `cat-nutrition/AAFCO_Nutrient_Profiles…pdf` | Cat table pp.13–14 | Growth/maintenance minerals & vitamins; taurine dry 0.10 / canned 0.20. → `kb/02` |
| `cat-food/cat_food_ingredients.csv` | Full | 55 extracted packs; processed `ingredients` col → 164 unique ingredient tokens (bootstrapped `kb/03`). Two-table raw+processed shape. |
| `Whisker Wise…extract-data-model.csv` | Full | Tables: Users, OTP, Cats (multi), Images (qc_* fields), Extracts raw/processed, product & ingredient dims. Basis of PRD §6. |
| `past work/…/app/api/analyze/route.ts` | Full | FE posts JSON of Cloudinary URLs → Next route → external engine (n8n). FastAPI drops into this slot (PRD §9.2). |
| `past work/wiser-by-whisker-wise/` (full repo: all pages, api routes, lib, hooks, types, constants, config) | Full | Per-file reuse/rewrite/drop map, page-by-page flow, type shapes, known gotchas (dead code, debug telemetry, mock fallbacks, enum mismatches) → `old-code-context.md`. Don't re-read this folder; read that doc instead. |
