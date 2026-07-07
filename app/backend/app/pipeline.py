"""Pipeline orchestrator. Phase 1: every stage is a mock with the real signature
and real status transitions, so the FE contract and polling flow are exercised
end-to-end. Real implementations land in later phases:
  qc/extract → Gemini (Phase 3) · assess → rules engine (Phase 2) · explain → LLM template (Phase 4).
Split at the confirmation checkpoint (PRD §8.5): run_until_confirmation stops after
extraction; run_after_confirmation resumes on the user's confirm.
"""

from .models import (
    AnalysisStatus,
    Adequacy,
    ExtractProcessed,
    FoodType,
    GuaranteedAnalysis,
    Lifestage,
    QCResult,
    Report,
    Stage,
    Verdict,
)
from .store import store

_MOCK_EXTRACT = ExtractProcessed(
    brand="MockBrand",
    variant="Adult Chicken",
    lifestage=Lifestage.adult,
    type=FoodType.dry,
    adequacy=Adequacy.complete,
    ingredients=["chicken (30%)", "rice", "chicken fat", "beet pulp"],
    guaranteed_analysis=GuaranteedAnalysis(protein=0.32, fat=0.14, fibre=0.025, ash=0.07, moisture=0.10),
    taurine_added=True,
    confidence=0.95,
)

_MOCK_REPORT = Report(
    verdict=Verdict.buy,
    headline="Buy — meets the standard with a clean label. (mock)",
    conditions=[],
    detailed_rationale="Mock rationale — replaced by Layer 2 + Layer 3 output.",
    standards_cited=["IS-11968"],
)


def mock_qc(image_id: str, cloudinary_url: str, category: str) -> QCResult:
    return QCResult(image_id=image_id, qc_passed=True, category=category, qc_confidence=0.99)


def _fetch(url: str) -> tuple[bytes, str]:
    import httpx

    resp = httpx.get(url, timeout=30, follow_redirects=True)
    resp.raise_for_status()
    return resp.content, resp.headers.get("content-type", "image/jpeg").split(";")[0]


def run_until_confirmation(analysis_id: str) -> None:
    from . import gemini

    job = store.get(analysis_id)
    store.update(analysis_id, stage=Stage.qc)
    live = gemini.enabled()
    try:
        fetched: dict[str, tuple[bytes, str]] = {}
        for img in job.payload.images:
            if live:
                fetched[img.category.value] = _fetch(img.cloudinaryUrl)
                result = gemini.qc_image(*fetched[img.category.value],
                                         expected_panel=img.category.value, image_id=img.imageId)
            else:
                result = mock_qc(img.imageId, img.cloudinaryUrl, img.category.value)
            if not result.qc_passed:
                store.update(
                    analysis_id,
                    status=AnalysisStatus.qc_failed,
                    guidance=f"Retake the {img.category.value} photo — {', '.join(result.qc_fail_reason)}",
                )
                return
        store.update(analysis_id, stage=Stage.extracting)
        extract = gemini.extract_pair(fetched["front"], fetched["back"]) if live else _MOCK_EXTRACT
    except Exception:
        store.update(analysis_id, status=AnalysisStatus.error, stage=Stage.extracting,
                     guidance="Something went wrong while reading the label — please try again.")
        return
    store.update(
        analysis_id,
        extract=extract,
        status=AnalysisStatus.awaiting_confirmation,
        stage=Stage.awaiting_confirmation,
    )


def run_after_confirmation(analysis_id: str) -> None:
    from .config import get_config
    from .engine import assess
    from .kb import load_kb

    job = store.get(analysis_id)
    store.update(analysis_id, status=AnalysisStatus.processing, stage=Stage.assessing)
    # Layer 2 (real): cats resolved from cat_ids once persistence lands (Phase 5);
    # until then an empty list -> assessed as adult with the assumption stated.
    report = assess(job.extract, [], load_kb(), get_config())
    store.update(analysis_id, stage=Stage.explaining)
    # Phase 4: LLM template rendering (Layer 3) polishes the copy; engine output is already consumer-shaped
    store.update(analysis_id, report=report, status=AnalysisStatus.done, stage=Stage.done)
