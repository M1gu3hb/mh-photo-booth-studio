import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname } from 'node:path';
import { AppError } from '@shared/errors/appError';
import type { VideoRecord } from '@shared/types/entities';
import type { Repositories } from '../database/repositories';
import type { StorageService } from '../storage/StorageService';

const IMPORT_EXTENSIONS = ['.mp4', '.webm', '.mov'] as const;

function videoError(userMessage: string, action: string, message = userMessage): AppError {
  return new AppError({
    code: 'VIDEO_ERROR',
    message,
    userMessage,
    action,
    severity: 'medium',
    module: 'camera'
  });
}

/**
 * Videos per event (Fase 17): clips recorded in the booth (360 camera via the
 * renderer's MediaRecorder) and imported files. Files live under
 * events/event_<id>/videos/ (relative to the data root, like everything else).
 */
export class VideoService {
  private readonly repos: Repositories;
  private readonly storage: StorageService;

  constructor(repos: Repositories, storage: StorageService) {
    this.repos = repos;
    this.storage = storage;
  }

  private videoDir(eventId: string): string {
    return `events/event_${eventId}/videos`;
  }

  /** Persists a clip recorded in the renderer (bytes from MediaRecorder). */
  async saveRecorded(
    eventId: string,
    bytes: ArrayBuffer,
    extension: string,
    durationMs: number | null
  ): Promise<VideoRecord> {
    const event = this.repos.events.getById(eventId);
    if (!event) throw videoError('El evento ya no existe.', 'Actualiza la lista.');
    if (bytes.byteLength === 0) {
      throw videoError('La grabación quedó vacía.', 'Reintenta la grabación.');
    }
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    const id = randomUUID();
    const rel = `${this.videoDir(eventId)}/video_${id}${ext}`;
    await this.storage.safeWrite(rel, Buffer.from(bytes));
    return this.repos.videos.create({
      id,
      eventId,
      filePath: rel,
      source: 'recorded',
      durationMs,
      sizeBytes: bytes.byteLength
    });
  }

  /** Copies an existing video file (picked via dialog) into the event folder. */
  async importFromPath(eventId: string, sourcePath: string): Promise<VideoRecord> {
    const event = this.repos.events.getById(eventId);
    if (!event) throw videoError('El evento ya no existe.', 'Actualiza la lista.');
    if (!existsSync(sourcePath)) {
      throw videoError('No se encontró el archivo de video.', 'Selecciona otro archivo.');
    }
    const ext = extname(sourcePath).toLowerCase();
    if (!(IMPORT_EXTENSIONS as readonly string[]).includes(ext)) {
      throw videoError('Formato no soportado.', 'Usa MP4, WEBM o MOV.');
    }
    const id = randomUUID();
    const rel = `${this.videoDir(eventId)}/video_${id}${ext}`;
    const bytes = readFileSync(sourcePath);
    await this.storage.safeWrite(rel, bytes);
    return this.repos.videos.create({
      id,
      eventId,
      filePath: rel,
      source: 'imported',
      durationMs: null,
      sizeBytes: statSync(sourcePath).size
    });
  }

  list(eventId: string): VideoRecord[] {
    return this.repos.videos.list({
      where: 'event_id = ?',
      params: [eventId],
      orderBy: 'created_at DESC'
    });
  }

  /** Video bytes as a data URL for in-app playback (webm/mp4 only, small clips). */
  getDataUrl(videoId: string): string {
    const video = this.repos.videos.getById(videoId);
    if (!video) throw videoError('El video ya no existe.', 'Actualiza la lista.');
    const abs = this.storage.toAbsolute(video.filePath);
    if (!existsSync(abs)) {
      throw videoError('No se encontró el archivo del video.', 'Verifica la carpeta de datos.');
    }
    const ext = extname(abs).toLowerCase();
    const mime = ext === '.mp4' ? 'video/mp4' : ext === '.mov' ? 'video/quicktime' : 'video/webm';
    return `data:${mime};base64,${readFileSync(abs).toString('base64')}`;
  }

  async delete(videoId: string): Promise<void> {
    const video = this.repos.videos.getById(videoId);
    if (!video) return;
    this.repos.videos.delete(videoId);
    // Best-effort file removal (record is the source of truth).
    await this.storage.removeDir(video.filePath).catch(() => undefined);
  }
}
