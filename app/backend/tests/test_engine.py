"""Layer-2 engine tests — every kb/06 §10 worked example + D's 07 Jul rulings + determinism."""

import pytest

from app.config import get_config
from app.engine import assess
from app.kb import load_kb
from app.models import (
    Adequacy, CatProfile, ExtractProcessed, FoodType, GuaranteedAnalysis,
    GuaranteedAnalysisItem, Lifestage, Verdict,
)

KB = load_kb()
CFG = get_config()

ADULT = CatProfile(id="c1", cat_name="Luna", cat_age_year=3, body_condition=2)
KITTEN = CatProfile(id="c2", cat_name="Toto", cat_age_year=0, cat_age_month=5, body_condition=2)
SENIOR = CatProfile(id="c3", cat_name="Meow", cat_age_year=10, body_condition=2)


def food(**kw) -> ExtractProcessed:
    base = dict(
        brand="TestBrand", variant="Adult Chicken", lifestage=Lifestage.adult,
        type=FoodType.dry, adequacy=Adequacy.complete,
        ingredients=["chicken (30%)", "rice", "chicken fat", "dried beet pulp"],
        additives=["taurine", "vitamins", "minerals"],
        guaranteed_analysis=GuaranteedAnalysis(protein=0.32, fat=0.14, fibre=0.025, moisture=0.08),
        taurine_added=True, confidence=0.95,
    )
    base.update(kw)
    return ExtractProcessed(**base)


def run(extract, cats=(ADULT,)):
    return assess(extract, list(cats), KB, CFG)


# ── kb/06 §10 worked examples ────────────────────────────────────────

def test_clean_complete_dry_is_buy():
    r = run(food())
    assert r.verdict == Verdict.buy
    assert "IS-11968" in r.standards_cited
    assert "✅" in r.per_cat_callouts[0].note


def test_kitten_wet_complete_high_protein_is_buy():
    wet = food(lifestage=Lifestage.kitten, type=FoodType.wet,
               ingredients=["chicken", "chicken liver", "fish broth"],
               guaranteed_analysis=GuaranteedAnalysis(protein=0.086, fat=0.04, moisture=0.78))
    assert run(wet, [KITTEN]).verdict == Verdict.buy


def test_unknown_adequacy_is_buy_with_conditions():
    r = run(food(adequacy=Adequacy.unknown,
                 guaranteed_analysis=GuaranteedAnalysis(protein=0.40, fat=0.18, moisture=0.09)))
    assert r.verdict == Verdict.buy_with_conditions
    assert any("complete" in c for c in r.conditions)


def test_complementary_wet_is_skip_as_meal_with_topper_allowance():
    r = run(food(adequacy=Adequacy.complementary, type=FoodType.wet,
                 ingredients=["tuna", "water"], taurine_added=None,
                 guaranteed_analysis=GuaranteedAnalysis(protein=0.12, moisture=0.82)))
    assert r.verdict == Verdict.skip and r.use_as == "topper"
    assert "topper" in r.headline


def test_filler_dominated_dry_is_skip():
    r = run(food(ingredients=["cereals", "maize gluten", "chicken meal", "rice"]))
    assert r.verdict == Verdict.skip
    assert any("obligate carnivore" in c for c in r.conditions)


def test_artificial_colour_is_skip():
    r = run(food(additives=["taurine", "colouring agents"]))
    assert r.verdict == Verdict.skip
    assert any("colour" in c for c in r.conditions)


def test_below_protein_minimum_is_skip():
    # 20% as-fed at 10% moisture -> 22.2% DM < 26 adult minimum
    r = run(food(guaranteed_analysis=GuaranteedAnalysis(protein=0.20, fat=0.14, moisture=0.10)))
    assert r.verdict == Verdict.skip
    assert any("crude protein" in c for c in r.conditions)


def test_urinary_diet_is_vet_diet_with_condition_matching():
    uri = food(intended_use="urinary diet", lifestage=Lifestage.medical)
    sick = CatProfile(id="c9", cat_name="Simba", cat_age_year=4,
                      health_condition=["Urinary issues"])
    r = assess(uri, [sick, ADULT], KB, CFG)
    assert r.verdict == Verdict.vet_diet and r.categories is None
    notes = {c.cat_name: c.note for c in r.per_cat_suitability}
    assert "may suit" in notes["Simba"] and "hold off" in notes["Luna"]
    assert r.vet_disclaimer


# ── D's 07 Jul rulings ───────────────────────────────────────────────

def test_medical_lifestage_alone_triggers_vet_diet():
    assert run(food(lifestage=Lifestage.medical, intended_use=None)).verdict == Verdict.vet_diet


def test_breed_pack_scores_normally_with_callout():
    r = run(food(lifestage=Lifestage.breed))
    assert r.verdict == Verdict.buy
    assert any("breed-specific" in c.note for c in r.per_cat_callouts)


def test_missing_taurine_on_complete_food_is_strict_skip():
    r = run(food(taurine_added=None, additives=["vitamins"]))
    assert r.verdict == Verdict.skip
    assert any("taurine" in c for c in r.conditions)


def test_unknown_pack_lifestage_is_minor_flag_not_skip():
    r = run(food(lifestage=Lifestage.unknown))
    assert r.verdict == Verdict.buy  # single minor rides along as a note
    assert any("life stage" in c.lower() for c in r.conditions)
    assert any("check the pack" in c.note.lower() for c in r.per_cat_callouts)


# ── flag tiers, gate, multi-cat, nudges, determinism ─────────────────

def test_major_flag_blocks_clean_buy():
    r = run(food(ingredients=["meat and animal derivatives", "rice", "chicken fat", "beet pulp"]))
    assert r.verdict == Verdict.buy_with_conditions
    assert any("generic" in c for c in r.conditions)


def test_three_majors_stack_to_skip():
    r = run(food(ingredients=["meat and animal derivatives", "wheat gluten", "rice", "beet pulp"],
                 additives=["taurine", "sugars"]))
    assert r.verdict == Verdict.skip


def test_low_confidence_is_no_verdict():
    r = run(food(confidence=0.3))
    assert r.verdict == Verdict.no_verdict


def test_unreadable_ingredients_is_no_verdict():
    r = run(food(unreadable_fields=["ingredients"]))
    assert r.verdict == Verdict.no_verdict


def test_multicat_adult_food_flags_kitten_without_global_skip():
    r = run(food(), [ADULT, KITTEN])
    assert r.verdict == Verdict.buy
    notes = {c.cat_name: c.note for c in r.per_cat_callouts}
    assert "✅" in notes["Luna"] and "Skip for Toto" in notes["Toto"]


def test_verdict_is_pack_dependent_regardless_of_cats():
    # D 08 Jul: same pack -> same verdict for any cat selection; suitability = callouts
    assert (run(food(), [KITTEN]).verdict == run(food(), [ADULT]).verdict
            == run(food(), []).verdict == Verdict.buy)
    assert "Skip for Toto" in run(food(), [KITTEN]).per_cat_callouts[0].note


def test_kitten_food_for_adult_gets_calorie_density_callout():
    kf = food(lifestage=Lifestage.kitten,
              guaranteed_analysis=GuaranteedAnalysis(protein=0.35, fat=0.15, moisture=0.08))
    r = run(kf, [ADULT])
    assert r.verdict == Verdict.buy  # pack scored as kitten food on the growth tier
    assert "calorie-dense" in r.per_cat_callouts[0].note and "⚠️" in r.per_cat_callouts[0].note
    skinny = CatProfile(id="c7", cat_name="Slim", cat_age_year=4, body_condition=1)
    note = run(kf, [skinny]).per_cat_callouts[0].note
    assert "⚠️" not in note and "vet" in note  # underweight exception


def test_all_life_stages_uses_growth_tier():
    # 28% as-fed at 8% moisture -> 30.4% DM: passes adult (26) AND growth (30)
    ok = food(lifestage=Lifestage.all_life_stages,
              guaranteed_analysis=GuaranteedAnalysis(protein=0.28, fat=0.14, moisture=0.08))
    assert run(ok, [KITTEN, ADULT]).verdict == Verdict.buy
    # 25% as-fed -> 27.2% DM: passes adult but fails growth -> skip on the pack's own tier
    low = food(lifestage=Lifestage.all_life_stages,
               guaranteed_analysis=GuaranteedAnalysis(protein=0.25, fat=0.14, moisture=0.08))
    assert run(low, [KITTEN, ADULT]).verdict == Verdict.skip
    assert run(low, []).verdict == Verdict.skip  # cats don't change it


def test_senior_gets_adult_tier_and_management_callout():
    r = run(food(), [SENIOR])
    assert r.verdict == Verdict.buy
    assert any("senior" in c.note.lower() for c in r.per_cat_callouts)


def test_health_and_weight_nudges_fire_with_cat_name():
    cat = CatProfile(id="c8", cat_name="Chonk", cat_age_year=5, body_condition=4,
                     health_condition=["Diabetes"])
    r = run(food(), [cat])
    assert sum("Chonk" in n for n in r.health_nudges) == 2
    assert any("diabetes" in n.lower() for n in r.health_nudges)
    assert not any("{cat_name}" in n for n in r.health_nudges)


def test_no_profile_assumes_adult_with_note():
    r = run(food(), [])
    assert r.verdict == Verdict.buy
    assert any("adult-cat analysis" in c for c in r.conditions)


def test_deterministic():
    a = run(food(), [ADULT, KITTEN]).model_dump()
    b = run(food(), [ADULT, KITTEN]).model_dump()
    assert a == b
