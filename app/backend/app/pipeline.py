"""Pipeline orchestrator. Phase 1: every stage is a mock with the real signature
and real status transitions, so the FE contract and polling flow are exercised
end-to-end. Real implementations land in later phases:
  qc/extract → Gemini (Phase 3) · assess → rules engine (Phase 2) · explain → LLM template (Phase 4).
Split at the confirmation checkpoint (PRD §8.5): run_until_confirmation stops after
extraction; run_after_confirmation resumes on the user's confirm.
"""

import logging
import time

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

log = logging.getLogger("wiser.pipeline")

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


def _resized(url: str, max_width: int) -> str:
    """Cloudinary dynamic resize via URL — non-Cloudinary URLs pass through untouched."""
    marker = "/upload/"
    if "res.cloudinary.com" in url and marker in url:
        return url.replace(marker, f"{marker}w_{max_width},c_limit,q_auto/", 1)
    return url


def _fetch(url: str, max_width: int) -> tuple[bytes, str]:
    import httpx

    resp = httpx.get(_resized(url, max_width), timeout=30, follow_redirects=True)
    resp.raise_for_status()
    return resp.content, resp.headers.get("content-type", "image/jpeg").split(";")[0]


def run_until_confirmation(analysis_id: str) -> None:
    from . import gemini
    from .config import get_config

    job = store.get(analysis_id)
    store.update(analysis_id, stage=Stage.qc)
    live = gemini.enabled()
    widths = get_config()["images"]
    t0 = time.perf_counter()
    try:
        for img in job.payload.images:
            if live:
                result = gemini.qc_image(*_fetch(img.cloudinaryUrl, widths["qc_max_width"]),
                                         expected_panel=img.category.value, image_id=img.imageId)
            else:
                result = mock_qc(img.imageId, img.cloudinaryUrl, img.category.value)
            if not result.qc_passed:
                store.update(
                    analysis_id,
                    status=AnalysisStatus.qc_failed,
                    guidance=f"Retake the {img.category.value} photo — {', '.join(result.qc_fail_reason)}",
                )
                log.info("analysis=%s qc_failed (%s) in %.1fs", analysis_id,
                         img.category.value, time.perf_counter() - t0)
                return
        store.update(analysis_id, stage=Stage.extracting)
        if live:
            by_cat = {i.category.value: i.cloudinaryUrl for i in job.payload.images}
            extract = gemini.extract_pair(
                _fetch(by_cat["front"], widths["extract_max_width"]),
                _fetch(by_cat["back"], widths["extract_max_width"]),
            )
        else:
            extract = _MOCK_EXTRACT
    except Exception as e:  # noqa: BLE001 — surfaced to the user as a safe retry message
        store.update(analysis_id, status=AnalysisStatus.error, stage=Stage.extracting,
                     guidance="Something went wrong while reading the label — please try again.")
        log.error("analysis=%s failed in %.1fs: %s", analysis_id, time.perf_counter() - t0, e)
        return
    store.update(
        analysis_id,
        extract=extract,
        status=AnalysisStatus.awaiting_confirmation,
        stage=Stage.awaiting_confirmation,
    )
    log.info("analysis=%s qc+extract ok in %.1fs (live=%s)", analysis_id,
             time.perf_counter() - t0, live)


def run_after_confirmation(analysis_id: str) -> None:
    from .config import get_config
    from .engine import assess
    from .kb import load_kb

    from . import gemini
    from .llm import polish

    job = store.get(analysis_id)
    t0 = time.perf_counter()
    store.update(analysis_id, status=AnalysisStatus.processing, stage=Stage.assessing)
    # Layer 2 (real): cats resolved from cat_ids once persistence lands (Phase 5);
    # until then an empty list -> assessed as adult with the assumption stated.
    report = assess(job.extract, [], load_kb(), get_config())
    store.update(analysis_id, stage=Stage.explaining)
    if gemini.enabled():
        report = polish(report)  # Layer 3 copy polish; engine copy stands on any failure
    store.update(analysis_id, report=report, status=AnalysisStatus.done, stage=Stage.done)
    log.info("analysis=%s assess+explain ok in %.1fs verdict=%s", analysis_id,
             time.perf_counter() - t0, report.verdict.value)
