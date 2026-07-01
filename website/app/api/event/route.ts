import { NextRequest } from 'next/server';
import { createEvent } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * Creates an event on the web and returns its master folio. Called by the
 * desktop software when a new event is created (or from the admin page).
 * Auth: header `x-api-key` must equal UPLOAD_API_KEY (when configured).
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.UPLOAD_API_KEY;
  if (apiKey && req.headers.get('x-api-key') !== apiKey) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  let name = 'Evento';
  try {
    const body = (await req.json()) as { name?: string };
    if (body?.name) name = body.name;
  } catch {
    // no body → default name
  }
  const event = await createEvent(name);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  return Response.json({ ok: true, eventFolio: event.eventFolio, page: `${siteUrl}/f/${event.eventFolio}` });
}
