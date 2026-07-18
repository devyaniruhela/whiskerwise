"""Pipeline orchestrator. Phase 1: every stage is a mock with the real signature
and real status transitions, so the FE contract and polling flow are exercised
end-to-end. Real implementations land in later phases:
  qc/extract → Gemini (Phase 3) · assess → rules engine (Phase 2) · explain → LLM template (Phase 4).
Non-blocking flow (PRD §8.6.7, 10 Jul 2026): the pipeline runs straight through —
extraction review on the FE records feedback but never gates the report. The one hard
gate is extraction confidence < pipeline.confidence_floor or unreadable required
fields (PRD §8.4), which stops the flow after extraction.
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


def _friendly_reason(e: Exception) -> str:
    """Map a pipeline exception to a user-facing message (the real error is always logged)."""
    s = str(e).lower()
    if "429" in s or "resource_exhausted" in s or "quota" in s:
        return "We've hit today's analysis limit. Please try again later."
    if "503" in s or "unavailable" in s or "overloaded" in s:
        return "The analysis service is busy right now — please try again in a moment."
    if "cloudinary" in s or "403" in s or "401" in s or "400" in s:
        return "We couldn't load your photos — please re-upload and try again."
    return "Something went wrong while reading the label — please try again."


def _resized(url: str, max_width: int) -> str:
    """Cloudinary dynamic resize via URL — non-Cloudinary URLs pass through untouched."""
    marker = "/upload/"
    if "res.cloudinary.com" in url and marker in url:
        return url.replace(marker, f"{marker}w_{max_width},c_limit,q_auto/", 1)
    return url


def _fetch(url: str, max_width: int) -> tuple[bytes, str]:
    """Fetch the image, resized via Cloudinary. Falls back to the original URL if the
    resize transform is rejected (e.g. Cloudinary 'strict transformations' enabled), so a
    locked-down account never breaks a scan."""
    import httpx

    for candidate in (_resized(url, max_width), url):
        try:
            resp = httpx.get(candidate, timeout=30, follow_redirects=True)
            resp.raise_for_status()
            return resp.content, resp.headers.get("content-type", "image/jpeg").split(";")[0]
        except httpx.HTTPStatusError as e:
            if candidate == url:                      # original also failed → give up
                raise
            log.warning("resized fetch failed (%s); retrying original url", e.response.status_code)
    raise RuntimeError("unreachable")


def run_pipeline(analysis_id: str) -> None:
    from . import gemini
    from .config import get_config

    from . import db

    job = store.get(analysis_id)
    store.update(analysis_id, stage=Stage.qc)
    live = gemini.enabled()
    widths = get_config()["images"]
    t0 = time.perf_counter()
    qc_rows = []
    try:
        for img in job.payload.images:
            if live:
                result = gemini.qc_image(*_fetch(img.cloudinaryUrl, widths["qc_max_width"]),
                                         expected_panel=img.category.value, image_id=img.imageId)
            else:
                result = mock_qc(img.imageId, img.cloudinaryUrl, img.category.value)
            qc_rows.append({"id": img.imageId, "url": img.cloudinaryUrl,
                            "category": img.category.value, "qc_passed": result.qc_passed,
                            "qc_fail_reason": result.qc_fail_reason,
                            "qc_confidence": result.qc_confidence})
            if not result.qc_passed:
                store.update(
                    analysis_id,
                    status=AnalysisStatus.qc_failed,
                    guidance=f"Retake the {img.category.value} photo — {', '.join(result.qc_fail_reason)}",
                )
                log.info("analysis=%s qc_failed (%s) in %.1fs", analysis_id,
                         img.category.value, time.perf_counter() - t0)
                db.save_images(job.user_id, analysis_id, qc_rows)
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
        reason = _friendly_reason(e)
        store.update(analysis_id, status=AnalysisStatus.error, stage=Stage.extracting, guidance=reason)
        log.error("analysis=%s failed in %.1fs: %s: %s", analysis_id, time.perf_counter() - t0,
                  type(e).__name__, e)
        return
    db.save_images(job.user_id, analysis_id, qc_rows)
    extract_db_id = db.save_extract(job.user_id, analysis_id, job.payload.cat_ids, extract)
    store.update(analysis_id, extract=extract, extract_db_id=extract_db_id)
    log.info("analysis=%s qc+extract ok in %.1fs (live=%s)", analysis_id,
             time.perf_counter() - t0, live)

    # §8.4 hard gate — the one blocker in the otherwise non-blocking flow.
    floor = get_config()["pipeline"]["confidence_floor"]
    unreadable = {u.lower() for u in extract.unreadable_fields}
    if (extract.confidence is not None and extract.confidence < floor) or (
        unreadable & {"ingredients", "guaranteed_analysis"}
    ):
        store.update(
            analysis_id,
            status=AnalysisStatus.no_verdict,
            guidance=("We couldn't read the label clearly enough to judge this food — "
                      "please retake the photos, especially the back panel."),
        )
        log.info("analysis=%s gated: confidence=%s unreadable=%s", analysis_id,
                 extract.confidence, sorted(unreadable))
        return

    _assess_and_explain(analysis_id)


def _assess_and_explain(analysis_id: str) -> None:
    from .config import get_config
    from .engine import assess
    from .kb import load_kb

    from . import db, gemini
    from .llm import polish

    job = store.get(analysis_id)
    t0 = time.perf_counter()
    store.update(analysis_id, status=AnalysisStatus.processing, stage=Stage.assessing)
    try:
        cats = db.get_cats(job.user_id, job.payload.cat_ids) if job.payload.personalise_flag else []
        report = assess(job.extract, cats, load_kb(), get_config())
        store.update(analysis_id, stage=Stage.explaining)
        if gemini.enabled():
            report = polish(report)  # Layer 3 copy polish; engine copy stands on any failure
    except Exception as e:  # noqa: BLE001 — surfaced to the user as a safe retry message
        store.update(analysis_id, status=AnalysisStatus.error, guidance=_friendly_reason(e))
        log.error("analysis=%s assess+explain failed in %.1fs: %s: %s", analysis_id,
                  time.perf_counter() - t0, type(e).__name__, e)
        return
    store.update(analysis_id, report=report, status=AnalysisStatus.done, stage=Stage.done)
    db.save_report(job.user_id, analysis_id, job.extract_db_id, job.payload.cat_ids, report,
                   brand=job.extract.brand if job.extract else None,
                   variant=job.extract.variant if job.extract else None)
    db.bump(job.user_id, "num_scans_success")
    log.info("analysis=%s assess+explain ok in %.1fs verdict=%s cats=%d", analysis_id,
             time.perf_counter() - t0, report.verdict.value, len(cats))
