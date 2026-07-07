"""Wiser analysis service (FastAPI). Contract per PRD §9.2:
POST /analyze → 202 {analysis_id, status}; GET /analyze/{id} → poll;
POST /analyze/{id}/confirm → extraction checkpoint (PRD §8.5);
POST /analyze/{id}/feedback → persisted report feedback; POST /qc → per-image QC.
"""

from fastapi import BackgroundTasks, FastAPI, HTTPException

from . import pipeline
from .config import get_config
from .models import (
    AnalysisAccepted,
    AnalysisPayload,
    AnalysisState,
    AnalysisStatus,
    ExtractConfirmation,
    ImageRef,
    QCResult,
    ReportFeedback,
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
def analyze(payload: AnalysisPayload, background: BackgroundTasks) -> AnalysisAccepted:
    categories = {img.category.value for img in payload.images}
    if categories != {"front", "back"}:
        raise HTTPException(422, "Exactly one front and one back image are required.")
    if store.get(payload.analysis_id):
        raise HTTPException(409, "analysis_id already exists.")
    store.create(payload)
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
def report_feedback(analysis_id: str, feedback: ReportFeedback) -> None:
    job = store.get(analysis_id)
    if job is None:
        raise HTTPException(404, "Unknown analysis_id.")
    job.feedback.append(feedback)  # persisted to DB in Phase 5
