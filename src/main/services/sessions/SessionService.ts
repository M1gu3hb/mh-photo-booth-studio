import { mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import AdmZip from 'adm-zip';
import { AppError } from '@shared/errors/appError';
import type { SessionRecord, SessionPhotoRecord, OutputType } from '@shared/types/entities';
import type { SessionStartResult } from '@shared/types/session';
import type { Repositories } from '../database/repositories';
import type { StorageService } from '../storage/StorageService';
import type { Db } from '../database/types';

function sessionError(code: string, userMessage: string, action: string): AppError {
  return new AppError({ code, message: userMessage, userMessage, action, severity: 'high', module: 'camera' });
}

/** Owns capture sessions: photo files are saved immediately, never at the end. */
export class SessionService {
  private readonly repos: Repositories;
  private readonly storage: StorageService;
  private readonly db: Db;

  constructor(repos: Repositories, storage: StorageService, db: Db) {
    this.repos = repos;
    this.storage = storage;
    this.db = db;
  }

  private originalsDir(eventId: string, sessionId: string): string {
    return `events/event_${eventId}/originals/session_${sessionId}`;
  }

  start(eventId: string): SessionStartResult {
    const event = this.repos.events.getById(eventId);
    if (!event) {
      throw sessionError('EVENT_NOT_FOUND', 'El evento ya no existe.', 'Selecciona otro evento.');
    }
    if (!event.templateId) {
      throw sessionError(
        'SESSION_NO_TEMPLATE',
        'El evento no tiene una plantilla asignada.',
        'Asigna una plantilla al evento antes de iniciar la sesión.'
      );
    }

    const pack = this.repos.posePacks.findByEventType(event.eventType) ?? this.repos.posePacks.findDefault();
    const poses = pack ? this.repos.poses.listByPack(pack.id).map((p) => p.text) : [];

    const session = this.repos.sessions.create({
      eventId,
      templateId: event.templateId,
      photoCount: event.defaultPhotoCount,
      status: 'in_progress',
      finalOutputPath: null,
      thumbnailPath: null,
      notes: null
    });

    mkdirSync(this.storage.toAbsolute(this.originalsDir(eventId, session.id)), { recursive: true });

    return { session, poses, photoCount: event.defaultPhotoCount };
  }

  async savePhoto(
    sessionId: string,
    photoIndex: number,
    bytes: Uint8Array,
    widthPx: number | null,
    heightPx: number | null
  ): Promise<SessionPhotoRecord> {
    const session = this.repos.sessions.getById(sessionId);
    if (!session) {
      throw sessionError('SESSION_NOT_FOUND', 'La sesión ya no existe.', 'Inicia una nueva sesión.');
    }
    if (!Number.isInteger(photoIndex) || photoIndex < 0 || photoIndex >= session.photoCount) {
      throw sessionError('CAPTURE_FAILED', 'Índice de foto inválido.', 'Reintenta la foto.');
    }

    const nn = String(photoIndex + 1).padStart(2, '0');
    const relative = `${this.originalsDir(session.eventId, sessionId)}/photo_${nn}.jpg`;
    await this.storage.safeWrite(relative, Buffer.from(bytes));

    // Upsert: replace any previous photo at this index (retake).
    const existing = this.repos.sessionPhotos.list({
      where: 'session_id = ? AND photo_index = ?',
      params: [sessionId, photoIndex]
    });
    return this.db.transaction(() => {
      for (const row of existing) {
        this.repos.sessionPhotos.delete(row.id);
      }
      this.repos.sessions.update(sessionId, { status: 'in_progress' });
      return this.repos.sessionPhotos.create({
        sessionId,
        photoIndex,
        originalPath: relative,
        processedPath: null,
        widthPx,
        heightPx
      });
    });
  }

  complete(sessionId: string): SessionRecord {
    const session = this.repos.sessions.getById(sessionId);
    if (!session) {
      throw sessionError('SESSION_NOT_FOUND', 'La sesión ya no existe.', 'Inicia una nueva sesión.');
    }
    const photos = this.repos.sessionPhotos.list({ where: 'session_id = ?', params: [sessionId] });
    if (photos.length < session.photoCount) {
      throw sessionError(
        'SESSION_INCOMPLETE',
        'Faltan fotos por capturar.',
        'Captura todas las fotos antes de finalizar.'
      );
    }
    return this.repos.sessions.update(sessionId, { status: 'completed' });
  }

  private outputsDir(eventId: string, sessionId: string): string {
    return `events/event_${eventId}/outputs/session_${sessionId}`;
  }

  /**
   * Persists a composed result (rendered in the renderer canvas) BEFORE any
   * printing: final PNG + JPG + thumbnail, session_outputs rows, and the
   * session's final/thumbnail paths. Returns the updated session.
   */
  async saveComposition(
    sessionId: string,
    pngBytes: Uint8Array,
    jpgBytes: Uint8Array,
    thumbBytes: Uint8Array,
    widthPx: number,
    heightPx: number,
    outputType: OutputType
  ): Promise<SessionRecord> {
    const session = this.repos.sessions.getById(sessionId);
    if (!session) {
      throw new AppError({
        code: 'SESSION_NOT_FOUND',
        message: 'Session missing for composition',
        userMessage: 'La sesión ya no existe.',
        action: 'Inicia una nueva sesión.',
        severity: 'high',
        module: 'template'
      });
    }
    const dir = this.outputsDir(session.eventId, sessionId);
    const pngRel = `${dir}/final.png`;
    const jpgRel = `${dir}/final.jpg`;
    const thumbRel = `${dir}/thumbnail.jpg`;

    await this.storage.safeWrite(pngRel, Buffer.from(pngBytes));
    await this.storage.safeWrite(jpgRel, Buffer.from(jpgBytes));
    await this.storage.safeWrite(thumbRel, Buffer.from(thumbBytes));

    return this.db.transaction(() => {
      // Replace any prior outputs for this session (re-composition / retake).
      const previous = this.repos.sessionOutputs.list({ where: 'session_id = ?', params: [sessionId] });
      for (const row of previous) {
        this.repos.sessionOutputs.delete(row.id);
      }
      this.repos.sessionOutputs.create({ sessionId, outputType, filePath: pngRel, widthPx, heightPx, format: 'png' });
      this.repos.sessionOutputs.create({ sessionId, outputType, filePath: jpgRel, widthPx, heightPx, format: 'jpg' });
      this.repos.sessionOutputs.create({ sessionId, outputType: 'thumbnail', filePath: thumbRel, widthPx: null, heightPx: null, format: 'jpg' });
      return this.repos.sessions.update(sessionId, {
        status: 'completed',
        finalOutputPath: pngRel,
        thumbnailPath: thumbRel
      });
    });
  }

  /** Throws away an in-progress session (Repetir sesión) — files and rows. */
  discard(sessionId: string): void {
    const session = this.repos.sessions.getById(sessionId);
    if (!session) return;
    rmSync(this.storage.toAbsolute(this.originalsDir(session.eventId, sessionId)), {
      recursive: true,
      force: true
    });
    this.repos.sessions.delete(sessionId); // session_photos cascade on delete
  }

  listPhotos(sessionId: string): SessionPhotoRecord[] {
    return this.repos.sessionPhotos.list({
      where: 'session_id = ?',
      params: [sessionId],
      orderBy: 'photo_index ASC'
    });
  }

  /** Completed sessions (with a final output) for an event, newest first. */
  listForEvent(eventId: string): SessionRecord[] {
    return this.repos.sessions.list({
      where: "event_id = ? AND status = 'completed' AND final_output_path IS NOT NULL",
      params: [eventId],
      orderBy: 'created_at DESC'
    });
  }

  private readDataUrl(relativePath: string | null, mime: string): string {
    if (!relativePath) {
      throw new AppError({
        code: 'FILE_WRITE_FAILED',
        message: 'No output path',
        userMessage: 'Esta sesión no tiene imagen final.',
        action: 'Vuelve a componer la sesión.',
        severity: 'medium',
        module: 'storage'
      });
    }
    const abs = this.storage.toAbsolute(relativePath);
    if (!existsSync(abs)) {
      throw new AppError({
        code: 'FILE_WRITE_FAILED',
        message: `Missing file ${relativePath}`,
        userMessage: 'No se encontró el archivo de la sesión.',
        action: 'Vuelve a componer la sesión.',
        severity: 'medium',
        module: 'storage'
      });
    }
    return `data:${mime};base64,${readFileSync(abs).toString('base64')}`;
  }

  getThumbnailDataUrl(sessionId: string): string {
    const session = this.repos.sessions.getById(sessionId);
    return this.readDataUrl(session?.thumbnailPath ?? null, 'image/jpeg');
  }

  getFinalDataUrl(sessionId: string): string {
    const session = this.repos.sessions.getById(sessionId);
    return this.readDataUrl(session?.finalOutputPath ?? null, 'image/png');
  }

  archive(sessionId: string): SessionRecord {
    return this.repos.sessions.update(sessionId, { status: 'archived' });
  }

  /** Absolute path to the final image (for shell.openPath), or null. */
  finalAbsPath(sessionId: string): string | null {
    const s = this.repos.sessions.getById(sessionId);
    return s?.finalOutputPath ? this.storage.toAbsolute(s.finalOutputPath) : null;
  }

  /** Absolute path to the originals folder (for shell.openPath), or null. */
  originalsAbsDir(sessionId: string): string | null {
    const s = this.repos.sessions.getById(sessionId);
    return s ? this.storage.toAbsolute(this.originalsDir(s.eventId, sessionId)) : null;
  }

  /** Bundles a session (originals + outputs + metadata json) into a portable zip. */
  exportSession(sessionId: string, destPath: string): string {
    const session = this.repos.sessions.getById(sessionId);
    if (!session) {
      throw new AppError({
        code: 'SESSION_NOT_FOUND',
        message: 'session missing',
        userMessage: 'La sesión ya no existe.',
        action: 'Actualiza el historial.',
        severity: 'medium',
        module: 'storage'
      });
    }
    const zip = new AdmZip();
    const originals = this.storage.toAbsolute(this.originalsDir(session.eventId, sessionId));
    const outputs = this.storage.toAbsolute(this.outputsDir(session.eventId, sessionId));
    if (existsSync(originals)) zip.addLocalFolder(originals, 'originals');
    if (existsSync(outputs)) zip.addLocalFolder(outputs, 'outputs');
    const meta = { session, photos: this.listPhotos(sessionId) };
    zip.addFile('session.json', Buffer.from(JSON.stringify(meta, null, 2)));
    zip.writeZip(destPath);
    return destPath;
  }
}
