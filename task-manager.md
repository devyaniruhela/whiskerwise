# Wiser — Task Manager

_Last updated: 07 Jul 2026_

**How to use (for Claude & D):** this is the single detailed to-do log for the project. Write to it **without asking** — every time an item is added, changes state (added → wip → blocked → completed), or is verified. `CLAUDE.md` holds only the *broad* rollup; the detail lives here.

**Status:** `not-started` · `wip` · `blocked` · `done` · `done-verify` (done by Claude, awaiting D's check) · `deferred`
**Owner:** D · Claude

| Theme | Item | Owner | Status | Comment | Date updated |
|---|---|---|---|---|---|
| Spec | PRD (scope, 3-layer flow, FE⇄BE, data model) | Claude | done-verify | `Wiser_PRD_MVP.md` | 06 Jul 2026 |
| Spec | Verdict roll-up logic (KB `06`) | Claude | done-verify | `kb/06_verdict_logic.md` v2 (D redlines: skip rules, complementary flip, red-flag tiers); awaiting sign-off | 06 Jul 2026 |
| Spec | Therapeutic handling → `vet_diet` track | Claude | done-verify | condition-matched + vet-routed, not Buy/Skip; verdict §3 + PRD §3/§11 | 06 Jul 2026 |
| Spec | Layer 3 vendor = Gemini for MVP | D | done | whole pipeline on one Gemini key; Claude optional upgrade | 06 Jul 2026 |
| Spec | Health-condition nudge copy (non-prescriptive) | Claude | done-verify | v1 drafted in `kb/05_health_nudges.md`: §1 checklist (10 conditions, 5 still `NEEDS_SOURCE`), §2 body-condition-triggered (`obesity_weight` sourced, `underweight_weight` `NEEDS_SOURCE`) — gradual calorie change + dry-food calorie-density framing per D; awaiting D's edit | 07 Jul 2026 |
| KB | Life-stage KB | Claude | done | `kb/01_lifestage.csv` — verified by D | 06 Jul 2026 |
| KB | Nutrient thresholds KB | Claude | done | `kb/02_nutrient_thresholds.csv` — verified by D | 06 Jul 2026 |
| KB | Ingredient master KB | Claude | done-verify | 49 rows; **verification deprioritized by D** — revisit later | 06 Jul 2026 |
| KB | Ingredient combining/splitting rules doc | Claude | done | `kb/ingredient-master-rules.md` | 06 Jul 2026 |
| KB | Taurine wet-vs-dry decision | D | done | Apply IS 0.10%; FEDIAF 0.20% wet = differentiator target | 06 Jul 2026 |
| KB | Ingredient grouping review (umbrella safety) | Claude | done-verify | Splits applied; **verification deprioritized by D** | 06 Jul 2026 |
| KB | Ca:P ratio source | D | done | D added FEDIAF definition + page & table | 06 Jul 2026 |
| KB | Source-fill NEEDS_SOURCE/PARTIAL ingredient rows | D | wip | Colours, preservatives, carrageenan, probiotics, enzymes, joint, produce | 06 Jul 2026 |
| KB | Senior deepening from NRC + ageing review | Claude | not-started | Mine `NRC` + `research-paper-combined-ageing...` | 06 Jul 2026 |
| Backend | FastAPI skeleton (`/analyze` async, `/qc`) | Claude | not-started | PRD §9.2 contract | 06 Jul 2026 |
| Backend | Tier-0 client image validation | Claude | reuse | Lift `validate-image`+sharp from old repo | 06 Jul 2026 |
| Backend | Tier-1 QC classify (Gemini) prompt+schema | Claude | not-started | writes `Images.qc_*` | 06 Jul 2026 |
| Backend | Layer 1 extraction (Gemini) prompt+schema | Claude | not-started | → `Extracts raw`→`processed`; old prompt was in n8n | 06 Jul 2026 |
| Backend | Ingredient normalize + alias lookup | Claude | not-started | strip %/strain-codes, split `+`/`:` before KB match | 06 Jul 2026 |
| Backend | Layer 2 rules engine (deterministic) | Claude | not-started | **Core build**; loads `kb/*` | 06 Jul 2026 |
| Backend | Layer 3 explanation (LLM) template | Claude | not-started | Gemini for MVP behind vendor-agnostic interface (Claude-swappable); locked tone, cites sources, no diagnosis | 06 Jul 2026 |
| Backend | Persistence (Users/Cats/Images/Extracts) | Claude/D | blocked | schema in `extract-data-model.csv`; DB not chosen | 06 Jul 2026 |
| Infra | Anthropic API key (Layer 3) | D | deferred | **not a blocker** — Layer 3 runs on Gemini for MVP; Claude an optional upgrade later | 06 Jul 2026 |
| Infra | Gemini API key (Layer 1 + QC) | D | done | in env file | 06 Jul 2026 |
| Infra | Cloudinary account + unsigned preset | D | done | exists | 06 Jul 2026 |
| Infra | FastAPI hosting | D | not-started | **not a start-blocker** — localhost for dev; Render/Railway to go live | 06 Jul 2026 |
| Infra | DB | D | not-started | **not a start-blocker** — SQLite for dev; managed Postgres (Neon/Supabase) to go live | 06 Jul 2026 |
| Data/Test | Sample pack corpus | D | done | 30+ packs in `00-cat-care-research/cat-food/` | 06 Jul 2026 |
| Data/Test | Extraction/QC bake-off on samples | Claude | not-started | validate Gemini before locking prompts | 06 Jul 2026 |
| Data/Test | Golden dataset (verdict labels) | D/Claude | not-started | needed to tune §7.2 | 06 Jul 2026 |
| Data/Test | Verdict eval harness | Claude | not-started | reproducibility checks | 06 Jul 2026 |
| FE | Design system + UI primitives | Claude | reuse | lift from old repo | 06 Jul 2026 |
| FE | Upload + profile + report shell | Claude | reuse | reuse; rewrite monolith pages | 06 Jul 2026 |
| FE | Multi-cat select | Claude | wip | profile modal exists; wire array of `cat_id` | 06 Jul 2026 |
| FE | Login (phone/OTP) | Claude | not-started | `User`/`OTP` tables spec'd | 06 Jul 2026 |
| FE | Report + polling UI | Claude | not-started | wire to `/report/[id]` + async status | 06 Jul 2026 |
| Housekeeping | Rename research files/folders (spaces→hyphens) | Claude | done | all spaces → hyphens | 06 Jul 2026 |
| Housekeeping | Delete ACTION_NEEDED.md, fold into task-manager | Claude | done | deleted; no dangling links | 06 Jul 2026 |
| Housekeeping | Doc system (CLAUDE/context/reference/task-manager/SOURCES) | Claude | done | restructured per D's spec; context.md refreshed | 06 Jul 2026 |
| Housekeeping | SOURCES status column + update rule | Claude | done | added/pending status; update rule in CLAUDE.md | 06 Jul 2026 |
| Housekeeping | "How to build" layout + in-place decision | Claude | done | in `CLAUDE.md`; build under `01-wiser/app/`, KB read in place | 06 Jul 2026 |
| Handover | Claude Code kickoff (prompt, slice order, agent strategy) | D | not-started | optional `HANDOFF.md`; guidance given in chat | 06 Jul 2026 |
| Housekeeping | Full read-through of `past work/wiser-by-whisker-wise/` | Claude | done | Captured in new `old-code-context.md` — reuse/rewrite/drop map per file, so folder doesn't need re-reading | 07 Jul 2026 |
| FE | Body-condition scale: reconcile old 4-point UI vs data-model's WSAVA 9-point `body_condition_score` | D | done | Resolved: keep WSAVA 9-point as canonical `body_condition_score`; 4-bucket picker is a **display-only** mapping (1–3 skinny · 4–5 just right · 6–7 chonky · 8–9 overweight), lives in FE constants, no Layer-2 rule reads it. Locked in `context.md` | 07 Jul 2026 |
| Spec | Health-condition list scope: old FE has 11 free-text conditions | D | done | Resolved: keep all 11 (confirmed against `web-flow/ww-form-disease1&2.png`); nudge copy drafted for 10 + 1 bonus in `kb/05_health_nudges.md` | 07 Jul 2026 |
| Housekeeping | Reconcile duplicate QC error-message maps (`lib/errorMessages.ts` vs `constants/cat-data.ts`) before FE reuse | Claude | not-started | Different tone/coverage; pick one before porting food-input/loading-page. See `old-code-context.md` §10.2 | 07 Jul 2026 |
| Housekeeping | Confirm `app/page.tsx` is dead code before porting (Header always links home to `/now-wiser`) | Claude | not-started | If confirmed dead, don't port it; if intentional, wire `useSession` before reuse. See `old-code-context.md` §10.3 | 07 Jul 2026 |
| FE | Strip debug telemetry (`#region agent log` fetches to `127.0.0.1:7245`) from `loading-page/page.tsx` when porting | Claude | not-started | Leftover from a past debugging session, not a feature. See `old-code-context.md` §10.1 | 07 Jul 2026 |
| FE | Decide fate of report "Does this look right?" verification UI (currently `console.log`-only on both old report pages) | D | not-started | Keep as real user-verification feedback wired to backend, or drop for MVP — not currently in PRD scope. See `old-code-context.md` §10.7 | 07 Jul 2026 |
