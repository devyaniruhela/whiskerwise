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


def run_until_confirmation(analysis_id: str) -> None:
    job = store.get(analysis_id)
    store.update(analysis_id, stage=Stage.qc)
    for img in job.payload.images:
        result = mock_qc(img.imageId, img.cloudinaryUrl, img.category.value)
        if not result.qc_passed:
            store.update(
                analysis_id,
                status=AnalysisStatus.qc_failed,
                guidance=f"Retake the {img.category.value} photo — {', '.join(result.qc_fail_reason)}",
            )
            return
    store.update(analysis_id, stage=Stage.extracting)
    extract = _MOCK_EXTRACT
    store.update(
        analysis_id,
        extract=extract,
        status=AnalysisStatus.awaiting_confirmation,
        stage=Stage.awaiting_confirmation,
    )


def run_after_confirmation(analysis_id: str) -> None:
    store.update(analysis_id, status=AnalysisStatus.processing, stage=Stage.assessing)
    # Phase 2: rules engine over kb/ replaces this
    store.update(analysis_id, stage=Stage.explaining)
    # Phase 4: LLM template rendering replaces this
    store.update(analysis_id, report=_MOCK_REPORT, status=AnalysisStatus.done, stage=Stage.done)
