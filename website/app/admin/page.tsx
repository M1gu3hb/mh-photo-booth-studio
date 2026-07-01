'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function AdminPage() {
  const [eventFolio, setEventFolio] = useState('');
  const [created, setCreated] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createEvent() {
    setBusy(true);
    try {
      const res = await fetch('/api/event', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Evento de prueba' })
      });
      const data = await res.json();
      setCreated(data.ok ? data.eventFolio : null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="card rounded-3xl p-8">
        <h1 className="font-display text-2xl brass-text">Panel del anfitrión</h1>
        <p className="mt-2 text-cream-dim">
          Con el <strong className="text-cream">folio del evento</strong> puedes ver todas las fotos y
          videos del evento.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            value={eventFolio}
            onChange={(e) => setEventFolio(e.target.value)}
            placeholder="Folio del evento (MH-XXXX)"
            className="flex-1 rounded-xl border border-brass-600 bg-felt-800 px-4 py-3 tracking-wider text-cream outline-none focus:border-brass-400"
          />
          <Link
            href={eventFolio ? `/f/${encodeURIComponent(eventFolio.trim().toUpperCase())}` : '#'}
            className="rounded-xl bg-gradient-to-b from-brass-300 via-brass-500 to-brass-600 px-6 py-3 text-center font-semibold text-felt-900 hover:brightness-110"
          >
            Ver evento
          </Link>
        </div>

        <hr className="my-7 border-t hairline" />

        <button
          onClick={() => void createEvent()}
          disabled={busy}
          className="rounded-xl border border-brass-600 px-5 py-2.5 text-cream hover:bg-felt-700 disabled:opacity-60"
        >
          {busy ? 'Creando…' : 'Crear evento de prueba'}
        </button>
        {created && (
          <p className="mt-4 text-cream">
            Evento creado. Folio:{' '}
            <Link href={`/f/${created}`} className="brass-text font-semibold underline">
              {created}
            </Link>
          </p>
        )}
        <p className="mt-4 text-xs text-cream-dim">
          Nota: en producción, la creación de eventos y la subida de medios las hace el software con la
          API key. Esta página es un panel básico; el panel completo se administra desde el software.
        </p>
      </div>
    </div>
  );
}
