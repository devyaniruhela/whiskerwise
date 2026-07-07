# Ingredient Master — Rules

_Last updated: 06 Jul 2026_

How `03_ingredients_master.csv` is built and maintained, so combining/splitting stays consistent across sessions. Read before editing that file.

## Columns

| Column | Meaning |
|---|---|
| `id` | Stable integer key. Never reuse a deleted id. |
| `canonical_name` | The one true name for the row. |
| `aliases` | `;`-separated surface forms seen on packs that map to this row. |
| `class` | `whole_ingredient` \| `additive_nutrient`. |
| `origin` | animal \| plant \| mineral \| synthetic \| other. |
| `category` | primary bucket (named_animal_protein, plant_protein, grain_carb, fibre, oil, vitamin, mineral, preservative, colourant, thickener, functional_additive, produce, dairy, water…). |
| `purpose` | nutritional/functional role(s). |
| `evaluation` | `positive` \| `neutral` \| `caution` \| `negative`. The directional signal the verdict uses. |
| `flags` | machine tags the rules engine keys on (e.g. `generic_protein`, `byproduct`, `artificial_colour`, `protein_boost`). |
| `function_note` | plain-language "why it's there". |
| `concern_note` | plain-language "why it can be a problem". |
| `counterpoint` | the other side, for borderline items (trust-UX "show both interpretations"). |
| `source` | folder doc backing the row (see `SOURCES.md`). |
| `source_status` | `OK` (folder-backed) \| `PARTIAL` (classification backed, a specific note isn't) \| `NEEDS_SOURCE` (not yet backed). |

## The combining rule (THE key rule)

Multiple ingredients may share ONE row **only if all four scored columns — `evaluation`, `flags`, `function_note`, `concern_note` — are true for every member.**

- ✅ Safe to combine: a genuine functional class whose members are interchangeable on all four columns (e.g. prebiotic fibre = FOS/inulin/MOS; natural preservatives = tocopherols/rosemary; added minerals).
- ❌ Must split: the moment any member diverges on evaluation **or** a note, it gets its own row. Grouping by function is fine; grouping by convenience is not.

**Worked precedents (already applied):**
- `carrageenan` is split out of gelling agents (it's `caution`, the others are `neutral`).
- `fish & seafood` split into general named fish / `tuna` (mercury+thiaminase caution) / `shellfish` (allergen).
- `dairy` split into `milk` (caution, lactose) / `colostrum` (positive, immune).
- botanicals split from `fruits & vegetables (minor)` (additive vs whole food).
- `probiotics` split from `digestive enzymes` (different function; viability concern applies only to probiotics).

When in doubt, split — a wrong `concern_note` applied to the wrong ingredient is a correctness bug in the verdict.

## Alias & normalization rule

Pack text is messy. Before lookup, the engine must normalize: lowercase → strip quantities/percentages (`(30%)`, `40%`) → strip probiotic strain suffixes (`… r175`) → split on `+` and `:` → then match against `aliases`. Add new surface forms to `aliases`, don't create duplicate rows.

## Evaluation stance

Evidence-based / WSAVA-aligned. Judge on function and transparency, not stigma (by-products and grains are not inherently bad; unnamed generic protein loses transparency; artificial colour adds no benefit). Where a common clean-label concern exists, use `counterpoint` to show both sides.

## Adding a new ingredient (checklist)

1. Does it map to an existing row? → add to that row's `aliases`. Done.
2. New row? Fill all columns. Pick `evaluation` per the stance above.
3. Set `source` + `source_status` honestly (`NEEDS_SOURCE` if not folder-backed — do not guess `OK`).
4. If it shares a class with existing rows but differs on any scored column, that difference is *why* it's a separate row — fine.
5. Log the change in `task-manager.md`; if a new source is used, add/extend its row in `SOURCES.md`.
