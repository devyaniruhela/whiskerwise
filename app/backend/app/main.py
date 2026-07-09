"""Wiser analysis service (FastAPI). Contract per PRD §9.2:
POST /analyze → 202 {analysis_id, status}; GET /analyze/{id} → poll;
POST /analyze/{id}/confirm → extraction checkpoint (PRD §8.5);
POST /analyze/{id}/feedback → persisted report feedback; POST /qc → per-image QC.
"""

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
    AnalysisStatus,
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
    background.add_task(pipeline.run_until_confirmation, payload.analysis_id)
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
        extract=job.extract if job.status == AnalysisStatus.awaiting_confirmation else None,
        report=job.report,
        guidance=job.guidance,
    )


@app.post("/analyze/{analysis_id}/confirm", response_model=AnalysisState, response_model_exclude_none=True)
def confirm_extraction(
    analysis_id: str, confirmation: ExtractConfirmation, background: BackgroundTasks
) -> AnalysisState:
    job = store.get(analysis_id)
    if job is None:
        raise HTTPException(404, "Unknown analysis_id.")
    if job.status != AnalysisStatus.awaiting_confirmation:
        raise HTTPException(409, f"Not awaiting confirmation (status: {job.status.value}).")
    store.update(analysis_id, confirmation_note=confirmation.note)
    db.save_extract_feedback(job.user_id, analysis_id, job.extract_db_id,
                             confirmation.confirmed, confirmation.note)
    if confirmation.confirmed:
        background.add_task(pipeline.run_after_confirmation, analysis_id)
    else:
        # User flagged the extraction as wrong → re-upload path (PRD §8.4); note persisted for tuning.
        store.update(
            analysis_id,
            status=AnalysisStatus.no_verdict,
            guidance="Thanks for flagging — please retake the label photos so we can read them correctly.",
        )
    job = store.get(analysis_id)
    return AnalysisState(analysis_id=analysis_id, status=job.status, stage=job.stage, guidance=job.guidance)


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
    row = db.get_report_row(analysis_id)
    if row is None:
        job = store.get(analysis_id)
        if job and job.report:
            return {"analysis_id": analysis_id, **job.report.model_dump()}
        raise HTTPException(404, "Report not found.")
    return row
