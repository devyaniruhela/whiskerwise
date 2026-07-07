# Health Nudges (KB 05)

_Written 07 Jul 2026 — **v1 draft by Claude, for D to edit.**_ Per PRD §3 and `06_verdict_logic.md` §8: a non-prescriptive, additive-only note appended to the report when a selected cat's profile lists a health condition. **Nudges never change the verdict, never diagnose, never validate a therapeutic claim, and always route to a vet.** They are the opposite of the `vet_diet` track in `06_verdict_logic.md` §3 (which fires when the *food* carries a therapeutic marker) — these fire when the *cat* has a condition on file, regardless of what food was scanned.

**Two trigger sources, both non-prescriptive, both additive-only:**
1. **`health_conditions` checklist** (§1) — the 10 options in the current cat-profile dropdown (`web-flow/ww-form-disease1.png`, `ww-form-disease2.png`; same list as old FE's `constants/cat-data.ts` → `HEALTH_CONDITIONS`) plus `other`.
2. **`body_condition` field** (§2) — derived from the cat's own body-condition selection, not a checklist item. Per `context.md`'s locked 9→4-point mapping, the bottom bucket (WSAVA 1–3, "a bit skinny") fires `underweight`; the top two buckets (WSAVA 6–9, "a bit chonky"/"overweight") fire `overweight`. The middle bucket (4–5, "just right") fires nothing.

**Format:** each nudge is a template string with `{cat_name}` substituted at render time. Engine looks up §1 by the **key** column (normalize the FE's display label to this key) and §2 by the cat's `body_condition` bucket. Keep this file as data the engine reads — do not hardcode nudge copy in application code, so D can revise wording here without a code change.

**Sourcing discipline:** where a corpus source exists, it's cited and added to `SOURCES.md`. Where no source doc exists yet, the row is marked `NEEDS_SOURCE` (same convention as `03_ingredients_master.csv`) and the copy stays deliberately generic/low-specificity until sourced — **do not ship a `NEEDS_SOURCE` row's specific claims without D's review.**

---

## 1. Nudge templates

| Key | Dropdown label | Nudge template | Source | Status |
|---|---|---|---|---|
| `arthritis` | Arthritis | "{cat_name} has an arthritis flag. Keeping weight in check matters a lot for joint comfort — extra weight adds strain on sore joints. This analysis doesn't check for joint-support ingredients or whether this food suits a joint condition; talk to your vet about whether a joint-support or weight-control diet would help {cat_name}." | — | `NEEDS_SOURCE` |
| `dental_disease` | Dental disease/Gingivitis | "{cat_name} has a dental-health flag. For cats with dental pain, kibble texture and size can matter more than the nutrients in it — some do better on wet food or a dental-care formula. This analysis doesn't assess texture; talk to your vet about the best format for {cat_name}." | — | `NEEDS_SOURCE` |
| `diabetes` | Diabetes | "{cat_name} has a diabetes flag. Carbohydrate load matters a lot for diabetic cats — vets often recommend low-carb, high-protein diets. This analysis doesn't calculate carbohydrate load; talk to your vet about a diet suited to {cat_name}'s diabetes management." | Cornell Feline Diabetes | `added` |
| `food_allergies` | Food allergies/sensitivities | "{cat_name} has a food-allergy/sensitivity flag. This analysis checks general ingredient quality, not whether this food's specific proteins match {cat_name}'s known triggers. If a food allergy is suspected, a vet-guided elimination diet trial — not label-reading — is the standard way to confirm the culprit ingredient." | Cornell Food Allergies; CAVD Diet Trial handout | `added` |
| `heart_disease` | Heart disease/HCM | "{cat_name} has a heart-health flag (HCM/heart disease). Sodium and taurine levels can matter for cats with heart conditions. This analysis doesn't check sodium content or heart-specific formulation; talk to your vet about whether this food is appropriate for {cat_name}." | — | `NEEDS_SOURCE` |
| `hyperthyroidism` | Hyperthyroidism | "{cat_name} has a hyperthyroidism flag. Hyperthyroid cats often need calorie-dense, easily digestible food, and some vets recommend an iodine-restricted therapeutic diet. This analysis doesn't check iodine content; talk to your vet about the right nutritional approach for {cat_name}." | — | `NEEDS_SOURCE` |
| `gastroenteric_ibd` | Gastroenteric conditions/IBD | "{cat_name} has a gastroenteric/IBD flag. Cats with ongoing digestive issues often do best on a consistent, easily-digestible, or vet-recommended diet — sudden food changes can trigger flare-ups. This analysis doesn't check digestibility; talk to your vet before switching {cat_name} to a new food." | — | `NEEDS_SOURCE` |
| `kidney_disease` | Kidney disease | "{cat_name} has a kidney-disease flag. Phosphorus and protein levels matter a lot at later stages of kidney disease — many vets recommend a phosphorus-restricted renal diet. This analysis checks general protein adequacy, not renal-specific phosphorus restriction; talk to your vet about whether {cat_name} needs a kidney-support diet." | Cornell Chronic Kidney Disease | `added` |
| `urinary_issues` | Urinary issues | "{cat_name} has a urinary-health flag. Moisture content and mineral balance (magnesium, urinary pH) matter for cats prone to urinary issues — wet food and urinary-support diets are often recommended. This analysis doesn't check urinary-specific mineral balance; talk to your vet about whether a urinary-support diet suits {cat_name}." | Cornell Feline Lower Urinary Tract Disease | `added` |
| `other` | Other (please describe) | "{cat_name} has a health condition on file ({description}) that this analysis doesn't specifically account for. Please talk to your vet about whether this food is appropriate given {cat_name}'s condition." | — | n/a (generic fallback, no source needed) |

---

## 2. Body-condition-triggered nudges

Not checklist items — derived automatically from the cat's `body_condition` selection (see `context.md`'s locked 9→4-point mapping). Fires alongside, and independently of, any §1 nudges.

| Key           | Trigger (WSAVA bucket)              | Nudge template                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Source                                                                         | Status         |
| ------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------- |
| `overweight`  | 6–9 ("a bit chonky" / "overweight") | "{cat_name}'s body-condition check flags them as on the heavier side. If your vet agrees weight loss is appropriate, the standard approach is to reduce calorie intake **gradually over several weeks** — sudden calorie cuts can be harmful. Dry food is calorie-dense for its volume, so free-feeding kibble makes it easy to overshoot calories without noticing; cutting back on dry food (or shifting some intake to wet food) often matters more than any single ingredient choice. Obesity raises the risk of diabetes, joint strain, and other complications, so it's worth taking seriously — talk to your vet about a weight-management plan for {cat_name}. This analysis doesn't calculate {cat_name}'s calorie needs or portion size." | Cornell Care of Obese Cats; FEDIAF "Maintaining a healthy weight for your cat" | `added`        |
| `underweight` | 1–3 ("a bit skinny")                | "{cat_name}'s body-condition check flags them as on the lighter side. If your vet agrees weight gain is appropriate, the standard approach is to increase calorie intake **gradually over several weeks**. Dry food is calorie-dense for its volume, so it can help raise {cat_name}'s daily calorie intake without needing to feed a much larger amount — useful if appetite or volume is a challenge. Being underweight can also point to an underlying issue (dental pain, illness, inadequate intake), so it's worth ruling that out rather than assuming it's diet alone — talk to your vet about a suitable plan for {cat_name}. This analysis doesn't calculate {cat_name}'s calorie needs or portion size."                                 | —                                                                              | `NEEDS_SOURCE` |

---

## 3. Other common cat conditions not yet drafted

Named for D's awareness — not drafted because no corpus source exists yet and they're less universally applicable than the list above. Add to §1 (with a source) if you want them in the dropdown:
- **Pancreatitis** — dietary fat is often restricted; would need a source before drafting specific copy.
- **Hyperlipidemia** — fat-restricted diets sometimes recommended.
- **Feline asthma/respiratory conditions** — not typically diet-driven, would mostly route straight to vet with no nutrition-specific claim.

## 4. Rendering rules

- §1 fires when a selected cat's profile has the matching `health_conditions` entry; multiple conditions on one cat → multiple nudges, one per condition (order doesn't matter, never de-duplicate silently — each is informative).
- §2 fires off the cat's `body_condition` value, independent of §1 — a cat can get both a checklist nudge and a weight nudge in the same report.
- `other` requires the profile's free-text description (`otherHealthDesc` in the old FE's `CatProfile` shape) to fill `{description}`; if blank, drop the parenthetical.
- Never suppresses or downgrades the verdict — appended after the verdict/conditions/rationale, per `06_verdict_logic.md` §8.
- If the scanned food is *also* a therapeutic diet (`vet_diet` track fires), both can appear: the `vet_diet` disclaimer speaks to the food's stated purpose, these nudges speak to the cat's condition — they're complementary, not redundant.

## 5. Tunable / open

- Wording throughout — **D to edit freely**, this is a first pass.
- Whether to source `underweight` properly (no corpus doc currently covers underweight cats specifically — the Cornell/FEDIAF docs in `therapeutic/` are obesity-focused) before shipping its specific calorie-density claim.
- Whether to source and draft the five `NEEDS_SOURCE` rows in §1 (arthritis, dental, heart disease, hyperthyroidism, GI/IBD) — flag in `task-manager.md` once sourced.
