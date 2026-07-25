// Cat list + upsert — replaces FastAPI GET/POST /cats (no-server plan).
import { NextResponse } from 'next/server';
import { route } from '@/lib/apiRoute';
import { listCats, saveCat, reqCtx } from '@/lib/serverDb';
import type { CatProfile } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  return route('GET /cats', req, async (sql, id) => {
    return NextResponse.json(await listCats(sql, id.userId));
  });
}

export function POST(req: Request) {
  return route('POST /cats', req, async (sql, id) => {
    const body = (await req.json()) as CatProfile;
    const catId = await saveCat(sql, id.userId, body, reqCtx(req, id.sessionId));
    if (!catId) return NextResponse.json({ error: 'Cat not saved.' }, { status: 503 });
    return NextResponse.json({ ...body, id: catId } satisfies CatProfile);
  });
}
