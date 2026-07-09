// UI + API contract types. API shapes mirror app/backend/app/models.py (source of
// truth: wiser-extract-data-model.csv) — field names match the backend exactly.

export interface CatAvatar { id: string; image: string }
export interface BodyCondition { id: string; label: string; desc: string; image: string }

export type Verdict = 'buy' | 'buy_with_conditions' | 'skip' | 'vet_diet' | 'no_verdict';
export type AnalysisStatus =
  | 'processing' | 'awaiting_confirmation' | 'qc_failed' | 'no_verdict' | 'done' | 'error';

export interface UserProfile {
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  email?: string | null;
  location?: string | null;
}

export interface CatProfile {
  id?: string | null;
  cat_name: string;
  avatar?: string | null;                  // cats-*.png id; randomized default, user-pickable
  cat_dob?: string | null;                 // ISO date (passport)
  cat_gender?: string | null;
  cat_age_year: number;
  cat_age_month: number;
  body_condition?: number | null;         // 1 underweight … 4 obese
  weight_kg?: number | null;
  activity_level?: string | null;
  neuter_status?: string | null;
  environment?: string | null;
  health_condition: string[];
  breed?: string | null;
}

export interface GuaranteedAnalysis {
  protein?: number | null; fat?: number | null; fibre?: number | null;
  ash?: number | null; moisture?: number | null;
  others?: { label: string; value: string }[];
}

export interface ExtractSummary {
  brand?: string | null; variant?: string | null;
  lifestage?: string; type?: string; adequacy?: string;
  ingredients?: string[]; additives?: string[];
  guaranteed_analysis?: GuaranteedAnalysis;
  confidence?: number | null;
}

export interface CategoryResult { result: string; note?: string; flags?: string[] }
export interface PerCatCallout { cat_id?: string | null; cat_name: string; note: string }

export interface Report {
  verdict: Verdict;
  headline: string;
  use_as?: string | null;
  conditions: string[];
  categories?: Record<string, CategoryResult> | null;
  per_cat_callouts: PerCatCallout[];
  health_nudges: string[];
  therapeutic_purpose?: string | null;
  per_cat_suitability: PerCatCallout[];
  vet_disclaimer?: string | null;
  detailed_rationale: string;
  standards_cited: string[];
  data_quality_warning?: string | null;
}

export interface AnalysisState {
  analysis_id: string;
  status: AnalysisStatus;
  stage: string;
  stage_label?: string;
  extract?: ExtractSummary;
  report?: Report;
  guidance?: string;
}

export interface HistoryItem {
  analysis_id: string; verdict: Verdict; headline: string;
  brand?: string | null; variant?: string | null; created_at: string;
}
