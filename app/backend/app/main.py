"""Wiser analysis service (FastAPI). Contract per PRD §9.2:
POST /analyze → 202 {analysis_id, status}; GET /analyze/{id} → poll;
POST /analyze/{id}/confirm → extraction-review feedback, non-gating (PRD §8.5/§8.6.7);
POST /analyze/{id}/feedback → persisted report feedback; POST /qc → per-image QC.
"""

import json
import logging

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(message)s")

from . import db, pipeline
from .auth import current_user_id
from .config import get_config
from .models import (
    AnalysisAccepted,
    AnalysisPayload,
    AnalysisState,
    CatProfile,
    ExtractConfirmation,
    ImageRef,
    QCResult,
    ReportFeedback,
    UserProfile,
)
from .store import store

app = FastAPI(title="Wiser analysis service", version="0.1.0")


@app.get("/health")
def health() -> dict:
    cfg = get_config()
    return {"ok": True, "kb_dir_exists": cfg["_paths"]["kb_dir"].is_dir()}


@app.get("/health/gemini")
def gemini_health() -> dict:
    """Self-check for the Gemini key + configured models. Uses models.list() only —
    consumes NO generation quota. Open http://localhost:8000/health/gemini to verify."""
    from . import gemini

    cfg = get_config()
    configured = {stage: cfg["models"][stage] for stage in ("qc", "extract", "explain")}
    if not gemini.enabled():
        why = "no GEMINI_API_KEY" if not os.environ.get("GEMINI_API_KEY") else "WISER_LIVE_LLM=0 (mock mode)"
        return {"key_present": bool(os.environ.get("GEMINI_API_KEY")), "live": False,
                "reason": why, "configured": configured}
    try:
        available = set(gemini.list_models())
    except Exception as e:  # noqa: BLE001
        return {"key_present": True, "live": True, "key_valid": False, "error": str(e)[:200]}
    return {
        "key_present": True, "live": True, "key_valid": True,
        "configured": configured,
        "configured_available": {m: (m in available) for m in set(configured.values())},
        "flash_models_available": sorted(m for m in available if "flash" in m),
    }


@app.post("/qc", response_model=QCResult)
def qc(image: ImageRef) -> QCResult:
    return pipeline.mock_qc(image.imageId, image.cloudinaryUrl, image.category.value)


@app.post("/analyze", response_model=AnalysisAccepted, status_code=202)
def analyze(payload: AnalysisPayload, background: BackgroundTasks,
            user_id: str = Depends(current_user_id)) -> AnalysisAccepted:
    categories = {img.category.value for img in payload.images}
    if categories != {"front", "back"}:
        raise HTTPException(422, "Exactly one front and one back image are required.")
    if store.get(payload.analysis_id):
        raise HTTPException(409, "analysis_id already exists.")
    job = store.create(payload)
    job.user_id = user_id
    db.upsert_user(user_id)
    db.bump(user_id, "num_scan_attempts")
    background.add_task(pipeline.run_pipeline, payload.analysis_id)
    return AnalysisAccepted(analysis_id=payload.analysis_id)


@app.get("/analyze/{analysis_id}", response_model=AnalysisState, response_model_exclude_none=True)
def get_analysis(analysis_id: str) -> AnalysisState:
    job = store.get(analysis_id)
    if job is None:
        raise HTTPException(404, "Unknown analysis_id.")
    return AnalysisState(
        analysis_id=analysis_id,
        status=job.status,
        stage=job.stage,
        stage_label=get_config()["stage_labels"].get(job.stage.value),
        extract=job.extract,  # exposed as soon as extraction lands — the FE review is in-flow (§8.6.4)
        report=job.report,
        guidance=job.guidance,
    )


@app.post("/analyze/{analysis_id}/confirm", status_code=204)
def extract_review_feedback(
    analysis_id: str, confirmation: ExtractConfirmation,
    user_id: str = Depends(current_user_id),
) -> None:
    """Records the in-flow extraction-review verdict (Looks good / Something's off + note).
    Non-gating per PRD §8.6.7 — the pipeline runs regardless; this only persists signal
    to Extract_feedback. Works during the flow (store) and later from the report page (db)."""
    job = store.get(analysis_id)
    if job is not None:
        store.update(analysis_id, confirmation_note=confirmation.note)
        db.save_extract_feedback(job.user_id, analysis_id, job.extract_db_id,
                                 confirmation.confirmed, confirmation.note)
        return
    row = db.get_extract_row(analysis_id)
    if row is None:
        raise HTTPException(404, "Unknown analysis_id.")
    db.save_extract_feedback(user_id, analysis_id, row.get("id"),
                             confirmation.confirmed, confirmation.note)


@app.post("/analyze/{analysis_id}/feedback", status_code=204)
def report_feedback(analysis_id: str, feedback: ReportFeedback,
                    user_id: str = Depends(current_user_id)) -> None:
    job = store.get(analysis_id)
    if job is None and db.get_report_row(analysis_id) is None:
        raise HTTPException(404, "Unknown analysis_id.")
    if job:
        job.feedback.append(feedback)
    db.save_report_feedback(user_id, analysis_id, feedback.feedback_yn, feedback.feedback_comments)


# ── user profile (all optional; never prefilled from scan greetings) ─

@app.get("/me")
def get_me(user_id: str = Depends(current_user_id)) -> dict:
    return db.get_profile(user_id)


@app.put("/me", status_code=204)
def put_me(profile: UserProfile, user_id: str = Depends(current_user_id)) -> None:
    db.upsert_user(user_id)
    db.save_profile(user_id, profile)


# ── cats + report history (auth-scoped) ──────────────────────────────

@app.get("/cats", response_model=list[CatProfile])
def get_cats(user_id: str = Depends(current_user_id)) -> list[CatProfile]:
    return db.list_cats(user_id)


@app.post("/cats", response_model=CatProfile)
def upsert_cat(cat: CatProfile, user_id: str = Depends(current_user_id)) -> CatProfile:
    db.upsert_user(user_id)
    cat_id = db.save_cat(user_id, cat)
    if cat_id is None:
        raise HTTPException(503, "Persistence unavailable — cat not saved.")
    return cat.model_copy(update={"id": cat_id})


@app.delete("/cats/{cat_id}", status_code=204)
def remove_cat(cat_id: str, user_id: str = Depends(current_user_id)) -> None:
    db.delete_cat(user_id, cat_id)


@app.get("/reports")
def reports_history(user_id: str = Depends(current_user_id)) -> list[dict]:
    return db.list_reports(user_id)


@app.get("/report/{analysis_id}")
def report_by_id(analysis_id: str) -> dict:
    """Report + the extract it was built on — the report page renders the extraction
    section from it (one surface, linkable as /report/{id}?view=extract, PRD §8.6.5)."""
    row = db.get_report_row(analysis_id)
    if row is None:
        job = store.get(analysis_id)
        if job and job.report:
            return {"analysis_id": analysis_id, **job.report.model_dump(),
                    "extract": job.extract.model_dump() if job.extract else None}
        raise HTTPException(404, "Report not found.")
    ex = db.get_extract_row(analysis_id)
    extract = ex.get("data") if ex else None
    if isinstance(extract, str):  # jsonb usually arrives parsed; be tolerant of driver differences
        extract = json.loads(extract)
    return {**row, "extract": extract}
