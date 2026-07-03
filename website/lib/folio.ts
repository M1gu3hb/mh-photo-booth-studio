// Folio generation: short, readable, unambiguous codes.
// Event folio: MH-XXXX. Individual media folio: MH-XXXX-NNNN.

const ALPHABET = 'ACDEFGHJKLMNPQRTUVWXY34679'; // no ambiguous chars (0/O, 1/I, etc.)

function randomBlock(len: number): string {
  let out = '';
  for (let i = 0; i < len; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/** A new event folio, e.g. "MH-7Q2K". */
export function newEventFolio(): string {
  return `MH-${randomBlock(4)}`;
}

/**
 * An individual media folio derived from the event folio + the media's client
 * reference (the desktop session/video UUID). Deterministic per media (retries
 * yield the same folio → idempotent) AND unique across media (distinct UUIDs) →
 * collision-free even when a photo and a video finish uploading at the exact
 * same instant. No shared counter, so there is no read/increment race.
 */
export function mediaFolio(eventFolio: string, clientRef: string): string {
  const token = clientRef.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  const suffix = token || Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${eventFolio}-${suffix}`;
}

/** True for an event-level folio (no individual sequence). */
export function isEventFolio(folio: string): boolean {
  return /^MH-[A-Z0-9]{4}$/i.test(folio.trim());
}

export function normalizeFolio(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}
