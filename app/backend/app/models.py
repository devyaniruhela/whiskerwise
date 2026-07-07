"""Pipeline contracts. Source of truth: wiser-extract-data-model.csv (07 Jul 2026)
+ kb/06_verdict_logic.md §11 for the Report shape. Enum values follow the CSV;
known gaps/conflicts vs the CSV are logged in task-manager.md, not papered over here.
"""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ── Enums (values per CSV) ───────────────────────────────────────────

class Lifestage(str, Enum):
    kitten = "kitten"
    adult = "adult"
    senior = "senior"
    all_life_stages = "all_life_stages"  # matches every cat (kb/01 lookup)
    medical = "medical"   # therapeutic marker → kb/06 §3 vet_diet track
    breed = "breed"
    unknown = "unknown"


class FoodType(str, Enum):
    dry = "dry"
    wet = "wet"
    creamy_treat = "creamy treat"
    other_treat = "other treat"
    unknown = "unknown"


class TypeMethod(str, Enum):
    pack = "pack"
    moisture = "moisture"
    other = "other"


class Adequacy(str, Enum):
    complete = "complete"
    complementary = "complementary"
    treat = "treat"
    unknown = "unknown"


class Verdict(str, Enum):
    buy = "buy"
    buy_with_conditions = "buy_with_conditions"
    skip = "skip"
    vet_diet = "vet_diet"
    no_verdict = "no_verdict"


class ImageCategory(str, Enum):
    front = "front"
    back = "back"


class AnalysisStatus(str, Enum):
    processing = "processing"
    awaiting_confirmation = "awaiting_confirmation"  # post-extraction checkpoint (PRD §8.5)
    qc_failed = "qc_failed"
    no_verdict = "no_verdict"
    done = "done"
    error = "error"


class Stage(str, Enum):
    queued = "queued"
    qc = "qc"
    extracting = "extracting"
    awaiting_confirmation = "awaiting_confirmation"
    assessing = "assessing"
    explaining = "explaining"
    done = "done"


# ── Cats (CSV `Cats` table; body_condition = required 4-point scale) ─

class CatProfile(BaseModel):
    id: Optional[str] = None
    cat_name: str
    cat_gender: Optional[str] = None            # male | female
    cat_age_year: int = 0
    cat_age_month: int = 0
    body_condition: Optional[int] = Field(default=None, ge=1, le=4)  # 1 underweight … 4 obese
    body_condition_score: Optional[int] = Field(default=None, ge=1, le=9)  # WSAVA, later
    weight_kg: Optional[float] = None
    activity_level: Optional[str] = None        # assumed moderately active
    neuter_status: Optional[str] = None         # assumed neutered
    environment: Optional[str] = None           # assumed indoor only
    health_condition: list[str] = []            # free-text multi-select, no enum (CSV)
    breed: Optional[str] = None


# ── Extraction (CSV `Extracts (processed)`, engine-facing subset) ────

class GuaranteedAnalysisItem(BaseModel):
    label: str
    value: str                                   # exact string as printed (units kept)


class GuaranteedAnalysis(BaseModel):
    """Fractions 0-1 as-fed (per CSV); None = not declared on pack."""
    protein: Optional[float] = None
    fat: Optional[float] = None
    fibre: Optional[float] = None
    ash: Optional[float] = None
    moisture: Optional[float] = None
    others: list[GuaranteedAnalysisItem] = []


class ExtractProcessed(BaseModel):
    id: Optional[str] = None
    extract_id: Optional[str] = None
    brand: Optional[str] = None
    variant: Optional[str] = None
    lifestage: Lifestage = Lifestage.unknown
    type: FoodType = FoodType.unknown
    type_method: Optional[TypeMethod] = None
    adequacy: Adequacy = Adequacy.unknown
    texture: Optional[str] = None
    aafco_certified: bool = False
    other_certifications: list[str] = []
    claims: list[str] = []
    intended_use: Optional[str] = None           # therapeutic marker or None
    ingredients: list[str] = []                  # pack order preserved
    additives: list[str] = []
    guaranteed_analysis: GuaranteedAnalysis = GuaranteedAnalysis()
    taurine_added: Optional[bool] = None
    weight_g: Optional[int] = None               # grams (unit standardised in name), single unit
    met_energy_100g: Optional[str] = None
    translated_flag: bool = False
    detected_language: Optional[str] = None
    confidence: Optional[float] = Field(default=None, ge=0, le=1)
    extract_note: Optional[str] = None
    unreadable_fields: list[str] = []


# ── QC (Tier 1, per image) ───────────────────────────────────────────

class QCResult(BaseModel):
    image_id: str
    qc_passed: bool
    category: Optional[str] = None               # front | back | invalid | unknown
    product_context: Optional[str] = None
    qc_fail_reason: list[str] = []
    qc_confidence: Optional[float] = Field(default=None, ge=0, le=1)


# ── Request (matches old FE AnalysisPayload / PRD §9.2) ──────────────

class ImageRef(BaseModel):
    imageId: str
    cloudinaryUrl: str
    category: ImageCategory


class AnalysisPayload(BaseModel):
    analysis_id: str
    session_id: Optional[str] = None
    personalise_flag: bool = False
    cat_ids: list[str] = []
    images: list[ImageRef]
    cta_source: Optional[str] = None
    timestamp: Optional[str] = None


# ── Report (kb/06 §11 output contract) ───────────────────────────────

class CategoryResult(BaseModel):
    result: str
    note: str = ""
    flags: list[str] = []


class PerCatCallout(BaseModel):
    cat_id: Optional[str] = None
    cat_name: str
    note: str


class Report(BaseModel):
    verdict: Verdict
    headline: str
    use_as: Optional[str] = None                 # topper | treat (kb/06 §3)
    conditions: list[str] = []
    categories: Optional[dict[str, CategoryResult]] = None  # omitted for vet_diet
    per_cat_callouts: list[PerCatCallout] = []
    health_nudges: list[str] = []
    therapeutic_purpose: Optional[str] = None    # vet_diet track only
    per_cat_suitability: list[PerCatCallout] = []
    vet_disclaimer: Optional[str] = None
    detailed_rationale: str = ""                 # always generated, shown collapsed
    standards_cited: list[str] = []
    data_quality_warning: Optional[str] = None


# ── Polling / checkpoint responses ───────────────────────────────────

class AnalysisAccepted(BaseModel):
    analysis_id: str
    status: AnalysisStatus = AnalysisStatus.processing


class ExtractConfirmation(BaseModel):
    confirmed: bool
    note: Optional[str] = None                   # user's correction text when not confirmed


class ReportFeedback(BaseModel):
    feedback_yn: bool                            # thumbs up (True) / down (False)
    feedback_comments: Optional[str] = None


class AnalysisState(BaseModel):
    analysis_id: str
    status: AnalysisStatus
    stage: Stage
    stage_label: Optional[str] = None            # plain-English progress copy (config stage_labels)
    extract: Optional[ExtractProcessed] = None   # populated at the confirm checkpoint
    report: Optional[Report] = None              # populated when done
    guidance: Optional[str] = None               # re-upload guidance on qc_failed / no_verdict
