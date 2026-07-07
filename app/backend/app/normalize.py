"""Ingredient normalization + alias lookup, per kb/ingredient-master-rules.md:
lowercase -> strip quantities/percentages -> strip strain suffixes -> split on + and : -> match aliases.
Unmatched tokens are returned as None matches (surfaced, never silently scored).
"""

import re
from typing import Optional

from .kb import KB, IngredientRow

_QTY = re.compile(r"\(\s*[\d.,]+\s*(?:%|iu|iu/kg|mg|g|kcal)[^)]*\)|\b[\d.,]+\s*(?:%|iu|iu/kg|mg/kg)\b", re.I)
_STRAIN = re.compile(r"\b(?:[a-z]{1,4}[- ]?\d{2,}[a-z0-9-]*)\b", re.I)  # e.g. r175, DSM 12345
_CLEAN = re.compile(r"[^a-z0-9&/'\- ]+")


def normalize_token(raw: str) -> str:
    s = raw.lower()
    s = _QTY.sub(" ", s)
    s = _STRAIN.sub(" ", s)
    s = _CLEAN.sub(" ", s)
    return re.sub(r"\s+", " ", s).strip(" -")


def split_compound(raw: str) -> list[str]:
    return [p for p in re.split(r"[+:]", raw) if p.strip()]


def lookup(kb: KB, raw: str) -> list[tuple[str, Optional[IngredientRow]]]:
    """One pack token -> [(normalized_part, matched_row_or_None), ...]."""
    out = []
    for part in split_compound(raw):
        norm = normalize_token(part)
        if not norm:
            continue
        row = kb.alias_index.get(norm)
        if row is None:  # tolerate a leading qualifier, e.g. "fresh whole chicken"
            words = norm.split()
            for i in range(1, min(3, len(words))):
                row = kb.alias_index.get(" ".join(words[i:]))
                if row:
                    break
        out.append((norm, row))
    return out
