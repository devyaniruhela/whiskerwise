"""Layer 3 — vendor-agnostic report writer. Gemini today; swapping vendors means
adding one class here (PRD §9.1). Input is ONLY Layer 2's structured Report (never
the raw label); the system prompt + format live in templates/report_template.md.
On any failure the engine's own copy stands — Layer 3 polish is never load-bearing.
"""

import logging
import time
from typing import Optional

from pydantic import BaseModel

from .config import get_config
from .models import Report

log = logging.getLogger("wiser.llm")


class ConsumerCopy(BaseModel):
    headline: str
    detailed_rationale: str


class GeminiWriter:
    def generate(self, system: str, report_json: str) -> ConsumerCopy:
        from .gemini import _generate

        return _generate(get_config()["models"]["explain"], system,
                         [f"Engine verdict JSON:\n{report_json}"], ConsumerCopy)


def polish(report: Report) -> Report:
    """Rewrite headline + detailed_rationale in the locked tone; everything else untouched."""
    cfg = get_config()
    system = cfg["_paths"]["report_template"].read_text(encoding="utf-8")
    t0 = time.perf_counter()
    try:
        copy = GeminiWriter().generate(system, report.model_dump_json(exclude_none=True))
        polished = report.model_copy(update={
            "headline": copy.headline,
            "detailed_rationale": copy.detailed_rationale,
        })
        log.info("layer3 ok in %.1fs", time.perf_counter() - t0)
        return polished
    except Exception as e:  # noqa: BLE001 — engine copy is the fallback by design
        log.warning("layer3 failed in %.1fs, keeping engine copy: %s", time.perf_counter() - t0, e)
        return report
