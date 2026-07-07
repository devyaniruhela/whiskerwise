// BFF proxy: browser → /api/backend/* → FastAPI (PRD §9.2). Keys and the upstream
// URL stay server-side; the Supabase JWT passes through for identity.
import { NextRequest, NextResponse } from 'next/server';

const API = process.env.ANALYZE_API_URL ?? 'http://localhost:8000';

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const upstream = await fetch(`${API}/${path.join('/')}${req.nextUrl.search}`, {
    method: req.method,
    headers: {
      'content-type': 'application/json',
      authorization: req.headers.get('authorization') ?? '',
    },
    body: ['GET', 'DELETE', 'HEAD'].includes(req.method) ? undefined : await req.text(),
    cache: 'no-store',
  });
  if (upstream.status === 204) return new NextResponse(null, { status: 204 });
  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  });
}

export { proxy as GET, proxy as POST, proxy as DELETE };
