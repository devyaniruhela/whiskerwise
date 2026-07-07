# Verdict Roll-up Logic (KB 06)

_Last updated: 08 Jul 2026_ · **Status: draft v4** (v3 + D's 08 Jul ruling: **the verdict is pack-dependent** — the food is scored as what the pack claims to be, on its declared life-stage tier; **cat suitability is always a callout and never changes the verdict**. Same pack → same verdict, regardless of cat selection. Report design mirrors this.) Sign-off parked by D — build proceeds on this version. Deterministic decision spec the Layer-2 rules engine implements. Thresholds are **tunable** (§9). Same inputs → same verdict.

Output verdict ∈ `buy` · `buy_with_conditions` · `skip` · `vet_diet` (therapeutic track, §3) · `no_verdict` (re-scan). **Design intent (D):** a verdict that approves everything is worthless — Wiser must discriminate. `buy` is reserved for clean food that meets everything; anything with a real flag lands lower. Never diagnoses; never validates a therapeutic claim.

---

## 1. Inputs

| Signal | Source | Values |
|---|---|---|
| `adequacy` | `Extracts.adequacy` | `complete` · `complementary` · `treat` · `unknown` |
| `intended_use` | `Extracts.intended_use` | therapeutic marker (urinary/GI/renal/hypoallergenic/obesity…) or null |
| `type` | `Extracts.type` | `dry` · `wet` · treat |
| `life_stage_fit` | declared `lifestage` vs each selected cat | `match` · `over` · `under` · `assumed_adult` · `unknown` |
| `ga_check` | each **declared** nutrient (DM basis) vs `02_nutrient_thresholds.csv` for the life stage | per-nutrient `meets` / `below`; or `insufficient_data` |
| `carb_dominance` | ingredient order + `03_ingredients_master.csv` categories | position of first named animal protein; count of grain/carb/filler in top-4 |
| `ingredient_flags` | `03_ingredients_master.csv` evaluations | list of flags + primary-protein assessment |
| `extraction_confidence` | `Extracts.confidence` | `high` · `medium` · `low` |

**Core nutrients** always checked when a claim of completeness exists: protein, fat, taurine. **Any other declared nutrient** (Ca, P, fibre-max, etc.) is also checked against its min/max.

---

## 2. Data-quality gate (first)

If `extraction_confidence = low`, or ingredients / protein / fat are unreadable → **`no_verdict`** (retake label, PRD §8.4). Stop.

---

## 3. Role from `adequacy`  *(REVISED per D)*

| `adequacy` | Verdict framing |
|---|---|
| `complete` | Eligible for `buy`. Full scoring (§4–§6). |
| `complementary` | **`skip` as a main meal**, with allowance *"fine as an occasional topper."* Lead with Skip, not Buy — a part-diet is not an approved meal. (`use_as = topper`.) |
| `treat` | **`skip` as a meal**, allowance *"treat only — keep ≤10% of daily calories."* (`use_as = treat`.) |
| `unknown` / unstated | **`buy_with_conditions`**, lead condition *"couldn't confirm this is a complete food — don't rely on it as the sole meal until the pack's completeness statement is verified."* Not an auto-skip. **Reasoning:** a genuinely complete food often just has its statement missed by OCR (e.g. Farmina N&D in our corpus) — skipping it would be a false negative. Conservative but not punishing. *(Tunable — §9.)* |

**Therapeutic / prescription diets *(REVISED per D — own track, NOT a Buy/Skip)*.** If `intended_use` is a therapeutic marker **or `lifestage = medical`** (either alone triggers the track — D, 07 Jul 2026), do **not** run the standard adequacy Buy/Skip. These diets deliberately deviate from general minimums (a renal diet is intentionally low-protein; scoring it against the 26% floor would wrongly Skip it). Instead output a **`vet_diet`** guidance result:

1. **State the purpose from the pack** — *"This is a therapeutic diet for cats with [condition, e.g. urinary/LUTD]. It's formulated with [pack features, e.g. controlled magnesium, urinary acidifiers] for their specific needs."*
2. **Match to each selected cat's conditions** (not to the nutrient standard):
   - Cat **has** the matching condition → *"As per your input, this may suit [Cat1], who has [condition] — but only if your vet prescribes it."*
   - Cat **has no** matching condition → *"We'd hold off feeding this to [Cat2] (no matching condition on file) unless your vet advises it."*
1. **Always** — *"For any therapeutic/prescription diet, check with your vet before introducing it to your cat."*

`verdict = vet_diet`; carries `therapeutic_purpose`, per-cat `suitability`, and the disclaimer. Wiser never confirms the food actually treats the condition. *(This replaces the earlier "assess normally + disclaimer" stance.)*

**Breed-specific packs (`lifestage = breed`) — D, 07 Jul 2026.** Score against the underlying declared life stage (adult unless stated otherwise) and add a callout naming it a breed-specific formula; no penalty for being breed-specific.

---

## 4. Hard-fail checks → `skip`  *(EXPANDED per D)*

Any one triggers `skip` (short-circuits §5–§6):

1. **Doesn't meet minimums vs its claim.** Food claims `complete` **and any declared nutrient (macro or micro) is below its IS-11968 minimum** for the life stage → skip. *"Labelled a complete food, but [nutrient] is below the minimum for [life stage]."*
2. **Life-stage can't be met** *(REVISED per D, 08 Jul 2026)*. An adult/senior-only food selected for a **kitten** → **per-cat callout** *"skip for this cat — growth needs unmet"*. This does **not** change the pack verdict (the pack is scored as what it claims to be, §7); suitability is always a callout.
3. **Filler-dominated dry food.** `type = dry` **and** (no named animal protein in the **top 2** ingredients **or** grains/carbs/fillers make up **≥ half of the top 4**) → skip. Bake in marketing hacks like ingredient splitting and fresh ingredient ahead due to water weight etc. into the decision. *"This dry food is built mainly on grains/fillers rather than animal protein — a poor fit for an obligate carnivore."* *(Framed on animal-protein dominance, not mere presence of grain — see note in §12.)*
4. **Artificial colour present** → skip. *"Contains added colour — purely cosmetic, of no benefit to your cat, and a signal the product prioritises appearance."* (The one ingredient that alone warrants a skip.)
5. **Stacked red flags.** **≥ 3 major flags** (see §5) on one product → skip, even if none individually would.
6. **Core nutrient undeclared on a complete-claiming food** *(ADDED per D, 07 Jul 2026 — strict stance)*. Food claims `complete` **and** a core nutrient (protein, fat, taurine) is absent from the label → skip. Missing = unknown = assumed **not present** — no benefit of the doubt toward Buy. Call out the missing nutrient and list any other red flags found alongside. *(Distinct from an unreadable label, which is a §2 `no_verdict` re-scan.)*

---

## 5. Red-flag tiers → differentiate `buy` from the rest  *(per D)*

**Principle:** clean food that meets everything = `buy`. Any **major** flag = **at best `buy_with_conditions`** — it must never score the same as clean food. Serious flags escalate to `skip` (§4.4–4.5).

**Major** (each blocks a clean `buy` → `buy_with_conditions`; 3+ → skip):
- Primary ingredient is a **generic/unnamed protein** (`generic_protein`).
- `insufficient_data` — couldn't confirm key nutrients (non-core gaps, or when `adequacy` ≠ complete). A missing **core** nutrient on a complete-claiming food escalates to the §4.6 skip (D, 07 Jul 2026).
- Plant-protein **boosting** (`protein_boost`: corn/wheat gluten lifting the protein figure).
- Added **sugar** in a non-treat food (`sugar`).

**Minor** (adds a note; 2+ → `buy_with_conditions`):
- Artificial **preservative** (`artificial_preservative`).
- `life_stage_fit = unknown` (pack life stage unstated/undecipherable — a **pack** property) — assess as adult maintenance, add the condition and per-cat suitability callouts (D, 07 Jul 2026).
- *(REMOVED per D, 08 Jul 2026: `over` and `assumed_adult` are cat-dependent signals — they are **callouts/notes**, never verdict flags. The verdict stays pack-dependent.)*
- Other single `caution` ingredients.

*(Artificial colour and the filler-dominance / any-nutrient-below-claim cases are skip-level in §4, not here.)*

---

## 6. Decision table

| Situation | Verdict |
|---|---|
| Data-quality gate tripped (§2) | **no_verdict** |
| `intended_use` = therapeutic marker (§3) | **vet_diet** (own track; skip §4–§6) |
| Any hard fail (§4) | **skip** |
| `complementary` / `treat` (no hard fail) | **skip** (as meal) + `use_as` allowance |
| `complete` + all declared nutrients meet on the **pack's declared life-stage tier** + **no** major/minor flags | **buy** |
| `complete`, no hard fail, but ≥1 major or ≥2 minor flags (or `unknown` adequacy) | **buy_with_conditions** |

`headline` = verdict + the single most important reason (e.g. *"Skip as a main meal — good as an occasional topper,"* or *"Buy — meets the standard with a clean label."*). Therapeutic foods carry the §3 disclaimer regardless of verdict.

---

## 7. Pack-dependent verdict + per-cat suitability  *(REVISED per D, 08 Jul 2026)*

**Assess the food exactly as the label states it** — the nutrient tier comes from the **pack's declared life stage** (kitten / all-life-stages → growth tier; adult / senior / breed / unknown → adult tier), never from the selected cats. Then **match suitability to each selected cat as callouts**:

- Adult/senior formula selected for a **kitten** → *"⚠️ Skip for {cat} (kitten) — this formula won't meet growth needs."*
- **Kitten** formula selected for an **adult/senior** → *"⚠️ This growth formula is calorie-dense for {cat} — a maintenance food suits them better,"* **unless the cat's body condition is underweight** (then the density can be acceptable — route to vet, no warning). All-life-stages packs count as matching any cat (kb/01), so no calorie callout there.
- Pack life stage unknown → *"check the pack before feeding {cat}."*
- Senior cats → management callout (adult tier, no separate senior standard).

The shared verdict **never changes with cat selection** (e.g. *"✅ Good for Luna (adult). ⚠️ Skip for Toto (kitten) — adult formula won't meet growth needs."* on a pack whose own verdict is buy). No cat profile → general adult-cat analysis, stated as a note.

## 8. Health nudges (never change the verdict)

Per-condition non-prescriptive nudge appended when a selected cat's profile lists a condition. Additive context only. Copy in the health-nudge KB (to author).

---

## 9. Tunable parameters

- Core-nutrient set (protein, fat, taurine) and whether micros count toward §4.1 (default: yes, when declared).
- Filler-dominance rule (default: animal protein not in top-2 **or** fillers ≥½ of top-4).
- Artificial colour → skip (default on).
- Stacked-flag skip count (default 3 majors).
- Major/minor flag lists (§5).
- `unknown` adequacy stance (default: `buy_with_conditions` + verify-completeness condition).
- Missing-core-nutrient stance on complete foods (default: strict §4.6 skip; alternative: major flag).
- `vet_diet` trigger set (default: `intended_use` therapeutic marker **or** `lifestage = medical`).
- Treat calorie allowance (default ≤10%).
- Calorie-density callout for growth food selected for a non-underweight adult (default on; suppressed when the cat is underweight).

---

## 10. Worked examples

| Pack (corpus) | Signals | Verdict |
|---|---|---|
| Complete adult dry, meat-first, meets all declared, clean label | complete · match · meets · no flags | **buy** |
| NutriMeow Chicken-in-Gravy (Kitten), wet, complete | complete · kitten · DM protein ≈39% | **buy** if taurine declared; **skip** if taurine absent from the label (§4.6 strict) |
| Farmina N&D Adult Chicken, dry, no adequacy statement | `unknown` · protein 44% DM | **buy_with_conditions** — "verify it's a complete food" |
| Bellotta Tuna, wet, complementary | complementary | **skip as meal** — "good as an occasional topper; vary proteins" |
| Dry food, first two ingredients cereals/corn, meat low | complete · dry · filler-dominated | **skip** (§4.3) |
| Any food listing added colour | artificial_colour | **skip** (§4.4) |
| Complete adult food, declared protein 22% DM (<26 min) | complete · below-claim | **skip** (§4.1) |
| Royal Canin Urinary S/O, dry | therapeutic marker = urinary | **vet_diet**: "for cats with urinary/LUTD…" → suit a cat with FLUTD *if vet-prescribed*; hold off for a cat with no urinary condition; always see vet |

---

## 11. Output contract (maps to PRD §6.3 `Report`)

`{ verdict, headline, use_as?, conditions[], categories{completeness, life_stage, guaranteed_analysis, ingredients}, per_cat_callouts[], health_nudges[], therapeutic_purpose?, per_cat_suitability?, vet_disclaimer?, standards_cited[], data_quality_warning }`. For `vet_diet`, the `categories` Buy/Skip scoring is omitted in favour of `therapeutic_purpose` + `per_cat_suitability`. Layer 3 (Gemini for now; Claude-swappable) turns this into the consumer report — it does not re-decide anything.

## 12. Note on the evidence-based stance

Two §4 rules (filler-dominated dry food; artificial colour → skip) go slightly beyond strict WSAVA neutrality, which treats grains/by-products as not-inherently-bad. This is a deliberate **product-positioning** choice by D, and it is defensible on carnivore-nutrition grounds: the filler rule keys on **animal-protein dominance** (not the mere presence of grain), and the colour rule on **absence of any benefit**. Worth revisiting if it over-skips during the extraction bake-off.
