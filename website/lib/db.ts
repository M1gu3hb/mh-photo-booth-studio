import { getText, putText, listTexts } from './storage';
import { newEventFolio, mediaFolio } from './folio';

/**
 * Folio index — WRITE-ONCE design (v0.2).
 *
 * v0.1 kept a mutable per-event JSON bundle, but Vercel Blob URLs are CDN-cached,
 * so overwriting the same pathname served STALE versions (media "missing" from
 * the event). Now every write goes to a UNIQUE pathname that is never rewritten:
 *   - index/events/<EVENT>.json          → { event }            (written once)
 *   - index/media/<FOLIO>.json           → MediaRecord          (one per media)
 *   - index/folios/<FOLIO>.json          → pointer              (one per folio)
 * The event's media list is derived by LISTING the prefix `index/media/<EVENT>-`
 * (a live API call — never cached), so new uploads appear immediately.
 */

export type MediaType = 'photo' | 'video';

export interface MediaRecord {
  folio: string;
  eventFolio: string;
  type: MediaType;
  url: string;
  key: string;
  name: string | null;
  createdAt: string;
}

export interface EventRecord {
  eventFolio: string;
  name: string;
  createdAt: string;
}

type FolioPointer =
  | { kind: 'event'; eventFolio: string }
  | { kind: 'media'; folio: string };

const eventKey = (f: string) => `index/events/${f}.json`;
const folioKey = (f: string) => `index/folios/${f}.json`;
const mediaKey = (f: string) => `index/media/${f}.json`;
const mediaPrefix = (eventFolio: string) => `index/media/${eventFolio}-`;

export async function createEvent(name: string): Promise<EventRecord> {
  const eventFolio = newEventFolio();
  const event: EventRecord = {
    eventFolio,
    name: name.trim() || 'Evento',
    createdAt: new Date().toISOString()
  };
  await putText(eventKey(eventFolio), JSON.stringify({ event }));
  await putText(folioKey(eventFolio), JSON.stringify({ kind: 'event', eventFolio } satisfies FolioPointer));
  return event;
}

async function listEventMedia(eventFolio: string): Promise<MediaRecord[]> {
  const texts = await listTexts(mediaPrefix(eventFolio));
  const media: MediaRecord[] = [];
  for (const raw of texts) {
    try {
      media.push(JSON.parse(raw) as MediaRecord);
    } catch {
      // Skip unreadable marker; the rest of the gallery still loads.
    }
  }
  media.sort((a, b) => a.folio.localeCompare(b.folio));
  return media;
}

export async function addMedia(
  eventFolio: string,
  input: { type: MediaType; url: string; key: string; name?: string | null; clientRef?: string | null }
): Promise<MediaRecord> {
  // No counting → no read/increment race. Folio is unique+deterministic from the
  // media's client UUID, so simultaneous photo+video uploads never collide.
  const folio = mediaFolio(eventFolio, input.clientRef ?? '');
  const record: MediaRecord = {
    folio,
    eventFolio,
    type: input.type,
    url: input.url,
    key: input.key,
    name: input.name ?? null,
    createdAt: new Date().toISOString()
  };
  await putText(mediaKey(folio), JSON.stringify(record));
  await putText(folioKey(folio), JSON.stringify({ kind: 'media', folio } satisfies FolioPointer));
  return record;
}

export interface FolioResult {
  scope: 'event' | 'media';
  event: EventRecord | null;
  media: MediaRecord[];
}

/** Resolve any folio (event → all media via prefix listing; individual → one). */
export async function resolveFolio(folio: string): Promise<FolioResult | null> {
  const ptrRaw = await getText(folioKey(folio));
  if (!ptrRaw) return null;
  const ptr = JSON.parse(ptrRaw) as FolioPointer;

  if (ptr.kind === 'event') {
    const raw = await getText(eventKey(ptr.eventFolio));
    if (!raw) return null;
    // Both the v0.1 bundle ({event, media}) and v0.2 ({event}) carry `.event`.
    const event = (JSON.parse(raw) as { event: EventRecord }).event;
    const media = await listEventMedia(ptr.eventFolio);
    return { scope: 'event', event, media };
  }

  const recRaw = await getText(mediaKey(ptr.folio));
  if (!recRaw) return null;
  return { scope: 'media', event: null, media: [JSON.parse(recRaw) as MediaRecord] };
}
