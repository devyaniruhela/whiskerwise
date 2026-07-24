-- Wiser schema — mirrors wiser-extract-data-model.csv (source of truth).
-- Applied idempotently at startup by db.py. Direct Postgres (Data API off).

create table if not exists users (
  id uuid primary key,                       -- mirrors auth.users.id (anonymous v1)
  email text unique, phone_number text unique,
  first_name text, last_name text,
  otp_verified boolean default false,
  cat_profile_added boolean default false,
  num_scan_attempts int default 0,
  num_scans_success int default 0,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists cats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  cat_name text not null, cat_gender text,
  cat_age_year int default 0, cat_age_month int default 0,
  body_condition int,                        -- 1-4 (BCS sub-ranges)
  body_condition_score int,                  -- WSAVA 1-9, later
  weight_kg real, activity_level text, neuter_status text, environment text,
  health_condition jsonb default '[]',       -- free-text list
  breed text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, analysis_id uuid, url text not null, category text,
  qc_passed boolean, qc_fail_reason jsonb, qc_confidence real,
  created_at timestamptz default now()
);

create table if not exists extracts (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid unique not null,
  user_id uuid, cat_ids jsonb default '[]',
  data jsonb not null,                       -- full ExtractProcessed (all CSV fields preserved)
  confidence real,
  created_at timestamptz default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid unique not null,
  extract_id uuid, user_id uuid, cat_ids jsonb default '[]',
  verdict text not null, headline text not null, use_as text,
  conditions jsonb default '[]', categories jsonb,
  per_cat_callouts jsonb default '[]', health_nudges jsonb default '[]',
  therapeutic_purpose text, per_cat_suitability jsonb, vet_disclaimer text,
  detailed_rationale text, standards_cited jsonb default '[]',
  data_quality_warning text, engine_version text,
  brand text, variant text,                  -- denormalised for the history timeline
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists extract_feedback (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null, extract_id uuid, user_id uuid,
  confirmed boolean not null, note text,
  created_at timestamptz default now()
);

create table if not exists report_feedback (
  id uuid primary key default gen_random_uuid(),
  report_id uuid, analysis_id uuid, user_id uuid,
  feedback_yn boolean not null, feedback_comments text,
  created_at timestamptz default now()
);

create index if not exists reports_user_idx on reports (user_id, created_at desc);
create index if not exists cats_user_idx on cats (user_id);

-- additive migrations (idempotent) — profile brief 08 Jul 2026
alter table users add column if not exists location text;
alter table cats add column if not exists avatar text;        -- cats-*.png id, user-pickable
alter table cats add column if not exists cat_dob date;

-- profile brief 24 Jul 2026: self-reported cat-parent details (mandatory on save)
alter table users add column if not exists num_cats int;             -- ≥1
alter table users add column if not exists cat_parent_since int;     -- year, present or earlier
