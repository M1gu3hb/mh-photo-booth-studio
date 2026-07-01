'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function FolioForm() {
  const router = useRouter();
  const [value, setValue] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const folio = value.trim().toUpperCase().replace(/\s+/g, '');
    if (folio) router.push(`/f/${encodeURIComponent(folio)}`);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ej. MH-7Q2K-0007"
        aria-label="Número de folio"
        autoCapitalize="characters"
        className="flex-1 rounded-xl border border-brass-600 bg-felt-800 px-4 py-3 text-lg tracking-wider text-cream placeholder:text-cream-dim/60 outline-none focus:border-brass-400 focus:ring-2 focus:ring-brass-500/40"
      />
      <button
        type="submit"
        className="rounded-xl bg-gradient-to-b from-brass-300 via-brass-500 to-brass-600 px-6 py-3 font-semibold text-felt-900 shadow-lg transition hover:brightness-110 active:brightness-95"
      >
        Ver mis fotos
      </button>
    </form>
  );
}
