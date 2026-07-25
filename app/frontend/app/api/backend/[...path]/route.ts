// BFF proxy: browser → /api/backend/* → FastAPI (PRD §9.2). Keys and the upstream
// URL stay server-side; the Supabase JWT passes through for identity.
import { NextRequest, NextResponse } from 'next/server';

const API = process.env.ANALYZE_API_URL ?? 'http://localhost:8000';

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  let upstream: Response;
  try {
    upstream = await fetch(`${API}/${path.join('/')}${req.nextUrl.search}`, {
      method: req.method,
      headers: {
        'content-type': 'application/json',
        authorization: req.headers.get('authorization') ?? '',
      },
      body: ['GET', 'DELETE', 'HEAD'].includes(req.method) ? undefined : await req.text(),
      cache: 'no-store',
    });
  } catch {
    // The analysis backend is unreachable (not deployed, ANALYZE_API_URL unset so it
    // falls back to localhost:8000, or a network error). Surface a clean 502 instead of
    // letting the throw become an opaque 500 — this is the cat-save "500" in production.
    return NextResponse.json(
      { error: 'Analysis service unreachable. Set ANALYZE_API_URL and deploy the backend.' },
      { status: 502 },
    );
  }
  if (upstream.status === 204) return new NextResponse(null, { status: 204 });
  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as DELETE };
