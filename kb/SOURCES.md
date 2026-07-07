# Wiser — Sources

_Last updated: 07 Jul 2026_

Maintained **only** for files (or online references) used as a source for something inside the tool (KB thresholds, ingredient judgments, life-stage logic, report claims). Non-source material lives in `reference.md`.

**Update rule:** every time something is added to the KB and mapped to a source, update or add its row here and set its **Status**. Priority when standards conflict: **IS-11968 → FEDIAF → AAFCO**, WSAVA governing.

**Status:** `added` = in use in the KB · `pending` = source present, not yet wired in. Where a single source is partly used, the row stays `mixed` and the pending use is tagged `(pending)` in its bullet — no row duplication.

| Short ref | Source file / link | Used for | Status | Replaced by |
|---|---|---|---|---|
| **IS-11968** | `00-cat-care-research/cat-nutrition/IS11968-2019.pdf` (Table 2, pp.8–9; defs pp.3–4) | • Applied nutrient minimums (protein, fat, taurine, Ca, P, Mg, vitamins) in `02_nutrient_thresholds.csv` — all "APPLIED" values<br>• Confirms cat values are dry-matter basis<br>• Life-stage definitions in `01_lifestage.csv` | added | — |
| **FEDIAF** | `00-cat-care-research/cat-nutrition/FEDIAF-Nutritional-Guidelines_2025-ONLINE.pdf` (Table III-4 p.18; III-5 p.19; §7.3) | • Cross-column + gap-fill in `02_nutrient_thresholds.csv`<br>• Wet-food taurine 0.20% differentiator target<br>• Vitamin A/D/E (converted to IU/kg)<br>• Ca:P ratio definition (added by D — page & table)<br>• "sugars"/"derivatives" labelling terms in `03_ingredients_master.csv` | added | — |
| **AAFCO-profiles** | `00-cat-care-research/cat-nutrition/AAFCO_Nutrient_Profiles_Proposed_revisions_PFC_Final_070214.pdf` (pp.13–14) | • Third-priority cross-column in `02_nutrient_thresholds.csv`<br>• Taurine dry 0.10% / wet 0.20% | added | — |
| **AAFCO-ingredients** | `00-cat-care-research/cat-nutrition/AAFCO_Ingredients_List.pdf` | • Ingredient definitions (named vs generic protein) in `03_ingredients_master.csv` | added | — |
| **WSAVA** | `00-cat-care-research/cat-nutrition/Selecting-a-pet-food-for-your-pet-updated-2021_WSAVA-Global-Nutrition-Toolkit.pdf` | • Governing evidence-based **stance** for ingredient evaluations<br>• Counterpoints in `03_ingredients_master.csv` | added | — |
| **NRC** | `00-cat-care-research/650285654-Nutrient-Requirements-of-Dogs-and-Cats.pdf` | • Ingredient science (fish concerns, fats, taurine) in `03_ingredients_master.csv`<br>• Senior deepening in `01_lifestage.csv` `(pending)` | mixed | — |
| **Ageing-review** | `00-cat-care-research/research-paper-combined-ageing-dogs-cats--PMC.pdf` | • Senior/longevity evidence; links onward primary sources `(pending)` | pending | — |
| **JFMS-allergy** | `00-cat-care-research/cat-nutrition/cat-food-allergies-elimination-diet-10.1016_j.jfms.2010.09.005.pdf` | • Hydrolysed-protein / allergy context in `03_ingredients_master.csv` | added | — |
| **Myths** | `00-cat-care-research/5-nutrition-myth-infographics.pdf` | • Plain-language backing for the evidence-based stance | added | — |
| **FSSAI** | `00-cat-care-research/FSSAI_Comp_Labelling-Display_Version-VIII_09_09_2025.pdf` | • Indian pack labelling requirements for extraction/claims validation `(pending)` | pending | — |
| **Cornell-Diabetes** | `00-cat-care-research/therapeutic/Feline-Diabetes-\|-Cornell-University-College-of-Veterinary-Medicine.pdf` | • `diabetes` nudge copy in `05_health_nudges.md` | added | — |
| **Cornell-CKD** | `00-cat-care-research/therapeutic/Chronic-Kidney-Disease-\|-Cornell-University-College-of-Veterinary-Medicine.pdf` | • `kidney_disease` nudge copy in `05_health_nudges.md` | added | — |
| **Cornell-FLUTD** | `00-cat-care-research/therapeutic/Feline-Lower-Urinary-Tract-Disease-\|-Cornell-University-College-of-Veterinary-Medicine.pdf` | • `urinary_issues` nudge copy in `05_health_nudges.md` | added | — |
| **Cornell-Obesity** | `00-cat-care-research/therapeutic/Care-of-Obese-Cats-\|-Cornell-University-College-of-Veterinary-Medicine.pdf` | • `obesity_weight` (bonus) nudge copy in `05_health_nudges.md` | added | — |
| **FEDIAF-Weight** | `00-cat-care-research/therapeutic/Maintaining-a-healthy-weight-for-your-cat-\|-FEDIAF.pdf` | • `obesity_weight` (bonus) nudge copy in `05_health_nudges.md` | added | — |
| **Cornell-FoodAllergies** | `00-cat-care-research/allergies/Food-Allergies-Cornell-University-College-of-Veterinary-Medicine.pdf` | • `food_allergies` nudge copy in `05_health_nudges.md` | added | — |
| **CAVD-DietTrial** | `00-cat-care-research/allergies/CAVD_Diet_Trial_handout_for_Cats.pdf` | • `food_allergies` nudge copy in `05_health_nudges.md` (elimination-diet-trial framing) | added | — |

## Online sources referred
None. All tool sourcing is from the local corpus. If an online paper is ever used, add it here with its URL, what it backs, and Status.

## Pending provenance (ingredient rows)
Rows in `03_ingredients_master.csv` tagged `NEEDS_SOURCE` / `PARTIAL` are not yet folder-backed (additive controversy, colours, probiotics/enzymes, joint additives, produce). Tracked in `../task-manager.md`.

## Pending provenance (health-nudge rows)
Rows in `05_health_nudges.md` §1 tagged `NEEDS_SOURCE` (arthritis, dental disease, heart disease/HCM, hyperthyroidism, gastroenteric/IBD) and §2's `underweight_weight` have no corpus-backed source yet — copy is deliberately generic until sourced. Tracked in `../task-manager.md`.
