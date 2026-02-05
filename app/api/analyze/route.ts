import { NextRequest, NextResponse } from 'next/server';
import type { AnalysisPayload, ImageData, CTASourceAnalysis } from '@/types/analysis';

const CTASources: CTASourceAnalysis[] = ['landing_main', 'landing_personalise', 'profile'];

function isImageData(x: unknown): x is ImageData {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.imageId === 'string' &&
    typeof o.cloudinaryUrl === 'string' &&
    (o.category === 'front' || o.category === 'back')
  );
}

function validatePayload(body: unknown): body is AnalysisPayload {
  if (!body || typeof body !== 'object') return false;
  const o = body as Record<string, unknown>;
  if (typeof o.analysis_id !== 'string' || o.analysis_id.length === 0) return false;
  if (typeof o.session_id !== 'string' || o.session_id.length === 0) return false;
  if (typeof o.personalise_flag !== 'boolean') return false;
  if (!Array.isArray(o.cat_ids) || !o.cat_ids.every((id): id is string => typeof id === 'string'))
    return false;
  if (!Array.isArray(o.images) || !o.images.every(isImageData)) return false;
  if (!CTASources.includes(o.cta_source as CTASourceAnalysis)) return false;
  if (typeof o.timestamp !== 'string' || o.timestamp.length === 0) return false;
  return true;
}

/**
 * POST: Receive analysis payload from client, validate, forward to n8n.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!validatePayload(body)) {
      return NextResponse.json({ error: 'Invalid analysis payload' }, { status: 400 });
    }

    const webhookUrl = process.env.N8N_WEBHOOK_URL_ANALYZE;
    if (!webhookUrl?.trim()) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[analyze] N8N_WEBHOOK_URL_ANALYZE not set');
      }
      return NextResponse.json(
        { error: 'Analysis webhook not configured' },
        { status: 503 }
      );
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[analyze] n8n webhook not ok', res.status, data);
      }
      return NextResponse.json(
        { error: 'Analysis webhook failed', details: data },
        { status: 502 }
      );
    }

    return NextResponse.json(data ?? { ok: true });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[analyze]', err);
    }
    return NextResponse.json(
      { error: 'Analysis request failed' },
      { status: 500 }
    );
  }
}
