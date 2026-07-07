"""KB loaders — read kb/ in place (single source of truth, CLAUDE.md).
No threshold, judgment, or copy lives in code; this module only parses:
  01_lifestage.csv · 02_nutrient_thresholds.csv · 03_ingredients_master.csv · 05_health_nudges.md
Validated at startup: a malformed KB should fail loudly, not score quietly.
"""

import csv
import re
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Optional

from .config import get_config


@dataclass
class LifestageRule:
    life_stage: str
    aliases: list[str]
    age_min_months: Optional[float]
    age_max_months: Optional[float]
    nutrient_tier: str            # "growth" | "adult" | "out_of_scope"
    management_notes: str


@dataclass
class NutrientThreshold:
    nutrient: str
    unit: str
    basis: str
    growth_min: Optional[float]
    adult_min: Optional[float]
    max_: Optional[float]
    mvp_use: str


@dataclass
class IngredientRow:
    canonical_name: str
    category: str
    purpose: str
    evaluation: str               # positive | neutral | caution | negative
    flags: set[str]
    function_note: str
    concern_note: str
    counterpoint: str


@dataclass
class KB:
    lifestages: dict[str, LifestageRule]
    thresholds: dict[str, NutrientThreshold]
    alias_index: dict[str, IngredientRow]     # normalized alias -> row
    nudges: dict[str, str]                    # key -> template ({cat_name}, {description})
    nudge_labels: dict[str, str]              # normalized dropdown label -> key
    therapeutic_keywords: list[str]           # from kb/01 medical aliases
    ingredient_rows: list[IngredientRow] = field(default_factory=list)


_NUM = re.compile(r"-?\d+(?:\.\d+)?")


def _num(cell: str) -> Optional[float]:
    """First numeric value in a cell, else None ('-', 'ND', '' -> None)."""
    m = _NUM.search(cell or "")
    return float(m.group()) if m else None


def _age_bounds(age_range: str) -> tuple[Optional[float], Optional[float]]:
    """'6 weeks - 12 months' / '~7 years +' -> (min_months, max_months)."""
    parts = re.findall(r"(\d+(?:\.\d+)?)\s*(week|month|year)", age_range or "")
    to_months = {"week": 0.25, "month": 1.0, "year": 12.0}
    vals = [float(n) * to_months[u] for n, u in parts]
    if not vals:
        return None, None
    if "+" in age_range or len(vals) == 1:
        return vals[0], None
    return vals[0], vals[1]


def _load_lifestages(path: Path) -> tuple[dict[str, LifestageRule], list[str]]:
    stages, therapeutic_kw = {}, []
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            tier_raw = row["nutrient_tier_applied"].lower()
            tier = "growth" if "growth" in tier_raw or "kitten" in tier_raw else (
                "out_of_scope" if "out of scope" in tier_raw else "adult")
            lo, hi = _age_bounds(row["age_range"])
            aliases = [a.strip().lower() for a in row["aliases"].split(";") if a.strip()]
            stages[row["life_stage"]] = LifestageRule(
                row["life_stage"], aliases, lo, hi, tier, row["management_notes"])
            if row["life_stage"] == "medical":
                therapeutic_kw = aliases + ["medical", "therapeutic", "veterinary", "prescription"]
    return stages, therapeutic_kw


def _load_thresholds(path: Path) -> dict[str, NutrientThreshold]:
    out = {}
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            out[row["nutrient"]] = NutrientThreshold(
                nutrient=row["nutrient"],
                unit=row["unit"],
                basis=row["basis"],
                growth_min=_num(row["is11968_growth_min"]),
                adult_min=_num(row["is11968_adult_min"]),
                max_=_num(row["is11968_max"]),
                mvp_use=row["mvp_use"].strip(),
            )
    return out


def _load_ingredients(path: Path) -> tuple[dict[str, IngredientRow], list[IngredientRow]]:
    index, rows = {}, []
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            ing = IngredientRow(
                canonical_name=row["canonical_name"],
                category=row["category"],
                purpose=row["purpose"],
                evaluation=row["evaluation"].strip().lower(),
                flags={x.strip() for x in row["flags"].split(";") if x.strip()},
                function_note=row["function_note"],
                concern_note=row["concern_note"],
                counterpoint=row["counterpoint"],
            )
            rows.append(ing)
            for alias in row["aliases"].split(";"):
                alias = alias.strip().lower()
                if alias:
                    index[alias] = ing
            index.setdefault(row["canonical_name"].strip().lower(), ing)
    return index, rows


def _load_nudges(path: Path) -> tuple[dict[str, str], dict[str, str]]:
    """Parse the §1/§2 markdown tables: | `key` | label | template | source | status |"""
    nudges, labels = {}, {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|") or line.startswith("| Key") or line.startswith("| ---") or set(line) <= {"|", "-", " "}:
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 3:
            continue
        key_m = re.match(r"`([a-z_]+)`", cells[0])
        if not key_m:
            continue
        key = key_m.group(1)
        template = cells[2].strip().strip('"')
        if not template.startswith("{cat_name}"):
            continue
        nudges[key] = template
        labels[cells[1].strip().lower()] = key
    return nudges, labels


@lru_cache
def load_kb() -> KB:
    kb_dir = get_config()["_paths"]["kb_dir"]
    lifestages, therapeutic_kw = _load_lifestages(kb_dir / "01_lifestage.csv")
    thresholds = _load_thresholds(kb_dir / "02_nutrient_thresholds.csv")
    alias_index, rows = _load_ingredients(kb_dir / "03_ingredients_master.csv")
    nudges, labels = _load_nudges(kb_dir / "05_health_nudges.md")

    # Fail loudly on a broken KB
    assert {"kitten", "adult", "senior", "all_life_stages", "medical"} <= set(lifestages), "kb/01 missing life stages"
    assert {"crude_protein", "total_fat", "taurine"} <= set(thresholds), "kb/02 missing core nutrients"
    assert len(rows) >= 40, "kb/03 unexpectedly small"
    assert {"diabetes", "overweight", "underweight", "other"} <= set(nudges), "kb/05 nudge tables not parsed"
    return KB(lifestages, thresholds, alias_index, nudges, labels, therapeutic_kw, rows)
