// Thin wrapper shared by every CRUD route: opens the DB (clean 503 if unconfigured),
// resolves identity, runs the handler, and logs one instrumentation line (ok/fail +
// ms) per CLAUDE.md rule 7. Real errors surface as 500 — no more silent "saved".
import { NextResponse } from 'next/server';
import { db, type Sql } from '@/lib/serverDb';
import { identify, type Identity } from '@/lib/serverAuth';

export async function route(
  name: string,
  req: Request,
  fn: (sql: Sql, id: Identity) => Promise<Response>,
): Promise<Response> {
  const t = Date.now();
  const sql = db();
  if (!sql) {
    console.error(`[wiser.crud] ${name} unavailable: DATABASE_URL not set`);
    return NextResponse.json({ error: 'Persistence unavailable.' }, { status: 503 });
  }
  try {
    const id = await identify(req);
    const res = await fn(sql, id);
    console.log(`[wiser.crud] ${name} ok ${Date.now() - t}ms`);
    return res;
  } catch (e) {
    console.error(`[wiser.crud] ${name} failed ${Date.now() - t}ms:`, e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
