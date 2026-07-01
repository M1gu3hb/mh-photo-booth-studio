import { FolioForm } from '@/components/FolioForm';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="card rounded-3xl p-8 sm:p-10">
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">
          <span className="brass-text">Tus recuerdos</span> del evento
        </h1>
        <p className="mt-3 text-cream-dim">
          Ingresa tu <strong className="text-cream">número de folio</strong> (o escanea el QR que te
          dieron en la cabina) para ver y descargar tus fotos y videos.
        </p>
        <div className="mt-7">
          <FolioForm />
        </div>
        <p className="mt-5 text-sm text-cream-dim">
          Cada folio es privado: solo tú ves lo tuyo. Los anfitriones del evento tienen un folio
          especial que muestra todo.
        </p>
      </div>

      <ol className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ['1', 'Toma tu foto o video', 'En la cabina, al terminar recibes un folio y un QR.'],
          ['2', 'Entra con tu folio', 'Escríbelo aquí o escanea el QR desde la pantalla.'],
          ['3', 'Descarga', 'Guarda tus recuerdos en alta calidad.']
        ].map(([n, t, d]) => (
          <li key={n} className="card rounded-2xl p-5">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-brass-600 font-display text-brass-300">
              {n}
            </span>
            <p className="mt-3 font-semibold text-cream">{t}</p>
            <p className="mt-1 text-sm text-cream-dim">{d}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
