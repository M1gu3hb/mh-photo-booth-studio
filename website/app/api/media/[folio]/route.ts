import { NextRequest } from 'next/server';
import { resolveFolio } from '@/lib/db';
import { normalizeFolio } from '@/lib/folio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { folio: string } }) {
  const result = await resolveFolio(normalizeFolio(decodeURIComponent(params.folio)));
  if (!result) return Response.json({ ok: false, error: 'not found' }, { status: 404 });
  return Response.json({ ok: true, ...result });
}
