import { NextRequest } from 'next/server';
import { getBinary } from '@/lib/storage';

export const runtime = 'nodejs';

/** Dev-only local media serving. In production, media is served by its Blob URL. */
export async function GET(_req: NextRequest, { params }: { params: { key: string[] } }) {
  const key = params.key.map((p) => decodeURIComponent(p)).join('/');
  const buf = await getBinary(key);
  if (!buf) return new Response('Not found', { status: 404 });
  const contentType = key.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg';
  return new Response(new Uint8Array(buf), {
    headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000, immutable' }
  });
}
