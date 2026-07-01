import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { EVENT_TYPES } from '@shared/constants/eventTypes';
import { PHOTO_COUNT_OPTIONS, MAX_DEFAULT_COPIES } from '@shared/constants/event';
import type { EventInput } from '@shared/types/events';
import type { EventRecord } from '@shared/types/entities';
import { AppError } from '@shared/errors/appError';
import type { Repositories } from '../database/repositories';
import type { StorageService } from '../storage/StorageService';

const ACTIVE_EVENT_KEY = 'active_event_id';
const EVENT_SUBFOLDERS = ['originals', 'outputs', 'print_sheets', 'qr', 'exports'] as const;

function invalid(message: string): AppError {
  return new AppError({
    code: 'INVALID_EVENT',
    message,
    userMessage: message,
    action: 'Corrige el dato e intenta de nuevo.',
    severity: 'medium',
    module: 'event'
  });
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateInput(input: EventInput): void {
  if (!input.name || input.name.trim().length === 0) {
    throw invalid('El nombre del evento es obligatorio.');
  }
  if (!EVENT_TYPES.some((t) => t.key === input.eventType)) {
    throw invalid('Selecciona un tipo de evento válido.');
  }
  if (!(PHOTO_COUNT_OPTIONS as readonly number[]).includes(input.defaultPhotoCount)) {
    throw invalid('El número de fotos debe ser 2, 3 o 4.');
  }
  if (!Number.isInteger(input.defaultCopies) || input.defaultCopies < 1 || input.defaultCopies > MAX_DEFAULT_COPIES) {
    throw invalid(`Las copias por defecto deben estar entre 1 y ${MAX_DEFAULT_COPIES}.`);
  }
  if (!input.enablePhotos && !input.enableVideos) {
    throw invalid('Activa al menos un modo: sesión de fotos o videos.');
  }
  if (input.qrEnabled) {
    if (!input.qrLink || input.qrLink.trim().length === 0) {
      throw invalid('Si activas el QR, ingresa el link de destino.');
    }
    if (!isValidHttpUrl(input.qrLink.trim())) {
      throw invalid('El link del QR no es válido (usa http:// o https://).');
    }
  }
}

/** Creates/edits/archives events, owns the active event and per-event folders. */
export class EventService {
  private readonly repos: Repositories;
  private readonly storage: StorageService;

  constructor(repos: Repositories, storage: StorageService) {
    this.repos = repos;
    this.storage = storage;
  }

  /** Relative (to data root) directory for an event. */
  eventDir(eventId: string): string {
    return `events/event_${eventId}`;
  }

  private ensureEventFolders(eventId: string): void {
    const base = this.storage.toAbsolute(this.eventDir(eventId));
    mkdirSync(base, { recursive: true });
    for (const sub of EVENT_SUBFOLDERS) {
      mkdirSync(join(base, sub), { recursive: true });
    }
  }

  private async writeEventJson(event: EventRecord): Promise<void> {
    const relative = `${this.eventDir(event.id)}/event.json`;
    await this.storage.safeWrite(relative, JSON.stringify(event, null, 2));
  }

  async create(input: EventInput): Promise<EventRecord> {
    validateInput(input);
    const event = this.repos.events.create({
      name: input.name.trim(),
      eventType: input.eventType,
      eventDate: input.eventDate,
      clientReference: input.clientReference?.trim() || null,
      templateId: input.templateId,
      defaultPhotoCount: input.defaultPhotoCount,
      defaultCopies: input.defaultCopies,
      qrEnabled: input.qrEnabled ? 1 : 0,
      qrLink: input.qrEnabled ? (input.qrLink?.trim() ?? null) : null,
      status: 'active',
      enablePhotos: input.enablePhotos ? 1 : 0,
      enableVideos: input.enableVideos ? 1 : 0,
      webUploadEnabled: input.webUploadEnabled ? 1 : 0,
      webEventFolio: null,
      videoTemplateId: input.videoTemplateId
    });
    this.ensureEventFolders(event.id);
    await this.writeEventJson(event);
    this.setActive(event.id);
    return event;
  }

  async update(id: string, input: EventInput): Promise<EventRecord> {
    validateInput(input);
    const existing = this.repos.events.getById(id);
    if (!existing) {
      throw invalid('El evento ya no existe.');
    }
    const event = this.repos.events.update(id, {
      name: input.name.trim(),
      eventType: input.eventType,
      eventDate: input.eventDate,
      clientReference: input.clientReference?.trim() || null,
      templateId: input.templateId,
      defaultPhotoCount: input.defaultPhotoCount,
      defaultCopies: input.defaultCopies,
      qrEnabled: input.qrEnabled ? 1 : 0,
      qrLink: input.qrEnabled ? (input.qrLink?.trim() ?? null) : null,
      enablePhotos: input.enablePhotos ? 1 : 0,
      enableVideos: input.enableVideos ? 1 : 0,
      webUploadEnabled: input.webUploadEnabled ? 1 : 0,
      videoTemplateId: input.videoTemplateId
    });
    this.ensureEventFolders(event.id);
    await this.writeEventJson(event);
    return event;
  }

  archive(id: string): EventRecord {
    const event = this.repos.events.update(id, { status: 'archived' });
    if (this.repos.settings.get(ACTIVE_EVENT_KEY) === id) {
      this.repos.settings.set(ACTIVE_EVENT_KEY, '');
    }
    return event;
  }

  /** Active events, most recently updated first. */
  list(): EventRecord[] {
    return this.repos.events.list({ where: "status = 'active'", orderBy: 'updated_at DESC' });
  }

  getActive(): EventRecord | null {
    const id = this.repos.settings.get(ACTIVE_EVENT_KEY);
    if (!id) return null;
    const event = this.repos.events.getById(id);
    if (!event || event.status !== 'active') return null;
    return event;
  }

  setActive(id: string): EventRecord {
    const event = this.repos.events.getById(id);
    if (!event) {
      throw invalid('El evento ya no existe.');
    }
    if (event.status !== 'active') {
      throw invalid('No se puede activar un evento archivado.');
    }
    this.repos.settings.set(ACTIVE_EVENT_KEY, id);
    return event;
  }

  /** Pre-event "ready" flag set from Diagnostics, reflected on the Dashboard. */
  markReady(id: string): void {
    this.repos.settings.set(`event_ready:${id}`, '1');
  }

  isReady(id: string): boolean {
    return this.repos.settings.get(`event_ready:${id}`) === '1';
  }
}
