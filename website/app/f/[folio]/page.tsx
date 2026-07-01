import Link from 'next/link';
import { resolveFolio } from '@/lib/db';
import { normalizeFolio } from '@/lib/folio';

export const dynamic = 'force-dynamic';

export default async function FolioPage({ params }: { params: { folio: string } }) {
  const folio = normalizeFolio(decodeURIComponent(params.folio));
  const result = await resolveFolio(folio);

  if (!result) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="card rounded-3xl p-8 text-center">
          <h1 className="font-display text-2xl brass-text">Folio no encontrado</h1>
          <p className="mt-3 text-cream-dim">
            Revisa el número <strong className="text-cream">{folio}</strong>. Si tu evento acaba de
            terminar, puede tardar unos minutos en aparecer.
          </p>
          <Link href="/" className="mt-6 inline-block rounded-xl border border-brass-600 px-5 py-2.5 text-cream hover:bg-felt-700">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  const title = result.scope === 'event' ? (result.event?.name ?? 'Evento') : 'Tu recuerdo';
  const subtitle =
    result.scope === 'event'
      ? `Folio de evento · ${result.media.length} archivo(s)`
      : `Folio ${folio}`;

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl brass-text">{title}</h1>
          <p className="text-sm text-cream-dim">{subtitle}</p>
        </div>
        <Link href="/" className="rounded-xl border border-brass-600 px-4 py-2 text-sm text-cream hover:bg-felt-700">
          Otro folio
        </Link>
      </div>

      {result.media.length === 0 ? (
        <div className="card rounded-2xl p-8 text-center text-cream-dim">
          Aún no hay archivos para este folio.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.media.map((m) => (
            <figure key={m.folio} className="card overflow-hidden rounded-2xl">
              <div className="aspect-[3/4] bg-felt-900">
                {m.type === 'video' ? (
                  <video src={m.url} controls playsInline className="h-full w-full object-contain" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.name ?? 'Foto'} className="h-full w-full object-contain" />
                )}
              </div>
              <figcaption className="flex items-center justify-between gap-2 p-3">
                <span className="text-xs text-cream-dim">{m.folio}</span>
                {/* ?download=1 makes Blob serve Content-Disposition: attachment —
                    a real download on phones too (the `download` attr is ignored
                    cross-origin). */}
                <a
                  href={`${m.url}?download=1`}
                  className="rounded-lg bg-gradient-to-b from-brass-300 via-brass-500 to-brass-600 px-3 py-1.5 text-sm font-semibold text-felt-900 hover:brightness-110"
                >
                  Descargar
                </a>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
