import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import AdmZip from 'adm-zip';
import { AppError } from '@shared/errors/appError';
import type { EventRecord, SessionRecord, SessionPhotoRecord, SessionOutputRecord } from '@shared/types/entities';
import { LATEST_SCHEMA_VERSION } from '../database/migrate';
import type { Repositories } from '../database/repositories';
import type { StorageService } from '../storage/StorageService';

interface EventManifest {
  schemaVersion: number;
  exportedAt: string;
  event: EventRecord;
  sessions: SessionRecord[];
  photos: SessionPhotoRecord[];
  outputs: SessionOutputRecord[];
}

function backupError(message: string, action: string, code = 'BACKUP_FAILED'): AppError {
  return new AppError({ code, message, userMessage: message, action, severity: 'medium', module: 'storage' });
}

/** Portable export/import of a whole event (folder files + DB manifest, with id remap). */
export class BackupService {
  private readonly repos: Repositories;
  private readonly storage: StorageService;

  constructor(repos: Repositories, storage: StorageService) {
    this.repos = repos;
    this.storage = storage;
  }

  exportEvent(eventId: string, destPath: string): string {
    const event = this.repos.events.getById(eventId);
    if (!event) {
      throw backupError('El evento ya no existe.', 'Actualiza la lista de eventos.');
    }
    const sessions = this.repos.sessions.list({ where: 'event_id = ?', params: [eventId] });
    const photos: SessionPhotoRecord[] = [];
    const outputs: SessionOutputRecord[] = [];
    for (const s of sessions) {
      photos.push(...this.repos.sessionPhotos.list({ where: 'session_id = ?', params: [s.id] }));
      outputs.push(...this.repos.sessionOutputs.list({ where: 'session_id = ?', params: [s.id] }));
    }

    const manifest: EventManifest = {
      schemaVersion: LATEST_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      event,
      sessions,
      photos,
      outputs
    };

    const zip = new AdmZip();
    zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2)));
    const eventDir = this.storage.toAbsolute(`events/event_${eventId}`);
    if (existsSync(eventDir)) {
      zip.addLocalFolder(eventDir, 'event');
    }
    zip.writeZip(destPath);
    return destPath;
  }

  importEvent(zipPath: string): EventRecord {
    if (!existsSync(zipPath)) {
      throw backupError('No se encontró el archivo.', 'Selecciona un .zip exportado por la app.');
    }
    const zip = new AdmZip(zipPath);
    const manifestEntry = zip.getEntries().find((e) => e.entryName.endsWith('manifest.json'));
    if (!manifestEntry) {
      throw backupError('El archivo no es un evento exportado.', 'Usa un .zip exportado por la app.', 'BACKUP_INVALID');
    }
    const manifest = JSON.parse(manifestEntry.getData().toString('utf-8')) as EventManifest;

    const newEventId = randomUUID();
    const sessionMap = new Map<string, string>();
    for (const s of manifest.sessions) {
      sessionMap.set(s.id, randomUUID());
    }

    const remap = (path: string | null): string | null => {
      if (!path) return path;
      let next = path.replace(`event_${manifest.event.id}`, `event_${newEventId}`);
      for (const [oldSid, newSid] of sessionMap) {
        next = next.replace(`session_${oldSid}`, `session_${newSid}`);
      }
      return next;
    };

    // Extract files into the new event folder with remapped session subfolders.
    const newEventDir = this.storage.toAbsolute(`events/event_${newEventId}`);
    for (const entry of zip.getEntries()) {
      if (entry.isDirectory || !entry.entryName.startsWith('event/')) continue;
      let rel = entry.entryName.slice('event/'.length);
      for (const [oldSid, newSid] of sessionMap) {
        rel = rel.replace(`session_${oldSid}`, `session_${newSid}`);
      }
      const target = join(newEventDir, rel);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, entry.getData());
    }

    // Recreate DB rows with new ids + remapped paths.
    const created = this.repos.events.create({
      id: newEventId,
      name: `${manifest.event.name} (importado)`.slice(0, 90),
      eventType: manifest.event.eventType,
      eventDate: manifest.event.eventDate,
      clientReference: manifest.event.clientReference,
      templateId: manifest.event.templateId && this.repos.templates.getById(manifest.event.templateId)
        ? manifest.event.templateId
        : null,
      defaultPhotoCount: manifest.event.defaultPhotoCount,
      defaultCopies: manifest.event.defaultCopies,
      qrEnabled: manifest.event.qrEnabled,
      qrLink: manifest.event.qrLink,
      status: 'active'
    });

    for (const s of manifest.sessions) {
      const newSid = sessionMap.get(s.id)!;
      this.repos.sessions.create({
        id: newSid,
        eventId: newEventId,
        templateId: s.templateId,
        photoCount: s.photoCount,
        status: s.status,
        finalOutputPath: remap(s.finalOutputPath),
        thumbnailPath: remap(s.thumbnailPath),
        notes: s.notes
      });
    }
    for (const p of manifest.photos) {
      const newSid = sessionMap.get(p.sessionId);
      if (!newSid) continue;
      this.repos.sessionPhotos.create({
        sessionId: newSid,
        photoIndex: p.photoIndex,
        originalPath: remap(p.originalPath) ?? p.originalPath,
        processedPath: remap(p.processedPath),
        widthPx: p.widthPx,
        heightPx: p.heightPx
      });
    }
    for (const o of manifest.outputs) {
      const newSid = sessionMap.get(o.sessionId);
      if (!newSid) continue;
      this.repos.sessionOutputs.create({
        sessionId: newSid,
        outputType: o.outputType,
        filePath: remap(o.filePath) ?? o.filePath,
        widthPx: o.widthPx,
        heightPx: o.heightPx,
        format: o.format
      });
    }

    return created;
  }
}
