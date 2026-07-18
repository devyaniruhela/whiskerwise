from fastapi.testclient import TestClient

from app import pipeline
from app.main import app
from app.models import Verdict

client = TestClient(app)


def payload(analysis_id: str) -> dict:
    return {
        "analysis_id": analysis_id,
        "session_id": "s1",
        "personalise_flag": False,
        "cat_ids": [],
        "images": [
            {"imageId": "img-f", "cloudinaryUrl": "https://res.cloudinary.com/x/f.jpg", "category": "front"},
            {"imageId": "img-b", "cloudinaryUrl": "https://res.cloudinary.com/x/b.jpg", "category": "back"},
        ],
        "cta_source": "test",
        "timestamp": "2026-07-07T00:00:00Z",
    }


def test_health():
    body = client.get("/health").json()
    assert body["ok"] and body["kb_dir_exists"]


def test_qc_route():
    img = {"imageId": "i1", "cloudinaryUrl": "https://res.cloudinary.com/x/f.jpg", "category": "front"}
    body = client.post("/qc", json=img).json()
    assert body["qc_passed"] is True and body["category"] == "front"


def test_full_flow_non_blocking():
    """PRD §8.6.7: the pipeline runs straight through — no confirmation gate."""
    r = client.post("/analyze", json=payload("a1"))
    assert r.status_code == 202

    state = client.get("/analyze/a1").json()
    assert state["status"] == "done" and state["stage"] == "done"
    assert state["extract"]["brand"] == "MockBrand"  # extract stays exposed for the in-flow review
    assert state["report"]["verdict"] == Verdict.buy.value

    assert client.post("/analyze/a1/feedback", json={"feedback_yn": True, "feedback_comments": "spot on"}).status_code == 204


def test_extract_review_feedback_never_gates():
    """§8.5: both review verdicts persist as signal; neither changes the analysis outcome."""
    client.post("/analyze", json=payload("a2"))
    assert client.post("/analyze/a2/confirm", json={"confirmed": True}).status_code == 204
    assert client.post("/analyze/a2/confirm", json={"confirmed": False, "note": "brand is wrong"}).status_code == 204
    state = client.get("/analyze/a2").json()
    assert state["status"] == "done"  # report untouched by the review


def test_low_confidence_gate(monkeypatch):
    """§8.4: extraction confidence < 0.70 stops the flow after extraction — no report."""
    gated = pipeline._MOCK_EXTRACT.model_copy(update={"confidence": 0.4})
    monkeypatch.setattr(pipeline, "_MOCK_EXTRACT", gated)
    client.post("/analyze", json=payload("a5"))
    state = client.get("/analyze/a5").json()
    assert state["status"] == "no_verdict"
    assert "retake" in state["guidance"].lower()
    assert "report" not in state


def test_validation_errors():
    bad = payload("a3")
    bad["images"] = [bad["images"][0], bad["images"][0]]  # two fronts
    assert client.post("/analyze", json=bad).status_code == 422

    client.post("/analyze", json=payload("a4"))
    assert client.post("/analyze", json=payload("a4")).status_code == 409  # duplicate id
    assert client.get("/analyze/nope").status_code == 404
    assert client.post("/analyze/nope/confirm", json={"confirmed": True}).status_code == 404
