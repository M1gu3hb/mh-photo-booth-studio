import { NextRequest } from 'next/server';
import { putBinary } from '@/lib/storage';
import { addMedia, type MediaType } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * Upload endpoint used by the desktop software (MH Photo Booth Studio).
 * multipart/form-data: file, eventFolio, type ('photo'|'video'), name?
 * Auth: header `x-api-key` must equal UPLOAD_API_KEY (when configured).
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.UPLOAD_API_KEY;
  if (apiKey && req.headers.get('x-api-key') !== apiKey) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ ok: false, error: 'invalid form' }, { status: 400 });
  }

  const file = form.get('file');
  const eventFolio = String(form.get('eventFolio') ?? '').trim().toUpperCase();
  const type: MediaType = String(form.get('type') ?? 'photo') === 'video' ? 'video' : 'photo';
  const name = form.get('name') ? String(form.get('name')) : null;

  if (!(file instanceof File) || !eventFolio) {
    return Response.json({ ok: false, error: 'file and eventFolio required' }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  // Keep the real extension so videos (webm/mp4/mov) and photos (png/jpg) play back correctly.
  const fromName = (file.name.split('.').pop() ?? '').toLowerCase();
  const allowed = type === 'video' ? ['mp4', 'webm', 'mov'] : ['jpg', 'jpeg', 'png'];
  const ext = allowed.includes(fromName) ? fromName : type === 'video' ? 'webm' : 'png';
  const rand = Math.random().toString(36).slice(2, 8);
  const key = `media/${eventFolio}/${Date.now()}-${rand}.${ext}`;
  const contentType =
    file.type ||
    (type === 'video'
      ? ext === 'mp4'
        ? 'video/mp4'
        : 'video/webm'
      : ext === 'png'
        ? 'image/png'
        : 'image/jpeg');

  const stored = await putBinary(key, buf, contentType);
  const record = await addMedia(eventFolio, { type, url: stored.url, key: stored.key, name });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  return Response.json({
    ok: true,
    folio: record.folio,
    eventFolio,
    url: stored.url,
    page: `${siteUrl}/f/${record.folio}`
  });
}
