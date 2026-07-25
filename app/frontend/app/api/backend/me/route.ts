// Profile CRUD — replaces the FastAPI /me endpoints (no-server plan). Shadows the
// catch-all proxy for this exact path; scan paths still fall through to it.
import { NextResponse } from 'next/server';
import { route } from '@/lib/apiRoute';
import { getProfile, saveProfile, reqCtx } from '@/lib/serverDb';
import type { UserProfile } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  return route('GET /me', req, async (sql, id) => {
    return NextResponse.json(await getProfile(sql, id.userId));
  });
}

export function PUT(req: Request) {
  return route('PUT /me', req, async (sql, id) => {
    const body = (await req.json()) as UserProfile;
    await saveProfile(sql, id.userId, body, reqCtx(req, id.sessionId));
    return new NextResponse(null, { status: 204 });
  });
}
