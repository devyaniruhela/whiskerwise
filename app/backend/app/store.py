"""In-memory analysis job store. Swapped for Supabase Postgres in Phase 5 —
keep the interface (create/get/update) so the swap is contained here."""

import threading
from dataclasses import dataclass, field
from typing import Optional

from .models import AnalysisPayload, AnalysisStatus, ExtractProcessed, Report, ReportFeedback, Stage


@dataclass
class AnalysisJob:
    payload: AnalysisPayload
    status: AnalysisStatus = AnalysisStatus.processing
    stage: Stage = Stage.queued
    extract: Optional[ExtractProcessed] = None
    report: Optional[Report] = None
    guidance: Optional[str] = None
    confirmation_note: Optional[str] = None
    feedback: list[ReportFeedback] = field(default_factory=list)


class JobStore:
    def __init__(self) -> None:
        self._jobs: dict[str, AnalysisJob] = {}
        self._lock = threading.Lock()

    def create(self, payload: AnalysisPayload) -> AnalysisJob:
        job = AnalysisJob(payload=payload)
        with self._lock:
            self._jobs[payload.analysis_id] = job
        return job

    def get(self, analysis_id: str) -> Optional[AnalysisJob]:
        with self._lock:
            return self._jobs.get(analysis_id)

    def update(self, analysis_id: str, **fields) -> None:
        with self._lock:
            job = self._jobs[analysis_id]
            for k, v in fields.items():
                setattr(job, k, v)


store = JobStore()
