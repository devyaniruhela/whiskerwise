"""Persistence — Supabase Postgres over a direct connection (never the Data API).
Graceful by design: without DATABASE_URL (or if the DB is down) the app still runs —
scans work via the in-memory job store; every write here is best-effort and logged,
never fatal to a scan. Schema (schema.sql) is applied idempotently on first use.
"""

import json
import logging
import os
import uuid
from pathlib import Path
from typing import Any, Optional

from . import config  # noqa: F401 — ensures .env is loaded before engine() reads it
from .models import CatProfile, ExtractProcessed, Report

log = logging.getLogger("wiser.db")
_engine = None
_schema_applied = False


def engine():
    global _engine, _schema_applied
    url = os.environ.get("DATABASE_URL")
    if not url:
        return None
    if _engine is None:
        from sqlalchemy import create_engine
        _engine = create_engine(url, pool_pre_ping=True, pool_size=3)
    if not _schema_applied:
        from sqlalchemy import text
        ddl = (Path(__file__).resolve().parents[1] / "schema.sql").read_text()
        with _engine.begin() as conn:
            conn.execute(text(ddl))
        _schema_applied = True
        log.info("schema applied")
    return _engine


def _exec(sql: str, **params) -> list:
    """Best-effort write/read; returns [] when persistence is unavailable. The engine()
    call is INSIDE the try on purpose — connecting / applying the schema can fail (paused
    Supabase, network), and that must degrade to a no-op, never 500 a scan."""
    from sqlalchemy import text
    try:
        eng = engine()
        if eng is None:
            return []
        with eng.begin() as conn:
            rows = conn.execute(text(sql), params)
            return list(rows.mappings()) if rows.returns_rows else []
    except Exception as e:  # noqa: BLE001 — persistence must never kill a scan
        log.error("db error: %s", e)
        return []


def _j(v: Any) -> str:
    return json.dumps(v, default=str)


# ── users ────────────────────────────────────────────────────────────

def upsert_user(user_id: str) -> None:
    _exec("insert into users (id) values (:id) on conflict (id) do nothing", id=user_id)


def bump(user_id: str, field: str) -> None:
    assert field in ("num_scan_attempts", "num_scans_success")
    _exec(f"update users set {field} = {field} + 1, updated_at = now() where id = :id", id=user_id)


def get_profile(user_id: str) -> dict:
    rows = _exec("""select first_name, last_name, phone_number, email, location,
                           num_cats, cat_parent_since
                    from users where id = :id""", id=user_id)
    return dict(rows[0]) if rows else {}


def save_profile(user_id: str, p) -> None:
    _exec("""update users set first_name = :fn, last_name = :ln, phone_number = :ph,
             email = :em, location = :loc, num_cats = :nc, cat_parent_since = :cps,
             updated_at = now() where id = :id""",
          id=user_id, fn=p.first_name, ln=p.last_name, ph=p.phone_number,
          em=p.email, loc=p.location, nc=p.num_cats, cps=p.cat_parent_since)


# ── cats ─────────────────────────────────────────────────────────────

_CAT_COLS = ("cat_name, avatar, cat_dob, cat_gender, cat_age_year, cat_age_month, body_condition, "
             "body_condition_score, weight_kg, activity_level, neuter_status, environment, "
             "health_condition, breed")


def _row_to_cat(r) -> CatProfile:
    d = dict(r)
    d["health_condition"] = d.get("health_condition") or []
    if d.get("cat_dob") is not None:
        d["cat_dob"] = str(d["cat_dob"])
    return CatProfile(**{k: d[k] for k in CatProfile.model_fields if k in d and k != "id"},
                      id=str(d["id"]))


def list_cats(user_id: str) -> list[CatProfile]:
    rows = _exec("select * from cats where user_id = :u order by created_at", u=user_id)
    return [_row_to_cat(r) for r in rows]


def get_cats(user_id: str, cat_ids: list[str]) -> list[CatProfile]:
    if not cat_ids:
        return []
    rows = _exec("select * from cats where user_id = :u and id = any(cast(:ids as uuid[]))",
                 u=user_id, ids=cat_ids)
    return [_row_to_cat(r) for r in rows]


def save_cat(user_id: str, cat: CatProfile) -> Optional[str]:
    cat_id = cat.id or str(uuid.uuid4())
    rows = _exec(f"""
        insert into cats (id, user_id, {_CAT_COLS})
        values (:id, :u, :cat_name, :avatar, cast(:cat_dob as date), :cat_gender,
                :cat_age_year, :cat_age_month,
                :body_condition, :body_condition_score, :weight_kg, :activity_level,
                :neuter_status, :environment, cast(:health_condition as jsonb), :breed)
        on conflict (id) do update set
          cat_name=excluded.cat_name, avatar=excluded.avatar, cat_dob=excluded.cat_dob,
          cat_gender=excluded.cat_gender,
          cat_age_year=excluded.cat_age_year, cat_age_month=excluded.cat_age_month,
          body_condition=excluded.body_condition, body_condition_score=excluded.body_condition_score,
          weight_kg=excluded.weight_kg, activity_level=excluded.activity_level,
          neuter_status=excluded.neuter_status, environment=excluded.environment,
          health_condition=excluded.health_condition, breed=excluded.breed, updated_at=now()
        returning id""",
        id=cat_id, u=user_id, health_condition=_j(cat.health_condition),
        **{k: getattr(cat, k) for k in ("cat_name", "avatar", "cat_dob", "cat_gender",
                                        "cat_age_year", "cat_age_month",
                                        "body_condition", "body_condition_score", "weight_kg",
                                        "activity_level", "neuter_status", "environment", "breed")})
    if rows:
        _exec("update users set cat_profile_added = true, updated_at = now() where id = :u", u=user_id)
        return str(rows[0]["id"])
    return None


def delete_cat(user_id: str, cat_id: str) -> None:
    _exec("delete from cats where user_id = :u and id = :id", u=user_id, id=cat_id)


# ── scan artifacts ───────────────────────────────────────────────────

def save_images(user_id: str, analysis_id: str, images: list[dict]) -> None:
    for img in images:
        _exec("""insert into images (id, user_id, analysis_id, url, category, qc_passed,
                 qc_fail_reason, qc_confidence)
                 values (:id, :u, :a, :url, :cat, :ok, cast(:reasons as jsonb), :conf)
                 on conflict (id) do nothing""",
              id=img["id"], u=user_id, a=analysis_id, url=img["url"], cat=img["category"],
              ok=img.get("qc_passed"), reasons=_j(img.get("qc_fail_reason") or []),
              conf=img.get("qc_confidence"))


def save_extract(user_id: str, analysis_id: str, cat_ids: list[str],
                 extract: ExtractProcessed) -> Optional[str]:
    rows = _exec("""insert into extracts (analysis_id, user_id, cat_ids, data, confidence)
                    values (:a, :u, cast(:cats as jsonb), cast(:data as jsonb), :conf)
                    on conflict (analysis_id) do update set data = excluded.data,
                      confidence = excluded.confidence
                    returning id""",
                 a=analysis_id, u=user_id, cats=_j(cat_ids),
                 data=extract.model_dump_json(), conf=extract.confidence)
    return str(rows[0]["id"]) if rows else None


def get_extract_row(analysis_id: str) -> Optional[dict]:
    rows = _exec("select id, data, confidence from extracts where analysis_id = :a", a=analysis_id)
    return dict(rows[0]) if rows else None


def save_extract_feedback(user_id: str, analysis_id: str, extract_id: Optional[str],
                          confirmed: bool, note: Optional[str]) -> None:
    _exec("""insert into extract_feedback (analysis_id, extract_id, user_id, confirmed, note)
             values (:a, :e, :u, :c, :n)""",
          a=analysis_id, e=extract_id, u=user_id, c=confirmed, n=note)


def save_report(user_id: str, analysis_id: str, extract_id: Optional[str], cat_ids: list[str],
                report: Report, brand: Optional[str], variant: Optional[str]) -> None:
    from .engine import ENGINE_VERSION
    _exec("""insert into reports (analysis_id, extract_id, user_id, cat_ids, verdict, headline,
             use_as, conditions, categories, per_cat_callouts, health_nudges, therapeutic_purpose,
             per_cat_suitability, vet_disclaimer, detailed_rationale, standards_cited,
             data_quality_warning, engine_version, brand, variant)
             values (:a, :e, :u, cast(:cats as jsonb), :verdict, :headline, :use_as,
                     cast(:conditions as jsonb), cast(:categories as jsonb),
                     cast(:callouts as jsonb), cast(:nudges as jsonb), :purpose,
                     cast(:suitability as jsonb), :disclaimer, :rationale,
                     cast(:standards as jsonb), :warning, :engine_version, :brand, :variant)
             on conflict (analysis_id) do nothing""",
          a=analysis_id, e=extract_id, u=user_id, cats=_j(cat_ids),
          verdict=report.verdict.value, headline=report.headline, use_as=report.use_as,
          conditions=_j(report.conditions),
          categories=_j({k: v.model_dump() for k, v in (report.categories or {}).items()})
          if report.categories else None,
          callouts=_j([c.model_dump() for c in report.per_cat_callouts]),
          nudges=_j(report.health_nudges), purpose=report.therapeutic_purpose,
          suitability=_j([c.model_dump() for c in report.per_cat_suitability]),
          disclaimer=report.vet_disclaimer, rationale=report.detailed_rationale,
          standards=_j(report.standards_cited), warning=report.data_quality_warning,
          engine_version=ENGINE_VERSION, brand=brand, variant=variant)


def save_report_feedback(user_id: str, analysis_id: str, feedback_yn: bool,
                         comments: Optional[str]) -> None:
    _exec("""insert into report_feedback (analysis_id, user_id, feedback_yn, feedback_comments)
             values (:a, :u, :y, :c)""",
          a=analysis_id, u=user_id, y=feedback_yn, c=comments)


def list_reports(user_id: str) -> list[dict]:
    rows = _exec("""select analysis_id, verdict, headline, brand, variant, created_at
                    from reports where user_id = :u order by created_at desc limit 50""", u=user_id)
    return [dict(r) for r in rows]


def get_report_row(analysis_id: str) -> Optional[dict]:
    rows = _exec("select * from reports where analysis_id = :a", a=analysis_id)
    return dict(rows[0]) if rows else None
