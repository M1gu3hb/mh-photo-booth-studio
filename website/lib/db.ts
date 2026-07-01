import { getText, putText } from './storage';
import { newEventFolio, mediaFolio } from './folio';

/**
 * Folio index persisted as JSON manifests via the storage layer.
 * v0.1: simple and works with only a Blob store configured. For high concurrency
 * in production, migrate to Vercel KV/Postgres (see CONTEXT.md §2/§8).
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

interface EventBundle {
  event: EventRecord;
  media: MediaRecord[];
}

type FolioPointer =
  | { kind: 'event'; eventFolio: string }
  | { kind: 'media'; folio: string };

const eventKey = (f: string) => `index/events/${f}.json`;
const folioKey = (f: string) => `index/folios/${f}.json`;

async function readEventBundle(eventFolio: string): Promise<EventBundle | null> {
  const raw = await getText(eventKey(eventFolio));
  return raw ? (JSON.parse(raw) as EventBundle) : null;
}

export async function createEvent(name: string): Promise<EventRecord> {
  const eventFolio = newEventFolio();
  const event: EventRecord = { eventFolio, name: name.trim() || 'Evento', createdAt: new Date().toISOString() };
  await putText(eventKey(eventFolio), JSON.stringify({ event, media: [] } satisfies EventBundle));
  await putText(folioKey(eventFolio), JSON.stringify({ kind: 'event', eventFolio } satisfies FolioPointer));
  return event;
}

export async function addMedia(
  eventFolio: string,
  input: { type: MediaType; url: string; key: string; name?: string | null }
): Promise<MediaRecord> {
  const bundle = (await readEventBundle(eventFolio)) ?? {
    event: { eventFolio, name: 'Evento', createdAt: new Date().toISOString() },
    media: []
  };
  const folio = mediaFolio(eventFolio, bundle.media.length + 1);
  const record: MediaRecord = {
    folio,
    eventFolio,
    type: input.type,
    url: input.url,
    key: input.key,
    name: input.name ?? null,
    createdAt: new Date().toISOString()
  };
  bundle.media.push(record);
  await putText(eventKey(eventFolio), JSON.stringify(bundle));
  await putText(folioKey(folio), JSON.stringify({ kind: 'media', folio } satisfies FolioPointer));
  // Store the record itself for O(1) individual lookup.
  await putText(`index/media/${folio}.json`, JSON.stringify(record));
  return record;
}

export interface FolioResult {
  scope: 'event' | 'media';
  event: EventRecord | null;
  media: MediaRecord[];
}

/** Resolve any folio (event → all media; individual → single item). */
export async function resolveFolio(folio: string): Promise<FolioResult | null> {
  const ptrRaw = await getText(folioKey(folio));
  if (!ptrRaw) return null;
  const ptr = JSON.parse(ptrRaw) as FolioPointer;
  if (ptr.kind === 'event') {
    const bundle = await readEventBundle(ptr.eventFolio);
    if (!bundle) return null;
    return { scope: 'event', event: bundle.event, media: bundle.media };
  }
  const recRaw = await getText(`index/media/${folio}.json`);
  if (!recRaw) return null;
  const rec = JSON.parse(recRaw) as MediaRecord;
  return { scope: 'media', event: null, media: [rec] };
}
