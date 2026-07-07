"""Layer 3 unit tests — polish is never load-bearing and never re-decides."""

from app import llm
from app.llm import ConsumerCopy, polish
from app.models import Report, Verdict

ENGINE_REPORT = Report(verdict=Verdict.skip, headline="Skip — engine headline.",
                       conditions=["c1"], detailed_rationale="engine rationale",
                       standards_cited=["IS-11968"])


def test_polish_failure_keeps_engine_copy(monkeypatch):
    monkeypatch.setattr(llm.GeminiWriter, "generate",
                        lambda self, s, j: (_ for _ in ()).throw(RuntimeError("boom")))
    out = polish(ENGINE_REPORT)
    assert out == ENGINE_REPORT  # untouched fallback


def test_polish_only_touches_copy_fields(monkeypatch):
    monkeypatch.setattr(llm.GeminiWriter, "generate",
                        lambda self, s, j: ConsumerCopy(headline="Nicer words.",
                                                        detailed_rationale="Friendly why."))
    out = polish(ENGINE_REPORT)
    assert out.headline == "Nicer words." and out.detailed_rationale == "Friendly why."
    assert out.verdict == Verdict.skip and out.conditions == ["c1"]
    assert out.standards_cited == ["IS-11968"]
