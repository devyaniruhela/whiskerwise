# Wiser — Cat Food Label Analyzer
### Product Requirements Document (MVP)

**Owner:** (D)
**Date:** 5 July 2026
**Status:** Draft for build
**One-line:** A user photographs a cat food pack; Wiser reads the label, checks it against established feline nutrition standards, and returns a plain-language **Buy / Skip** verdict personalized to their cat.

---

## 0. How to read this doc

This PRD is written so an engineer — or Claude via the API — can build the MVP with minimal further clarification. Where a decision was made for you, it's marked **[Decision]** with the reasoning. Where you still need to supply something, it's marked **[You provide]**. Genuine unknowns are collected in §12 Open Questions.

Scope discipline is the point. Everything here is deliberately narrow. Anything tempting but out of scope is parked in §11 explicitly so it doesn't creep in.

---

## 1. Problem & goal

**Problem.** Cat owners can't tell from a pack whether a food is actually appropriate for their cat. Labels mix regulatory language ("complete and balanced"), marketing ("with real chicken"), and a guaranteed analysis table that most people can't interpret. The result is confusion and second-guessing at the shelf.

**Goal (MVP).** Turn a photo of the front and back of a pack into a fast, trustworthy, non-specialist verdict: should you buy this, and under what conditions. Ground every claim in recognized standards — India-first: **IS-11968 → FEDIAF → AAFCO, WSAVA governing** (§7) — rather than opinion.

**What success looks like (MVP).**
- A user completes scan → report in under ~60 seconds of wait.
- The verdict is defensible: every Buy/Skip call traces to a named rule and, where relevant, a named standard.
- The system reliably distinguishes the four MVP judgments (see §5) and never wanders into therapeutic/veterinary advice.

**Non-goals.** Diagnosing conditions, recommending specific brands, calculating precise daily feeding grams, or giving prescription-diet guidance. See §11.

---

## 2. Target user & primary use case

**User.** A general cat owner standing in a store aisle or holding a can at home, non-expert, wants a quick sanity check.

**Primary use case.** "I have this food in front of me. Is it a good choice for my cat, yes or no, and why?"

**Personalization.** Optional. The user may add a cat profile (name, age, body condition, known conditions). If provided, it sharpens the verdict (e.g., life-stage suitability, a gentle flag for a listed condition). If omitted, Wiser returns a general adult-cat verdict and says so.

---

## 3. Scope of the MVP

**In scope**
- Single food analysis per run (one product, front + back photos).
- Wet and dry cat food. **[Decision]** Support both — the rules below are format-aware (moisture handling differs) but otherwise identical. This adds little complexity and doubles coverage.
- Personalization against **selected cats**. (helps with multi-cats)
- Four recommendation categories (§5).
- A single top-line **Buy / Skip (with conditions)** verdict plus short reasons, with an optional "why" expansion.

**Out of scope for MVP** — see §11 for the full list. Highlights: therapeutic/prescription diets, multi-cat comparison in one report, brand recommendations, exact portioning, non-cat species, ingredient-level allergen diagnosis.

**Health conditions in MVP.** **[Decision]** Wiser does **not** give therapeutic recommendations or validate a food's medical claim. If the user's cat profile lists a condition (arthritis, dental disease, diabetes, food allergies/sensitivities), the report surfaces a **non-prescriptive nudge** — e.g., *"Toto has a diabetes flag. Carbohydrate load matters for diabetic cats; talk to your vet about a suitable diet. This analysis does not account for that condition."*

**Therapeutic/vet diets *(updated)*.** A food marked as a therapeutic/vet diet gets its own **`vet_diet` guidance track** — *not* a Buy/Skip (these diets deliberately deviate from general minimums). Wiser states what the pack treats, matches it to each cat's **conditions** (suitable-if-prescribed for a cat with the matching condition; hold-off for a cat without it), and always routes the user to their vet. It never confirms the food treats the condition. See `kb/06_verdict_logic.md` §3.

---

## 4. End-to-end flow
![[Screenshot 2026-07-05 at 6.26.24 PM.png]]

**[Architecture — locked]** Wiser is a **3-layer pipeline with deliberately separated concerns**, fronted by a tiered image-quality gate. LLMs sit only at the edges (unstructured ↔ structured); the reasoning in the middle is **deterministic code**, so every verdict is auditable and reproducible. This supersedes the earlier "collapse into Claude calls" idea — separation is the point, not a cost to minimize.

```
LOGIN → INPUT → [Tier 0 client check] → [store · Cloudinary] → [Tier 1 QC gate · Gemini]
   → [Layer 1 EXTRACT · Gemini] → [Layer 2 ASSESS · rules+KB] → [Layer 3 EXPLAIN · Claude] → REPORT
                                            └── QC fail → prompt re-upload (just the bad image) ──┘
```

**Login.** Phone + OTP (existing `User` / `OTP` tables). Gates the flow; `num_scan_attempts` / `num_scans_success` counters live on `User`.

**Input.** Name, optional **multi-cat select** (add/select as many cats as they want — `Cats` table), then front + back photos. Because multi-cat households buy one food for all cats, a scan links to an **array of `cat_id`s** (already modelled in `Extracts raw.cat_id`); Layer 2 runs per selected cat and Layer 3 writes one report with per-cat callouts.

**Tier 0 — Client check (free, instant).** Format, size ≤15 MB, dimensions, blur — reuse the existing `/api/validate-image` (`sharp`). Rejects broken files before any upload or AI cost.

**Store — Cloudinary (async, non-blocking).** Browser uploads **directly** to Cloudinary via the existing unsigned preset (UUID `public_id`); a row is created in `Images` (`status=uploaded`, `original_fields_json` from Cloudinary). The user is never blocked waiting on our AI — QC runs server-side on the returned URL.

**Tier 1 — QC gate (cheap Gemini Flash *classify*, per image).** Runs right after each upload on the Cloudinary URL. Tiny output — `{is_cat_food_pack, panel: front|back|unknown, product_context, legible, qc_confidence, qc_fail_reason[]}` (~50 tokens vs ~1,500 for extraction). Writes `Images.qc_passed / qc_fail_reason / qc_confidence / category / status`. **On fail** (not a pack / wrong side / illegible / glare) → prompt re-upload of *only* the bad image, in seconds, before the expensive step. Proceeds only when both images pass and form a front+back pair.

**Layer 1 — Extract (Gemini Flash, the expensive paired call).** Input: both QC-passed images. Output lands in two tables: **`Extracts raw`** (as-detected, per pack pair) → normalized into **`Extracts (processed)`** (cleaned/derived: brand, variant, `lifestage`, `type` wet/dry/treat, `adequacy` complete/complementary, `ingredients[]`, `additives[]`, `guaranteed_analysis{}`, `met_energy_100g`, `taurine_added`, `confidence`, `extract_note`). Handles translation (`detected_language`, `translated_flag`) — imported Indian-market packs are often multilingual. Low confidence or a missing required field surfaces uncertainty and can route back to re-upload.

**Layer 2 — Assess (deterministic rules engine + KB) — the piece to build.** Inputs: `Extracts (processed)` + selected `Cats` + the KB (§7). Runs the four MVP checks (§5), each tracing to a rule and a named source per the standards priority (§7). Produces a structured assessment object: verdict + per-category results + citations + per-cat callouts. No LLM here.

**Layer 3 — Explain (Claude API, locked template).** Input: **Layer 2's structured output only** (not the raw label). Claude writes the consumer-facing Buy/Skip report from a tone-locked template — cites sources, surfaces uncertainty, shows both interpretations for borderline ingredients, never says "bad food," never diagnoses. Optional detailed "why" expansion.

**Report.** Buy / Buy-with-conditions / Skip headline + reasons + per-cat callouts + collapsed rationale + citations. Increments `User.num_scans_success`.

See §9 for how the front end connects to this pipeline.

---

## 5. The four MVP recommendation categories

These are the only judgments the MVP makes. Each is generic and non-specialized.

**5.1 Complete vs. complementary.** Does the pack declare itself a *complete* food (nutritionally sufficient as a sole diet) or *complementary* (a topper/treat/part-diet)? This is the single most consequential label distinction. Drives the strongest conditions on the verdict (a complementary food is not a "skip" — but it *is* a "don't feed as the only meal").

**5.2 Ingredient quality (surface-level).** Named vs. generic protein sources ("chicken" vs. "meat and animal derivatives"), presence of a clearly identified primary protein, obvious fillers, and artificial colors/flavors. **[Decision]** This is a *marketing-vs-substance* signal, not a nutritional verdict on its own. It contributes flags, not a pass/fail, to avoid overclaiming. Also include marketing tactics used like naming water heavy ingredients first, calling out what's regulated vs what's marketing. NAME what is being identified before using it as positive/negative.

**5.3 Life-stage suitability.** Does the declared life stage (kitten/growth, adult/maintenance, senior, all life stages) match the cat's profile? If no cat profile, evaluate against adult maintenance and state the assumption.

**5.4 Guaranteed analysis adequacy.** Do the stated protein/fat (and, where present, moisture/fiber/ash) as well as calorie values clear the recognized minimums for the relevant life stage, compared on a consistent basis (dry-matter for cross-format comparison)? **[Decision]** MVP checks against a small, fixed threshold table **[You provide in KB]**; it does not attempt a full nutrient-profile audit.

---

## 6. Data model

**[Decision]** Define the schema up front and make it the contract between stages. The **Gemini** extraction call must return exactly this shape. **Note:** the objects below are the simplified MVP contract; the production tables (`Extracts raw`, `Extracts (processed)`, `Cats`, `Images`) in the existing data model are the source of truth and are richer — reconcile field names against them during build (e.g. `format`→`type`, `completeness_claim`→`adequacy`, `declared_life_stage`→`lifestage`).

### 6.1 Extracted label object (`LabelData`)
```json
{
  "brand": "string | null",
  "product_name": "string | null",
  "variant": "string | null",
  "format": "wet | dry | unknown",
  "completeness_claim": "complete | complementary | unstated | unknown",
  "declared_life_stage": ["kitten","adult","senior","all_life_stages","unstated"],
  "ingredients_raw": "string | null",
  "ingredients_list": ["string"],
  "primary_protein_named": "boolean | null",
  "guaranteed_analysis": {
    "basis": "as_fed | dry_matter | unknown",
    "crude_protein_pct": "number | null",
    "crude_fat_pct": "number | null",
    "crude_fibre_pct": "number | null",
    "moisture_pct": "number | null",
    "ash_pct": "number | null"
  },
  "net_weight": "string | null",
  "artificial_additives_flagged": ["string"],
  "extraction_confidence": "high | medium | low",
  "unreadable_fields": ["string"]
}
```

### 6.2 Cat profile object (`CatProfile`) — optional
```json
{
  "name": "string | null",
  "age_years": "number | null",
  "age_months": "number | null",
  "body_condition": "skinny | just_right | chonky | overweight | null",
  "health_conditions": ["none","arthritis","dental","diabetes","allergies"]
}
```

### 6.3 Report object (`Report`) — the judging output
```json
{
  "verdict": "buy | buy_with_conditions | skip",
  "headline": "string",              // e.g. "Buy — but as a topper, not the main meal"
  "conditions": ["string"],           // plain-language conditions on the verdict
  "categories": {
    "completeness": { "result": "complete | complementary | unknown", "note": "string" },
    "ingredients":  { "flags": ["string"], "note": "string" },
    "life_stage":   { "result": "match | mismatch | assumed_adult", "note": "string" },
    "guaranteed_analysis": { "result": "meets | below | insufficient_data", "note": "string" }
  },
  "health_nudges": ["string"],        // non-prescriptive, only if profile has conditions
  "detailed_rationale": "string",     // the optional "why", generated on demand or included collapsed
  "standards_cited": ["IS-11968","FEDIAF","AAFCO","WSAVA"],
  "data_quality_warning": "string | null"  // set when extraction_confidence is low
}
```

---

## 7. Rules engine (Layer 2 — the judging logic)

**[Decision — locked] Layer 2 is deterministic Python that reads a structured KB; it is not an LLM and the rules are not in a prompt.** Every judgment traces to a rule and a named source, and the same input always yields the same verdict. Claude enters only at Layer 3 to phrase the result. Graduate to a DB/retrieval only if the rule set outgrows flat files (noted in §11); for MVP the KB is version-controlled structured files (JSON/CSV/markdown) that D authors and edits directly.

**Standards priority — [Decided].** In order: **IS-11968 (BIS, India) → FEDIAF (EU) → AAFCO (US)**. A value from a higher-priority standard wins; drop to the next only where the higher one is silent or unspecified. European (FEDIAF) always outranks American (AAFCO). **WSAVA is the governing framework** — it sets the assessment philosophy (e.g. Global Nutrition Guidelines, how to judge a manufacturer) rather than nutrient minimums, so it governs *how* we assess, while IS-11968/FEDIAF/AAFCO supply the *numbers*. **Note:** this reorders the `Ingredients (dim).min_qty/max_qty` sourcing comment in the data model (currently "IS11968 > AAFCO > WSAVA > FEDIAF") — update that too.

**[You provide] the KB.** This PRD specifies its *structure* and *decision logic*; you fill thresholds and citations. Suggested KB layout:

```
/kb
  01_completeness.md      # definitions of complete vs complementary (AAFCO/FEDIAF wording)
  02_life_stage.md        # life-stage definitions and age mapping
  03_guaranteed_analysis.md  # min protein/fat thresholds by life stage, dry-matter conversion
  04_ingredients.md       # named-protein rules, filler list, additive flag list
  05_health_nudges.md     # non-prescriptive copy per condition
  06_verdict_logic.md     # how categories roll up to Buy / Buy-with-conditions / Skip
```

### 7.1 Category logic (summary)

**Completeness.** Read `completeness_claim`. If `complementary` → the food cannot be the sole diet; this becomes a hard *condition*, not a skip. If `unstated`/`unknown` → flag as a data gap and lean conservative.

**Life stage.** Map cat age → life stage (**[You provide]** cutoffs; typical: kitten <12 mo, adult 1–7 yr, senior 7+). Compare to `declared_life_stage`. `all_life_stages` matches everything. Mismatch (e.g., kitten food for a senior) → condition or skip depending on severity **[You define in 06]**. No profile → assume adult, state it.

**Guaranteed analysis.** Convert to dry-matter basis for comparison (dry-matter % = as-fed % ÷ (100 − moisture%) × 100). Compare protein/fat to **[You provide]** minimums for the life stage. Below minimum → contributes toward skip. Missing values → `insufficient_data`, never a silent pass.

**Ingredients.** Produce flags only: primary protein not clearly named; presence of items on the filler/additive lists. Flags shape the *reasons* and can downgrade a borderline verdict but do not by themselves force a skip.

### 7.2 Verdict roll-up **[You finalize in 06_verdict_logic.md]**

Starting logic (tune during evaluation):

| Situation | Verdict |
|---|---|
| Complete + life-stage match + meets analysis + no major flags | **Buy** |
| Complete but with conditions (e.g., minor flags, senior cat fed adult food) | **Buy with conditions** |
| Complementary (regardless of quality) | **Buy with conditions** — "topper/part-diet only, not sole meal" |
| Complete but fails analysis minimums, or serious life-stage mismatch, or major red flags | **Skip** |
| Extraction confidence low / key fields unreadable | No verdict → ask for a clearer photo (see §8.4) |

**Guardrail.** The judging prompt must be instructed: never produce therapeutic/medical claims, never recommend a competitor product, and always attach the health nudge (not a recommendation) when a condition is present.

---

## 8. UX & report requirements

The input and profile UX already exist in the web flow (screens shared). Requirements below cover behavior the PRD pins down.

**8.1 Input.** Name (required, used only for greeting). Front panel photo (required). Back panel photo (required — the ingredient list and guaranteed analysis live here). Optional "Personalise for my cat" → cat profile modal (name, age y/m, body condition, health conditions multi-select).

**8.2 Progress.** The staged progress screen ("Reading the label → Evaluating ingredient quality → Analyzing nutritional profile → Preparing insights → Personalizing for {cat}") is retained as perceived-performance UI. It should reflect real stage transitions where feasible, but may be time-driven if the backend returns in one shot.

**8.3 Report.** Lead with the **verdict headline** and Buy/Skip. Then the short **conditions/reasons** (2–4 bullets, plain language). Then a collapsed **"Why this verdict"** detailed rationale (the §6.3 `detailed_rationale`). Then any **health nudges**. Cite standards by name where a claim rests on one. If personalization was skipped, show a one-line "General adult-cat analysis — add {cat}'s details for a tailored result."

**8.4 Failure / low-confidence.** If `extraction_confidence` = low or `unreadable_fields` includes ingredients or guaranteed analysis, do **not** fake a verdict. Show a "We couldn't read the label clearly — retake the back panel" state with guidance (the existing "Help us read the label clearly" tips).

---

## 9. Backend architecture & how the FE connects

### 9.1 Engine per layer

- **Layer 1 (Extract) — Gemini Flash.** Kept from prior work: proven on the sample packs, cheap, strong multilingual OCR (imports need it).
- **Layer 1 QC (Tier 1) — Gemini Flash classify.** Same vendor, tiny output.
- **Layer 2 (Assess) — deterministic Python.** No LLM. Reads the structured KB (§7).
- **Layer 3 (Explain) — LLM behind a vendor-agnostic interface.** Turns Layer 2's structured verdict into consumer copy from a locked template. **MVP runs this on Gemini** (reuses the single existing key — no new setup); the call sits behind a thin interface so swapping in Claude later is a one-line change. A fast model suffices since the input is already structured.

So the whole MVP pipeline runs on the **one Gemini key**. Claude is an optional Layer-3 upgrade later, not a build blocker.

### 9.2 How Python/FastAPI connects to the existing Next.js FE — [Decision]

The FE already uses a clean proxy pattern (verified in `app/api/analyze/route.ts`): the browser uploads images directly to Cloudinary, then POSTs a JSON payload of **Cloudinary URLs** (not bytes) to a Next.js API route, which forwards to an external engine (`N8N_WEBHOOK_URL_ANALYZE`) and returns the result.

**Keep Next.js as the BFF; FastAPI drops into the slot n8n occupies.** `FE → Next /api/analyze → FastAPI → Report`. Change one env var (`N8N_WEBHOOK_URL_ANALYZE` → `ANALYZE_API_URL`) and the fetch target. **Zero FE changes.**

Chosen over "browser calls FastAPI directly" because: (1) Anthropic/Gemini keys and the FastAPI URL stay server-side — the Next route already hides the upstream; (2) no CORS (same-origin `/api/*`); (3) existing session tracking, cookies, and the `AnalysisPayload` contract keep working. QC slots in as a twin route (`/api/qc`), same pattern.

**Existing request contract (reuse as-is):**
```
POST /api/analyze  (Next route → FastAPI)
{ analysis_id, session_id, personalise_flag,
  cat_ids: string[],                       // multi-cat
  images: [{ imageId, cloudinaryUrl, category: "front"|"back" }],
  cta_source, timestamp }
```
FastAPI fetches each `cloudinaryUrl` server-side, runs QC → extract → assess → explain, and returns the `Report` (§6.3) plus the persisted `Extracts` / assessment ids.

**Async, not synchronous — [Decision].** The full pipeline can run 30–60s; a synchronous forward risks gateway timeouts. FastAPI should **return `analysis_id` immediately**, do the work in the background, and let the FE **poll** for status/result — the existing `/report/[id]` route already reads by id, and the `Images.status` / `Extracts.confidence` fields already model progress. Wire the §8.2 progress screen to real status transitions where feasible.

```
POST /analyze     → 202 { analysis_id, status: "processing" }
GET  /analyze/{id}→ 200 { status: "processing" | "qc_failed" | "done", report?: Report, guidance? }
```

### 9.3 Engineering mechanics
- **Structured output:** constrain the Gemini extraction and QC calls to their JSON schemas so downstream code never parses prose. Layer 2 output is plain typed Python.
- **Determinism:** Layer 2 is pure code → identical input yields identical verdict. Layer 3 (Claude) runs low-temperature on already-structured input, so copy is stable.
- **Secrets:** all API keys server-side (FastAPI env / secrets manager), never in the browser.
- **Persistence:** write `Extracts raw` + `Extracts (processed)` + the assessment + final `Report` for every scan — this is the golden dataset for tuning §7.2 and for manual extraction QA against stored images.
- **Error handling:** malformed extraction JSON → retry once; repeated failure or low confidence → route to the §8.4 re-upload state, never a fabricated verdict.

### 9.4 Stack note
**Python + FastAPI** for the analysis engine (Gemini + Anthropic SDKs are first-class in Python; Layer 2 is data/rules work). It runs as a **separate service** the Next.js BFF calls — deploy independently (Render / Railway / Fly / VM). This is reversible; a Node/TS engine would work too, but Python is the better fit for the extraction-normalization + rules core.

*Anthropic account/key setup and the Layer-3 client code are a follow-up task — this section is the contract they build against. Nothing here blocks the KB work, which is the critical path.*

---

## 10. Build sequence (suggested, for the follow-up session)

1. Reconcile the §6 contract against the production tables (`Extracts`, `Cats`, `Images`).
2. Stand up FastAPI behind the Next.js BFF (§9.2): `/analyze` (async, returns `analysis_id`) + `/qc`, mocked stages first.
3. Author the KB files (§7) — **D's task, critical path, in parallel.**
4. Wire Tier 1 QC + Layer 1 extraction (Gemini) with schema-constrained output; test on the sample packs (wet + dry, multilingual).
5. Build Layer 2 (deterministic rules over the KB); test the four checks + verdict roll-up against labeled examples.
6. Wire Layer 3 (Claude) from the locked template; verify citations + guardrails.
7. Hook the report + polling into the existing `/report/[id]` UI; wire the §8.4 re-upload fallback.

---

## 11. Explicitly out of scope (guard against creep)

Validating a therapeutic/prescription diet's *medical claim* (a therapeutic food instead gets the `vet_diet` guidance track — condition-matched to the cat, always routed to the vet, never scored Buy/Skip — see `kb/06_verdict_logic.md` §3); diagnosing or managing health conditions; exact daily feeding amounts/calorie math; brand or product recommendations; multi-cat comparison in one report; comparing two foods head-to-head; non-cat species; full AAFCO/FEDIAF nutrient-profile audit (all ~40 nutrients); allergen-safety guarantees; supply of purchase links / e-commerce; RAG/vector knowledge base (rules stay in deterministic code + structured KB files for MVP).

---

## 12. Open questions (need D's input before or during build)

1. **Life-stage age cutoffs** — confirm the kitten/adult/senior boundaries for the KB.
2. **Guaranteed-analysis minimums** — which standard is the primary reference for thresholds (AAFCO vs FEDIAF), and the exact min protein/fat by life stage. Regional choice matters (US vs EU wording differs).
3. **Region** — is MVP targeting UK/EU packs (FEDIAF, "complementary" wording), US packs (AAFCO), or both? This affects label vocabulary the extractor must recognize.
4. **Verdict thresholds** — final roll-up rules in `06_verdict_logic.md` (the §7.2 table is a starting point).
5. **Filler / additive lists** — the specific ingredient names Wiser should flag.
6. **"Detailed rationale"** — always generated and shown collapsed, or generated on demand when the user taps "why" (a small cost/latency trade).
7. **Data retention** — are we storing user photos and reports for evaluation, and for how long?

---

## 13. Assumptions

- The existing web front end (input screens, profile modal, progress screen, report shell) is reused; this PRD specs the analysis backend and its contract, not a new UI.
- One product per analysis run; personalization against one selected cat.
- The KB is authored and maintained by D and treated as the single source of nutritional truth for the MVP.
- Standards referenced (AAFCO, FEDIAF, WSAVA) are used for their published nutritional guidance; Wiser cites them but is not certified by them.
