from fastapi.testclient import TestClient

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


def test_full_flow_with_confirmation():
    r = client.post("/analyze", json=payload("a1"))
    assert r.status_code == 202

    state = client.get("/analyze/a1").json()
    assert state["status"] == "awaiting_confirmation"
    assert state["extract"]["brand"] == "MockBrand"

    r = client.post("/analyze/a1/confirm", json={"confirmed": True})
    assert r.status_code == 200

    state = client.get("/analyze/a1").json()
    assert state["status"] == "done" and state["stage"] == "done"
    assert state["report"]["verdict"] == Verdict.buy.value
    assert "extract" not in state  # only exposed at the checkpoint

    assert client.post("/analyze/a1/feedback", json={"rating": "match"}).status_code == 204


def test_rejected_extraction_routes_to_reupload():
    client.post("/analyze", json=payload("a2"))
    r = client.post("/analyze/a2/confirm", json={"confirmed": False, "note": "brand is wrong"})
    assert r.json()["status"] == "no_verdict"
    assert "retake" in r.json()["guidance"].lower()


def test_validation_errors():
    bad = payload("a3")
    bad["images"] = [bad["images"][0], bad["images"][0]]  # two fronts
    assert client.post("/analyze", json=bad).status_code == 422

    client.post("/analyze", json=payload("a4"))
    assert client.post("/analyze", json=payload("a4")).status_code == 409  # duplicate id
    assert client.get("/analyze/nope").status_code == 404
    assert client.post("/analyze/a4/confirm", json={"confirmed": True}).status_code == 200
    assert client.post("/analyze/a4/confirm", json={"confirmed": True}).status_code == 409  # not awaiting
