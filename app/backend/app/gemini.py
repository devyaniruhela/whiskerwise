"""Gemini client — Tier-1 QC (per image) and Layer-1 extraction (front+back pair).
Prompts are editable files under prompts/ (config discipline); response schemas are
the Pydantic contracts, so Gemini's JSON is parsed, never prose. Malformed output
retries once (PRD §9.3). Model names come from app/config.yaml.
"""

import os
from typing import Optional

from pydantic import BaseModel

from .config import get_config
from .models import ExtractProcessed, QCResult


def enabled() -> bool:
    """Live LLM calls need a key; WISER_LIVE_LLM=0 forces the mocked pipeline (tests)."""
    return bool(os.environ.get("GEMINI_API_KEY")) and os.environ.get("WISER_LIVE_LLM", "1") != "0"


def _prompt(name: str) -> str:
    return (get_config()["_paths"]["prompts_dir"] / name).read_text(encoding="utf-8")


class GeminiQC(BaseModel):
    is_cat_food_pack: bool
    panel: str                      # front | back | unknown
    product_context: Optional[str] = None
    legible: bool
    qc_confidence: float
    qc_fail_reason: list[str] = []


def _generate(model: str, system: str, parts: list, schema):
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    last_err = None
    for attempt in range(2):                     # retry once on malformed output
        resp = client.models.generate_content(
            model=model,
            contents=parts,
            config=types.GenerateContentConfig(
                system_instruction=system,
                response_mime_type="application/json",
                response_schema=schema,
                temperature=0,
            ),
        )
        try:
            if resp.parsed is not None:
                return resp.parsed
            return schema.model_validate_json(resp.text or "")
        except Exception as e:                   # noqa: BLE001 — surfaced after retry
            last_err = e
    raise RuntimeError(f"Gemini returned unparseable {schema.__name__} twice: {last_err}")


def qc_image(image_bytes: bytes, mime: str, expected_panel: str, image_id: str) -> QCResult:
    from google.genai import types

    cfg = get_config()
    raw: GeminiQC = _generate(
        cfg["models"]["qc"],
        _prompt("qc_system.md"),
        [types.Part.from_bytes(data=image_bytes, mime_type=mime),
         f"The user uploaded this as the {expected_panel} panel."],
        GeminiQC,
    )
    reasons = list(raw.qc_fail_reason)
    if raw.is_cat_food_pack and raw.panel not in (expected_panel, "unknown"):
        reasons.append("wrong_panel")
    passed = raw.is_cat_food_pack and raw.legible and "wrong_panel" not in reasons
    return QCResult(
        image_id=image_id,
        qc_passed=passed,
        category=raw.panel if raw.is_cat_food_pack else "invalid",
        product_context=raw.product_context,
        qc_fail_reason=[] if passed else (reasons or ["unclear"]),
        qc_confidence=raw.qc_confidence,
    )


def extract_pair(front: tuple[bytes, str], back: tuple[bytes, str]) -> ExtractProcessed:
    from google.genai import types

    cfg = get_config()
    return _generate(
        cfg["models"]["extract"],
        _prompt("extract_system.md"),
        ["FRONT panel:", types.Part.from_bytes(data=front[0], mime_type=front[1]),
         "BACK panel:", types.Part.from_bytes(data=back[0], mime_type=back[1])],
        ExtractProcessed,
    )
