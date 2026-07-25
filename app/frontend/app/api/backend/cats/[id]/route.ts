// Cat delete — replaces FastAPI DELETE /cats/{id} (no-server plan).
import { NextResponse } from 'next/server';
import { route } from '@/lib/apiRoute';
import { deleteCat } from '@/lib/serverDb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return route('DELETE /cats/:id', req, async (sql, id) => {
    const { id: catId } = await ctx.params;
    await deleteCat(sql, id.userId, catId);
    return new NextResponse(null, { status: 204 });
  });
}
