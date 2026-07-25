// Single report + its extract — replaces FastAPI GET /report/{analysis_id} (no-server
// plan). Reads the reports/extracts tables; 404 until a scan has produced one.
import { NextResponse } from 'next/server';
import { route } from '@/lib/apiRoute';
import { getReport } from '@/lib/serverDb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return route('GET /report/:id', req, async (sql) => {
    const { id: analysisId } = await ctx.params;
    const report = await getReport(sql, analysisId);
    if (!report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
    return NextResponse.json(report);
  });
}
