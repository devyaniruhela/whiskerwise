"""Layer 2 — deterministic rules engine implementing kb/06_verdict_logic.md v3.
Same input -> same verdict. No LLM. Every judgment names its rule; thresholds come
from kb/02, ingredient judgments from kb/03, nudge copy from kb/05, tunables from
app/config.yaml (kb/06 §9). Section numbers in comments refer to kb/06.

Multi-cat interpretation (kb/06 §7 + §4.2 "skip for that cat" + the Luna/Toto
worked example): the food is scored once per cat's tier; the shared verdict is
taken from the cats whose life stage the pack covers, and divergent cats get
per-cat callouts. Only if the pack suits none of the selected cats does the
life-stage hard fail become the shared verdict.
"""

from typing import Optional

from .kb import KB, IngredientRow
from .models import (
    Adequacy,
    CatProfile,
    CategoryResult,
    ExtractProcessed,
    FoodType,
    Lifestage,
    PerCatCallout,
    Report,
    Verdict,
)
from .normalize import lookup

ENGINE_VERSION = "0.1.0"
IS = "IS-11968"
GA_TO_KB = {"protein": "crude_protein", "fat": "total_fat", "fibre": "crude_fibre"}
VET_DISCLAIMER = ("For any therapeutic/prescription diet, check with your vet before "
                  "introducing it to your cat.")


# ── helpers ──────────────────────────────────────────────────────────

def cat_stage(cat: CatProfile, kb: KB) -> str:
    months = (cat.cat_age_year or 0) * 12 + (cat.cat_age_month or 0)
    for name in ("kitten", "adult", "senior"):
        r = kb.lifestages[name]
        if (r.age_min_months is None or months >= r.age_min_months) and (
            r.age_max_months is None or months < r.age_max_months
        ):
            return name
    return "adult"


def _fit(pack: Lifestage, stage: str) -> str:
    """Cat-suitability signal (callouts only, never verdict — kb/06 §7 v4):
    match | over (growth food for an adult) | under (adult food for a kitten) | unknown."""
    if pack in (Lifestage.all_life_stages, Lifestage.breed):
        return "match"             # kb/01: all-life-stages matches any cat
    if pack == Lifestage.unknown:
        return "unknown"
    if stage == "kitten" and pack.value != "kitten":
        return "under"
    if pack == Lifestage.kitten and stage != "kitten":
        return "over"
    return "match"                 # adult/senior packs for adult/senior cats


def _underweight(cat: CatProfile) -> bool:
    return cat.body_condition == 1 or (cat.body_condition_score or 5) <= 3


def _dm(as_fed_pct: float, moisture_pct: float) -> float:
    return as_fed_pct / (100.0 - moisture_pct) * 100.0


def _ga_values(extract: ExtractProcessed) -> dict[str, float]:
    """Declared GA as % as-fed, keyed by kb/02 nutrient name (CSV stores fractions 0-1)."""
    ga = extract.guaranteed_analysis
    vals = {}
    for key, kb_name in GA_TO_KB.items():
        v = getattr(ga, key)
        if v is not None:
            vals[kb_name] = v * 100.0
    for item in ga.others:
        name = item.label.strip().lower().replace(" ", "_")
        if "%" in item.value:
            try:
                vals.setdefault(name, float(item.value.replace("%", "").strip()))
            except ValueError:
                pass
    return vals


def _taurine_declared(extract: ExtractProcessed, matched: list[tuple[str, Optional[IngredientRow]]]) -> bool:
    if extract.taurine_added:
        return True
    if any(r and r.canonical_name == "taurine" for _, r in matched):
        return True
    return any("taurine" in i.label.lower() for i in extract.guaranteed_analysis.others)


def _is_treat(extract: ExtractProcessed) -> bool:
    return extract.adequacy == Adequacy.treat or extract.type in (FoodType.creamy_treat, FoodType.other_treat)


def _match_condition_to_purpose(purpose: str, conditions: list[str]) -> bool:
    p = purpose.lower()
    aliases = {  # therapeutic purpose keyword -> condition keywords a cat profile might carry
        "urinary": ["urinary", "struvite", "flutd"], "renal": ["kidney", "renal"],
        "kidney": ["kidney", "renal"], "gi": ["gastro", "ibd", "digest"],
        "gastro": ["gastro", "ibd", "digest"], "hypoallergenic": ["allerg"],
        "anallergic": ["allerg"], "obesity": ["obes", "overweight"], "satiety": ["obes", "overweight"],
        "diabet": ["diabet"], "hairball": ["hairball"], "dental": ["dental", "gingivitis"],
    }
    for cond in conditions:
        c = cond.lower()
        for kw, cond_kws in aliases.items():
            if kw in p and any(k in c for k in cond_kws):
                return True
        if any(w and w in p for w in c.replace("/", " ").split() if len(w) > 4):
            return True
    return False


def _nudges_for(cats: list[CatProfile], kb: KB) -> list[str]:
    out = []
    for cat in cats:
        for cond in cat.health_condition:
            c = cond.strip().lower()
            key = kb.nudge_labels.get(c) or next(
                (k for k in kb.nudges if k != "other" and (k.split("_")[0] in c or c in k)), None)
            if key:
                out.append(kb.nudges[key].replace("{cat_name}", cat.cat_name))
            elif c and c not in ("none",):
                out.append(kb.nudges["other"].replace("{cat_name}", cat.cat_name)
                           .replace("{description}", cond))
        bc = cat.body_condition_score or {1: 2, 2: 5, 3: 7, 4: 9}.get(cat.body_condition or 0)
        if bc and bc <= 3:
            out.append(kb.nudges["underweight"].replace("{cat_name}", cat.cat_name))
        elif bc and bc >= 6:
            out.append(kb.nudges["overweight"].replace("{cat_name}", cat.cat_name))
    return out


# ── the assessment ───────────────────────────────────────────────────

def assess(extract: ExtractProcessed, cats: list[CatProfile], kb: KB, cfg: dict) -> Report:
    tun = cfg["verdict_tunables"]
    core = list(tun["core_nutrients"])

    # §2 data-quality gate
    unreadable = {u.lower() for u in extract.unreadable_fields}
    if (extract.confidence is not None and extract.confidence < cfg["pipeline"]["confidence_floor"]) or (
        unreadable & {"ingredients", "guaranteed_analysis", "protein", "fat"}
    ):
        return Report(
            verdict=Verdict.no_verdict,
            headline="We couldn't read the label clearly — please retake the photos.",
            detailed_rationale="Extraction confidence too low or key fields unreadable (kb/06 §2).",
            standards_cited=[], data_quality_warning="Low extraction confidence — no verdict issued.",
        )

    # §3 therapeutic track: intended_use therapeutic marker OR lifestage=medical (D, 07 Jul 2026)
    purpose = (extract.intended_use or "").strip()
    is_therapeutic = any(k in purpose.lower() for k in kb.therapeutic_keywords) if purpose else False
    if is_therapeutic or extract.lifestage == Lifestage.medical:
        purpose_txt = purpose or "a vet-directed condition"
        suitability, callouts = [], []
        for cat in cats:
            if _match_condition_to_purpose(purpose_txt, cat.health_condition):
                note = (f"As per your input, this may suit {cat.cat_name}, who has a matching "
                        f"condition — but only if your vet prescribes it.")
            else:
                note = (f"We'd hold off feeding this to {cat.cat_name} (no matching condition "
                        f"on file) unless your vet advises it.")
            suitability.append(PerCatCallout(cat_id=cat.id, cat_name=cat.cat_name, note=note))
        return Report(
            verdict=Verdict.vet_diet,
            headline=f"Vet-directed diet — talk to your vet before feeding this.",
            therapeutic_purpose=(f"This is a therapeutic diet for cats with {purpose_txt}. "
                                 "It's formulated for their specific needs."),
            per_cat_suitability=suitability,
            vet_disclaimer=VET_DISCLAIMER,
            health_nudges=_nudges_for(cats, kb),
            detailed_rationale=("Therapeutic/prescription diets deliberately deviate from general "
                                "minimums, so Wiser does not score them Buy/Skip (kb/06 §3). Wiser "
                                "does not confirm the food treats the condition."),
            standards_cited=["WSAVA"],
        )

    # Pack-dependent tier (D, 08 Jul 2026): the food is scored as what it claims to be.
    # kitten / all-life-stages -> growth tier; adult / senior / breed / unknown -> adult tier.
    tier = "growth" if extract.lifestage in (Lifestage.kitten, Lifestage.all_life_stages) else "adult"
    stages = {cat.id or cat.cat_name: cat_stage(cat, kb) for cat in cats}
    fits = {k: _fit(extract.lifestage, s) for k, s in stages.items()}
    assumed_adult = not cats

    # Ingredients: normalize + KB lookup (pack order preserved)
    matched: list[tuple[str, Optional[IngredientRow]]] = []
    for token in extract.ingredients + extract.additives:
        matched.extend(lookup(kb, token))
    n_ing = sum(len(lookup(kb, t)) for t in extract.ingredients)
    ing_matched = matched[:n_ing]  # ingredient-list part only (positional rules)

    # GA checks vs kb/02 (declared values, DM basis; as-fed assumed per D 07 Jul)
    moisture = extract.guaranteed_analysis.moisture
    moisture_pct = (moisture * 100.0) if moisture is not None else float(
        tun["assumed_moisture_pct"]["wet" if extract.type == FoodType.wet else "dry"])
    ga = _ga_values(extract)
    below, above, meets = [], [], []
    for name, as_fed in ga.items():
        th = kb.thresholds.get(name)
        if th is None or not th.mvp_use.startswith("yes") or name in ("moisture", "ca_p_ratio"):
            continue
        dm = _dm(as_fed, moisture_pct) if th.basis == "DM" else as_fed
        minimum = th.growth_min if tier == "growth" else th.adult_min
        if minimum is not None and dm < minimum:
            below.append(f"{name.replace('_', ' ')} ({dm:.1f}% DM vs {minimum}% {IS} minimum)")
        elif th.max_ is not None and dm > th.max_:
            above.append(f"{name.replace('_', ' ')} ({dm:.1f}% DM vs {th.max_}% {IS} maximum)")
        else:
            meets.append(name)

    claims_complete = extract.adequacy == Adequacy.complete
    missing_core = [n for n in core
                    if (GA_TO_KB.get(n, n) not in ga)
                    and not (n == "taurine" and _taurine_declared(extract, matched))]

    # Flags from kb/03
    first = ing_matched[0][1] if ing_matched else None
    major, minor, colour_hits = [], [], []
    for norm, row in matched:
        if row is None:
            continue
        if "artificial_colour" in row.flags:
            colour_hits.append(norm)
    if first is not None and "generic_protein" in first.flags:
        major.append(f"primary ingredient is a generic/unnamed protein ({first.canonical_name})")
    if any(r and "protein_boost" in r.flags for _, r in matched):
        major.append("plant-protein boosting (gluten lifting the protein figure)")
    if not _is_treat(extract) and any(r and "sugar" in r.flags for _, r in matched):
        major.append("added sugar in a non-treat food")
    if extract.adequacy == Adequacy.unknown and missing_core:
        major.append("couldn't confirm the key nutrients from the label (insufficient data)")
    if any(r and "artificial_preservative" in r.flags for _, r in matched):
        minor.append("artificial preservative present")
    # cat-dependent signals (assumed_adult, over-fit) are callouts, never flags (kb/06 v4)
    if extract.lifestage == Lifestage.unknown:
        minor.append("pack life stage unstated — assessed as adult maintenance (check the pack)")
    other_cautions = sorted({r.canonical_name for _, r in matched
                             if r and r.evaluation == "caution"
                             and not r.flags & {"generic_protein", "protein_boost", "sugar",
                                                "artificial_preservative", "artificial_colour"}})
    if other_cautions:
        minor.append("caution ingredients: " + ", ".join(other_cautions))

    # Filler dominance (dry only, §4.3); marketing hacks folded in by canonical-row counting
    fd = tun["filler_dominance"]
    filler_dominated = False
    if extract.type == FoodType.dry and ing_matched:
        topn = [r for _, r in ing_matched[: fd["animal_protein_top_n"]]]
        no_animal_top = not any(r and r.category in ("named_animal_protein", "unnamed_animal_protein")
                                for r in topn)
        top4 = [r for _, r in ing_matched[: fd["filler_window_top_n"]]]
        fillers = sum(1 for r in top4 if r and (r.category == "grain_carb" or "carb" in r.flags))
        filler_dominated = no_animal_top or fillers >= fd["filler_min_count"]

    # §4 hard fails
    skip_reasons = []
    if claims_complete and (below or (above and tun["micros_count_toward_hard_fail"])):
        skip_reasons.append("Labelled a complete food, but " + "; ".join(below + above)
                            + f" for {tier} ({IS}).")
    if filler_dominated:
        skip_reasons.append("This dry food is built mainly on grains/fillers rather than animal "
                            "protein — a poor fit for an obligate carnivore.")
    if tun["artificial_colour_skip"] and colour_hits:
        skip_reasons.append("Contains added colour — purely cosmetic, of no benefit to your cat, "
                            "and a signal the product prioritises appearance.")
    if claims_complete and missing_core:  # §4.6 strict stance (D, 07 Jul 2026)
        skip_reasons.append("Labelled a complete food, but " + ", ".join(missing_core)
                            + " is not declared on the label — missing means we assume it's not "
                            "present. We have to be strict.")
    if len(major) >= tun["stacked_major_flags_skip"]:
        skip_reasons.append("Multiple red flags stack up: " + "; ".join(major) + ".")

    # Per-cat suitability callouts (§7 v4) — never verdict inputs
    callouts = []
    for cat in cats:
        k = cat.id or cat.cat_name
        f, s = fits[k], stages[k]
        if f == "under":
            note = f"⚠️ Skip for {cat.cat_name} (kitten) — this formula won't meet growth needs."
        elif f == "over" and not _underweight(cat):
            note = (f"⚠️ This growth formula is calorie-dense for {cat.cat_name} ({s}) — "
                    "a maintenance food suits them better.")
        elif f == "over":
            note = (f"✅ {cat.cat_name} ({s}, on the lighter side): this calorie-dense growth "
                    "formula can be acceptable for gaining weight — confirm with your vet.")
        elif f == "unknown":
            note = f"⚠️ Couldn't confirm this food's life stage — check the pack before feeding {cat.cat_name} ({s})."
        elif s == "senior":
            note = (f"✅ Suitable for {cat.cat_name} (senior — assessed on the adult standard; "
                    "no separate senior profile exists, so keep up vet checks).")
        else:
            note = f"✅ Good for {cat.cat_name} ({s})."
        callouts.append(PerCatCallout(cat_id=cat.id, cat_name=cat.cat_name, note=note))
    if extract.lifestage == Lifestage.breed:
        callouts.append(PerCatCallout(cat_name="all", note=(
            "This is a breed-specific formula — assessed on the standard for its underlying life "
            "stage; being breed-specific is neither a plus nor a minus here.")))

    # §3 adequacy role + §6 decision table
    conditions, use_as = [], None
    ga_note = ("meets the declared minimums" if not (below or above) and ga else "insufficient data")
    if _is_treat(extract):
        verdict = Verdict.skip
        use_as = "treat"
        headline = "Skip as a meal — treat only."
        conditions.append(f"Treat only — keep under {tun['treat_calorie_pct_max']}% of daily calories.")
    elif extract.adequacy == Adequacy.complementary:
        verdict = Verdict.skip
        use_as = "topper"
        headline = "Skip as a main meal — good as an occasional topper."
        conditions.append("A complementary food is a part-diet: fine as an occasional topper, "
                          "never the only meal. Vary the proteins you top with.")
    elif skip_reasons:
        verdict = Verdict.skip
        headline = "Skip — " + skip_reasons[0].split("—")[0].strip().rstrip(".") + "."
        conditions.extend(skip_reasons)
        if major:
            conditions.append("Also flagged: " + "; ".join(major) + ".")
    elif extract.adequacy == Adequacy.unknown:
        verdict = Verdict(tun["unknown_adequacy_verdict"])
        headline = "Buy with conditions — we couldn't confirm this is a complete food."
        conditions.append("Couldn't confirm this is a complete food — don't rely on it as the sole "
                          "meal until the pack's completeness statement is verified.")
        conditions.extend(major)
    elif major or len(minor) >= tun["minor_flags_to_conditions"]:
        verdict = Verdict.buy_with_conditions
        lead = major[0] if major else minor[0]
        headline = f"Buy with conditions — {lead}."
        conditions.extend(major + minor)
    else:
        verdict = Verdict.buy
        headline = "Buy — meets the standard with a clean label."
        conditions.extend(minor)  # 0–1 minors ride along as notes

    categories = {
        "completeness": CategoryResult(result=extract.adequacy.value,
                                       note="Complete foods are scored fully; part-diets are use-limited."),
        "life_stage": CategoryResult(
            result="assumed_adult" if assumed_adult else ",".join(sorted(set(fits.values()))) or "n/a",
            note=f"Declared: {extract.lifestage.value}; assessed on the {tier} tier ({IS})."),
        "guaranteed_analysis": CategoryResult(
            result="below" if below or above else ("meets" if ga else "insufficient_data"),
            note=f"Declared nutrients vs {IS} {tier} minimums (dry-matter basis, as-fed assumed): {ga_note}.",
            flags=below + above),
        "ingredients": CategoryResult(
            result="flags" if (major or colour_hits) else "clean",
            note="Judged on transparency and function (WSAVA-aligned), not stigma.",
            flags=major + minor),
    }

    rationale = " ".join(
        [f"Adequacy: {extract.adequacy.value}."]
        + ([f"Hard fails: {'; '.join(skip_reasons)}"] if skip_reasons else [])
        + ([f"Major flags: {'; '.join(major)}."] if major else [])
        + ([f"Minor flags: {'; '.join(minor)}."] if minor else [])
        + [f"Guaranteed analysis ({tier}, DM): "
           + (", ".join(f"{m} meets" for m in meets) if meets else "no checkable declarations")
           + (f"; below: {'; '.join(below)}" if below else "")
           + (f"; above max: {'; '.join(above)}" if above else "") + "."]
    )

    if assumed_adult:
        conditions.append("General adult-cat analysis — add your cat's details for a tailored result.")

    warning = None
    if extract.confidence is not None and extract.confidence < 0.8:
        warning = "Some label details were hard to read — treat borderline calls with care."
    if moisture is None and ga:
        conditions.append(f"Moisture wasn't declared — we assumed {moisture_pct:.0f}% for a "
                          f"{extract.type.value} food when converting to dry matter.")

    return Report(
        verdict=verdict, headline=headline, use_as=use_as, conditions=conditions,
        categories=categories, per_cat_callouts=callouts,
        health_nudges=_nudges_for(cats, kb),
        detailed_rationale=rationale,
        standards_cited=[IS, "WSAVA"] + (["FEDIAF"] if "taurine" in ga else []),
        data_quality_warning=warning,
    )
