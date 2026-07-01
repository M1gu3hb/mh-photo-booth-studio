import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MH Photo Booth · Tus fotos y videos',
  description: 'Descarga tus fotos y videos del evento con tu número de folio.',
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-body text-cream antialiased">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-8">
          <header className="mb-8 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-brass-600 bg-felt-700 text-brass-400">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="12" cy="13" r="4" />
                <path d="M4 8h3l1.5-2h7L20 8h0a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
              </svg>
            </span>
            <div className="leading-tight">
              <p className="font-display text-lg tracking-wide brass-text">MH Photo Booth</p>
              <p className="text-xs text-cream-dim">Galería de tu evento</p>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="mt-10 text-center text-xs text-cream-dim">
            © {new Date().getFullYear()} MH Photo Booth · Descarga con tu folio
          </footer>
        </div>
      </body>
    </html>
  );
}
