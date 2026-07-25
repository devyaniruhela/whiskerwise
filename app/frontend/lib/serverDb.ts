// Raw-Postgres data layer for the no-server CRUD routes — the TypeScript port of
// app/backend/app/db.py. Direct connection to Supabase Postgres (NOT the Data API),
// same SQL as the Python side. Reachable from Vercel functions with no separate server.
//
// ⚠️ Schema lives in THREE places — see app/backend/schema.sql banner and
// code-context.md → "Persistence & identity". A column change here must also land in
// schema.sql and (for cats/reports) db.py.
import postgres from 'postgres';
import type { CatProfile, HistoryItem, UserProfile } from '@/types';

let _sql: postgres.Sql | null = null;

/** Lazy singleton so warm serverless invocations reuse one connection. Null when
 *  DATABASE_URL is unset — callers surface a clean 503 rather than crashing. */
export function db(): postgres.Sql | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!_sql) {
    // prepare:false is REQUIRED for Supabase's transaction pooler (pgbouncer, port 6543);
    // max:1 keeps each serverless instance to a single pooled connection.
    _sql = postgres(url, { prepare: false, ssl: 'require', max: 1, idle_timeout: 20 });
  }
  return _sql;
}

export type Sql = postgres.Sql;

// ── request context (session / browser / device stamping) ────────────
export interface ReqCtx {
  sessionId: string | null;
  userAgent: string | null;
  ip: string | null;
  device: string | null;
}

function deviceFrom(ua: string | null): string | null {
  if (!ua) return null;
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone|iPod|Windows Phone/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function reqCtx(req: Request, sessionId: string | null): ReqCtx {
  const ua = req.headers.get('user-agent');
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? null;
  return { sessionId, userAgent: ua, ip, device: deviceFrom(ua) };
}

async function ensureUser(sql: Sql, userId: string): Promise<void> {
  await sql`insert into users (id) values (${userId}) on conflict (id) do nothing`;
}

// ── users / profile ──────────────────────────────────────────────────
const PROFILE_COLS = ['first_name', 'last_name', 'phone_number', 'email', 'location', 'num_cats', 'cat_parent_since'] as const;

export async function getProfile(sql: Sql, userId: string): Promise<UserProfile> {
  const rows = await sql`
    select first_name, last_name, phone_number, email, location, num_cats, cat_parent_since
    from users where id = ${userId}`;
  return rows[0] ? ({ ...rows[0] } as UserProfile) : {};
}

/** Silent partial save (v1 rule): phone_number and email are unique. If the value the
 *  user submitted is already owned by a DIFFERENT user, we drop just that field (store
 *  null) and save everything else — no error surfaced, no data revealed. First save wins. */
export async function saveProfile(sql: Sql, userId: string, p: UserProfile, ctx: ReqCtx): Promise<void> {
  await ensureUser(sql, userId);

  let phone = p.phone_number ?? null;
  let email = p.email ?? null;
  // pre-check the common case cleanly…
  if (phone) {
    const taken = await sql`select 1 from users where phone_number = ${phone} and id <> ${userId} limit 1`;
    if (taken.length) phone = null;
  }
  if (email) {
    const taken = await sql`select 1 from users where email = ${email} and id <> ${userId} limit 1`;
    if (taken.length) email = null;
  }

  const write = (ph: string | null, em: string | null) => sql`
    update users set
      first_name = ${p.first_name ?? null}, last_name = ${p.last_name ?? null},
      phone_number = ${ph}, email = ${em}, location = ${p.location ?? null},
      num_cats = ${p.num_cats ?? null}, cat_parent_since = ${p.cat_parent_since ?? null},
      session_id = ${ctx.sessionId}, user_agent = ${ctx.userAgent}, ip = ${ctx.ip}, device = ${ctx.device},
      updated_at = now()
    where id = ${userId}`;

  try {
    await write(phone, email);
  } catch (e) {
    // …backstop for the concurrent race the pre-check can't catch: null the offending
    // unique field(s) and retry once.
    const code = (e as { code?: string }).code;
    if (code !== '23505') throw e;
    const c = (e as { constraint_name?: string }).constraint_name ?? '';
    if (c.includes('phone')) phone = null;
    else if (c.includes('email')) email = null;
    else { phone = null; email = null; }
    await write(phone, email);
  }
}

// ── cats ─────────────────────────────────────────────────────────────
// jsonb comes back parsed by postgres.js; the string branch defensively recovers any
// legacy double-encoded rows (jsonb string holding a JSON array).
function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

function rowToCat(r: postgres.Row): CatProfile {
  const dob = r.cat_dob;
  return {
    id: String(r.id),
    cat_name: r.cat_name,
    avatar: r.avatar ?? null,
    cat_dob: dob ? (dob instanceof Date ? dob.toISOString().slice(0, 10) : String(dob).slice(0, 10)) : null,
    cat_gender: r.cat_gender ?? null,
    cat_age_year: r.cat_age_year ?? 0,
    cat_age_month: r.cat_age_month ?? 0,
    body_condition: r.body_condition ?? null,
    weight_kg: r.weight_kg ?? null,
    activity_level: r.activity_level ?? null,
    neuter_status: r.neuter_status ?? null,
    environment: r.environment ?? null,
    health_condition: asStringArray(r.health_condition),
    breed: r.breed ?? null,
  };
}

export async function listCats(sql: Sql, userId: string): Promise<CatProfile[]> {
  const rows = await sql`select * from cats where user_id = ${userId} order by created_at`;
  return rows.map(rowToCat);
}

/** Insert or update a cat, scoped to its owner. The DO UPDATE ... WHERE user_id guard
 *  means a cat id belonging to someone else can never be overwritten. */
export async function saveCat(sql: Sql, userId: string, cat: CatProfile, ctx: ReqCtx): Promise<string | null> {
  await ensureUser(sql, userId);
  const catId = cat.id || crypto.randomUUID();
  const bcs = (cat as { body_condition_score?: number | null }).body_condition_score ?? null; // not collected in v1
  const rows = await sql`
    insert into cats (id, user_id, cat_name, avatar, cat_dob, cat_gender, cat_age_year, cat_age_month,
      body_condition, body_condition_score, weight_kg, activity_level, neuter_status, environment,
      health_condition, breed, session_id, user_agent, ip, device)
    values (${catId}, ${userId}, ${cat.cat_name}, ${cat.avatar ?? null}, ${cat.cat_dob ?? null}::date,
      ${cat.cat_gender ?? null}, ${cat.cat_age_year ?? 0}, ${cat.cat_age_month ?? 0},
      ${cat.body_condition ?? null}, ${bcs}, ${cat.weight_kg ?? null}, ${cat.activity_level ?? null},
      ${cat.neuter_status ?? null}, ${cat.environment ?? null},
      ${sql.json(cat.health_condition ?? [])}, ${cat.breed ?? null},
      ${ctx.sessionId}, ${ctx.userAgent}, ${ctx.ip}, ${ctx.device})
    on conflict (id) do update set
      cat_name = excluded.cat_name, avatar = excluded.avatar, cat_dob = excluded.cat_dob,
      cat_gender = excluded.cat_gender, cat_age_year = excluded.cat_age_year, cat_age_month = excluded.cat_age_month,
      body_condition = excluded.body_condition, body_condition_score = excluded.body_condition_score,
      weight_kg = excluded.weight_kg, activity_level = excluded.activity_level,
      neuter_status = excluded.neuter_status, environment = excluded.environment,
      health_condition = excluded.health_condition, breed = excluded.breed,
      session_id = excluded.session_id, user_agent = excluded.user_agent, ip = excluded.ip,
      device = excluded.device, updated_at = now()
    where cats.user_id = ${userId}
    returning id`;
  if (!rows.length) return null;
  await sql`update users set cat_profile_added = true, updated_at = now() where id = ${userId}`;
  return String(rows[0].id);
}

export async function deleteCat(sql: Sql, userId: string, catId: string): Promise<void> {
  await sql`delete from cats where user_id = ${userId} and id = ${catId}`;
}

// ── report history (read-only here; the Python pipeline writes these) ─
export async function listReports(sql: Sql, userId: string): Promise<HistoryItem[]> {
  const rows = await sql`
    select analysis_id, verdict, headline, brand, variant, created_at
    from reports where user_id = ${userId} order by created_at desc limit 50`;
  return rows.map((r) => ({ ...r } as unknown as HistoryItem));
}

export async function getReport(sql: Sql, analysisId: string): Promise<Record<string, unknown> | null> {
  const rows = await sql`select * from reports where analysis_id = ${analysisId}`;
  if (!rows.length) return null;
  const ex = await sql`select data from extracts where analysis_id = ${analysisId}`;
  return { ...rows[0], extract: ex.length ? ex[0].data : null };
}
