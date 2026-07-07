"""Live Gemini smoke — QC + extraction on one real sample pair, then Layer 2 end-to-end.
Runs only when GEMINI_API_KEY is set (loaded from app/backend/.env). Costs one QC call
per image + one extraction call. Full-corpus bake-off is deferred to Phase 7 per D.
"""

import os
from pathlib import Path

import pytest

from app.config import get_config
from app.engine import assess
from app.kb import load_kb

PICS = Path(__file__).resolve().parents[4] / "00-cat-care-research/cat-food/Cat-food-pics"
FRONT = PICS / "Applaws-Chicken-Breast-in-Broth-(Can)-Wet-1.jpg"
BACK = PICS / "Applaws-Chicken-Breast-in-Broth-(Can)-Wet-4.jpg"  # composition + analysis panel

pytestmark = pytest.mark.skipif(
    not os.environ.get("GEMINI_API_KEY") or not FRONT.exists(),
    reason="GEMINI_API_KEY or sample images not available",
)


def test_live_qc_and_extraction_then_assess():
    from app import gemini

    front = (FRONT.read_bytes(), "image/jpeg")
    back = (BACK.read_bytes(), "image/jpeg")

    qc = gemini.qc_image(*front, expected_panel="front", image_id="live-f")
    assert qc.category in ("front", "back", "unknown")
    assert qc.qc_confidence is None or 0 <= qc.qc_confidence <= 1

    extract = gemini.extract_pair(front, back)
    assert extract.brand and "applaws" in extract.brand.lower()
    assert extract.ingredients, "expected a non-empty ingredient list"
    print(f"\nlive extract: brand={extract.brand!r} variant={extract.variant!r} "
          f"type={extract.type.value} adequacy={extract.adequacy.value} "
          f"lifestage={extract.lifestage.value} conf={extract.confidence} "
          f"ingredients={extract.ingredients[:4]}…")

    report = assess(extract, [], load_kb(), get_config())
    print(f"live verdict: {report.verdict.value} — {report.headline}")
    assert report.verdict is not None
