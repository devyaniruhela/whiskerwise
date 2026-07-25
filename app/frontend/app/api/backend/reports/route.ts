// Scan history list — replaces FastAPI GET /reports (no-server plan). Reads the
// reports table the Python pipeline writes; returns [] until scanning is live.
import { NextResponse } from 'next/server';
import { route } from '@/lib/apiRoute';
import { listReports } from '@/lib/serverDb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  return route('GET /reports', req, async (sql, id) => {
    return NextResponse.json(await listReports(sql, id.userId));
  });
}
