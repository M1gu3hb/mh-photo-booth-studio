import { NextRequest } from 'next/server';
import { addMedia, type MediaType } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * Registers a blob that was uploaded directly (client upload) so it gets its
 * folio and appears under the event. Called by the desktop after /api/blob-token
 * + direct upload succeed. Auth: x-api-key.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.UPLOAD_API_KEY;
  if (apiKey && req.headers.get('x-api-key') !== apiKey) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  let body: { eventFolio?: string; type?: string; name?: string; url?: string; key?: string; clientRef?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }
  const eventFolio = String(body.eventFolio ?? '').trim().toUpperCase();
  const url = String(body.url ?? '');
  if (!eventFolio || !url.startsWith('https://')) {
    return Response.json({ ok: false, error: 'eventFolio and url required' }, { status: 400 });
  }
  const type: MediaType = body.type === 'video' ? 'video' : 'photo';
  const record = await addMedia(eventFolio, {
    type,
    url,
    key: String(body.key ?? url),
    name: body.name ?? null,
    clientRef: body.clientRef ?? null
  });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  return Response.json({
    ok: true,
    folio: record.folio,
    eventFolio,
    url,
    page: `${siteUrl}/f/${record.folio}`
  });
}
