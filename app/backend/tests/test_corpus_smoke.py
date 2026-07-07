"""Robustness smoke test over the real 55-pack corpus: every extracted pack must
assess without crashing, verdicts must not collapse to one value, and the
ingredient normalizer's match rate is reported (tuning signal, not a hard gate)."""

import csv
import re
from pathlib import Path

import pytest

from app.config import get_config
from app.engine import assess
from app.kb import load_kb
from app.models import Adequacy, ExtractProcessed, FoodType, GuaranteedAnalysis, Lifestage
from app.normalize import lookup

CORPUS = Path(__file__).resolve().parents[4] / "00-cat-care-research/cat-food/cat_food_ingredients.csv"


def _enum(cls, raw: str, default):
    raw = (raw or "").strip().lower()
    for member in cls:
        if member.value in raw or raw in member.value:
            return member
    return default


def _ga(raw: str) -> GuaranteedAnalysis:
    vals = {}
    for key in ("protein", "fat", "fibre", "ash", "moisture"):
        m = re.search(rf"{key}[^0-9]*([0-9.]+)", raw or "", re.I)
        if m:
            try:
                v = float(m.group(1))
                vals[key] = v if v <= 1 else v / 100.0
            except ValueError:
                pass
    return GuaranteedAnalysis(**vals)


@pytest.mark.skipif(not CORPUS.exists(), reason="research corpus not present")
def test_corpus_smoke():
    kb, cfg = load_kb(), get_config()
    with open(CORPUS, encoding="utf-8") as f:
        rows = [r for r in csv.DictReader(f) if (r.get("ingredients") or "").strip()]
    assert len(rows) >= 40, "corpus unexpectedly small"

    verdicts, total_tokens, matched_tokens, unmatched = {}, 0, 0, set()
    for row in rows:
        ingredients = [t.strip() for t in row["ingredients"].split(",") if t.strip()]
        additives = [t.strip() for t in (row.get("additives") or "").split(",") if t.strip()]
        extract = ExtractProcessed(
            brand=row.get("brand"),
            lifestage=_enum(Lifestage, row.get("lifestage"), Lifestage.unknown),
            type=_enum(FoodType, row.get("type"), FoodType.unknown),
            adequacy=_enum(Adequacy, row.get("adequacy"), Adequacy.unknown),
            intended_use=(row.get("intendedUse") or row.get("intended_use") or None),
            ingredients=ingredients,
            additives=additives,
            guaranteed_analysis=_ga(row.get("guaranteed_analysis") or ""),
            taurine_added=(row.get("taurine_added") or "").strip().lower() == "true" or None,
            confidence=0.9,
        )
        report = assess(extract, [], kb, cfg)  # must never raise
        verdicts[report.verdict.value] = verdicts.get(report.verdict.value, 0) + 1
        for token in ingredients + additives:
            for norm, hit in lookup(kb, token):
                total_tokens += 1
                if hit:
                    matched_tokens += 1
                else:
                    unmatched.add(norm)

    rate = matched_tokens / total_tokens if total_tokens else 0
    print(f"\ncorpus: {len(rows)} packs · verdicts {verdicts} · "
          f"ingredient match rate {rate:.0%} · unmatched {len(unmatched)}: "
          f"{sorted(unmatched)[:15]}…")
    assert len(verdicts) >= 2, f"engine collapsed to one verdict: {verdicts}"
    assert rate >= 0.5, f"normalizer match rate too low: {rate:.0%}"
