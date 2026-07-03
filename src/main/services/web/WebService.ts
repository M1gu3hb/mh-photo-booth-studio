import { readFileSync, existsSync, statSync } from 'node:fs';
import { basename } from 'node:path';
import QRCode from 'qrcode';
import { AppError } from '@shared/errors/appError';
import { SETTING_KEYS } from '@shared/constants/settings';
import type {
  WebConfig,
  WebConnectionStatus,
  WebPublishResult,
  EventFolioResult
} from '@shared/types/web';
import type { WebUploadRecord } from '@shared/types/entities';
import type { Repositories } from '../database/repositories';
import type { StorageService } from '../storage/StorageService';
import { logError } from '../logging/logger';

const FETCH_TIMEOUT_MS = 60_000;
/** Files above this bypass the API and upload DIRECT to Blob (Vercel caps requests at ~4.5 MB). */
const SIMPLE_UPLOAD_LIMIT = 3_500_000;

interface UploadApiResponse {
  ok: boolean;
  folio?: string;
  page?: string;
  url?: string;
  error?: string;
}

interface EventApiResponse {
  ok: boolean;
  eventFolio?: string;
  page?: string;
  error?: string;
}

function webError(userMessage: string, action: string, message = userMessage): AppError {
  return new AppError({
    code: 'WEB_UPLOAD_FAILED',
    message,
    userMessage,
    action,
    severity: 'medium',
    module: 'app'
  });
}

/**
 * Bridge to the mh-photo-booth-web gallery (Fase 17). Creates the event's
 * master folio, publishes photo finals / videos (folio + page + QR per media),
 * and keeps an offline-tolerant queue in `web_uploads` (pending → done/failed,
 * retryable). Config (site URL + API key) lives in settings — never in code.
 */
export class WebService {
  private readonly repos: Repositories;
  private readonly storage: StorageService;

  constructor(repos: Repositories, storage: StorageService) {
    this.repos = repos;
    this.storage = storage;
  }

  getConfig(): WebConfig {
    return {
      siteUrl: (this.repos.settings.get(SETTING_KEYS.webSiteUrl) ?? '').trim(),
      apiKey: (this.repos.settings.get(SETTING_KEYS.webApiKey) ?? '').trim()
    };
  }

  setConfig(config: Partial<WebConfig>): WebConfig {
    if (config.siteUrl !== undefined) {
      const url = config.siteUrl.trim().replace(/\/+$/, '');
      if (url && !/^https?:\/\//.test(url)) {
        throw webError('La URL de la página no es válida.', 'Usa una URL con https://');
      }
      this.repos.settings.set(SETTING_KEYS.webSiteUrl, url);
    }
    if (config.apiKey !== undefined) {
      this.repos.settings.set(SETTING_KEYS.webApiKey, config.apiKey.trim());
    }
    return this.getConfig();
  }

  isConfigured(): boolean {
    return this.getConfig().siteUrl.length > 0;
  }

  private async fetchJson<T>(path: string, init: RequestInit): Promise<T> {
    const { siteUrl, apiKey } = this.getConfig();
    if (!siteUrl) {
      throw webError(
        'La página web no está configurada.',
        'Configura la URL y la clave en la sección "Página web".'
      );
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(`${siteUrl}${path}`, {
        ...init,
        headers: { ...(init.headers ?? {}), 'x-api-key': apiKey },
        signal: controller.signal
      });
      const body = (await res.json().catch(() => null)) as T | null;
      if (!res.ok || !body) {
        throw webError(
          res.status === 401
            ? 'La clave de la página web no coincide.'
            : 'La página web rechazó la solicitud.',
          res.status === 401 ? 'Revisa la clave API en "Página web".' : 'Reintenta más tarde.',
          `web api ${path} -> ${res.status}`
        );
      }
      return body;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw webError(
        'No se pudo conectar con la página web.',
        'Revisa tu internet; la subida quedará pendiente y puedes reintentarla.',
        `web fetch failed: ${String(err)}`
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async testConnection(): Promise<WebConnectionStatus> {
    const { siteUrl } = this.getConfig();
    if (!siteUrl) {
      return { configured: false, reachable: false, siteUrl: '', message: 'Sin configurar.' };
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(siteUrl, { method: 'GET', signal: controller.signal });
      clearTimeout(timer);
      return {
        configured: true,
        reachable: res.ok,
        siteUrl,
        message: res.ok ? 'Conectada.' : `La página respondió ${res.status}.`
      };
    } catch {
      return { configured: true, reachable: false, siteUrl, message: 'Sin conexión con la página.' };
    }
  }

  async qrDataUrl(url: string): Promise<string> {
    return QRCode.toDataURL(url, { width: 480, margin: 1, errorCorrectionLevel: 'M' });
  }

  /** Creates (once) the event's master web folio; stores it on the event. */
  async ensureEventFolio(eventId: string): Promise<EventFolioResult> {
    const event = this.repos.events.getById(eventId);
    if (!event) throw webError('El evento ya no existe.', 'Actualiza la lista.');
    const { siteUrl } = this.getConfig();

    if (event.webEventFolio) {
      const pageUrl = `${siteUrl}/f/${event.webEventFolio}`;
      return { eventFolio: event.webEventFolio, pageUrl, qrDataUrl: await this.qrDataUrl(pageUrl) };
    }

    const body = await this.fetchJson<EventApiResponse>('/api/event', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: event.name })
    });
    if (!body.ok || !body.eventFolio) {
      throw webError('La página no pudo crear el evento.', 'Reintenta más tarde.');
    }
    this.repos.events.update(eventId, { webEventFolio: body.eventFolio });
    const pageUrl = body.page ?? `${siteUrl}/f/${body.eventFolio}`;
    return { eventFolio: body.eventFolio, pageUrl, qrDataUrl: await this.qrDataUrl(pageUrl) };
  }

  /** Publishes a session's final image; returns folio + page + QR. */
  async publishSessionFinal(sessionId: string, force = false): Promise<WebPublishResult> {
    const session = this.repos.sessions.getById(sessionId);
    if (!session?.finalOutputPath) {
      throw webError('La sesión no tiene imagen final.', 'Completa la sesión primero.');
    }
    return this.publish(
      {
        eventId: session.eventId,
        sessionId,
        videoId: null,
        mediaType: 'photo',
        absPath: this.storage.toAbsolute(session.finalOutputPath),
        contentType: 'image/png'
      },
      force
    );
  }

  /** Publishes a recorded/imported video; returns folio + page + QR. */
  async publishVideo(videoId: string): Promise<WebPublishResult> {
    const video = this.repos.videos.getById(videoId);
    if (!video) throw webError('El video ya no existe.', 'Actualiza la lista.');
    const abs = this.storage.toAbsolute(video.filePath);
    const ext = abs.split('.').pop()?.toLowerCase() ?? 'webm';
    const contentType = ext === 'mp4' ? 'video/mp4' : ext === 'mov' ? 'video/quicktime' : 'video/webm';
    this.assertUploadable(abs);
    return this.publish(
      {
        eventId: video.eventId,
        sessionId: null,
        videoId,
        mediaType: 'video',
        absPath: abs,
        contentType
      },
      false
    );
  }

  private async publish(input: {
    eventId: string;
    sessionId: string | null;
    videoId: string | null;
    mediaType: 'photo' | 'video';
    absPath: string;
    contentType: string;
  }, force = false): Promise<WebPublishResult> {
    if (!existsSync(input.absPath)) {
      throw webError('No se encontró el archivo a subir.', 'Verifica la carpeta de datos.');
    }
    // Reuse a previous successful upload (idempotent: one folio per media).
    const prior = force
      ? undefined
      : this.repos.webUploads.list({
      where:
        input.mediaType === 'photo'
          ? "session_id = ? AND status = 'done'"
          : "video_id = ? AND status = 'done'",
          params: [input.mediaType === 'photo' ? input.sessionId : input.videoId],
          limit: 1
        })[0];
    if (prior?.folio && prior.pageUrl && prior.mediaUrl) {
      return {
        uploadId: prior.id,
        folio: prior.folio,
        pageUrl: prior.pageUrl,
        mediaUrl: prior.mediaUrl,
        qrDataUrl: await this.qrDataUrl(prior.pageUrl)
      };
    }

    const { eventFolio } = await this.ensureEventFolio(input.eventId);
    const upload = this.repos.webUploads.create({
      eventId: input.eventId,
      sessionId: input.sessionId,
      videoId: input.videoId,
      mediaType: input.mediaType,
      folio: null,
      pageUrl: null,
      mediaUrl: null,
      status: 'pending',
      errorMessage: null
    });

    try {
      const bytes = readFileSync(input.absPath);
      // Vercel caps each request body at ~4.5 MB, so large files (videos, big
      // finals) upload directly to Blob with a client token instead.
      const clientRef = input.sessionId ?? input.videoId ?? '';
      const body =
        bytes.length > SIMPLE_UPLOAD_LIMIT
          ? await this.uploadDirect(eventFolio, input, bytes, clientRef)
          : await this.uploadSimple(eventFolio, input, bytes, clientRef);
      if (!body.ok || !body.folio || !body.page || !body.url) {
        throw webError('La página rechazó la subida.', 'Reintenta desde "Página web".');
      }
      this.repos.webUploads.update(upload.id, {
        folio: body.folio,
        pageUrl: body.page,
        mediaUrl: body.url,
        status: 'done',
        errorMessage: null
      });
      return {
        uploadId: upload.id,
        folio: body.folio,
        pageUrl: body.page,
        mediaUrl: body.url,
        qrDataUrl: await this.qrDataUrl(body.page)
      };
    } catch (err) {
      const appErr =
        err instanceof AppError ? err : webError('Falló la subida.', 'Reintenta más tarde.');
      this.repos.webUploads.update(upload.id, { status: 'failed', errorMessage: appErr.userMessage });
      logError(appErr);
      throw appErr;
    }
  }

  private async uploadSimple(
    eventFolio: string,
    input: { mediaType: 'photo' | 'video'; absPath: string; contentType: string },
    bytes: Buffer,
    clientRef: string
  ): Promise<UploadApiResponse> {
    const form = new FormData();
    form.append('eventFolio', eventFolio);
    form.append('type', input.mediaType);
    form.append('name', basename(input.absPath));
    form.append('clientRef', clientRef);
    form.append(
      'file',
      new Blob([new Uint8Array(bytes)], { type: input.contentType }),
      basename(input.absPath)
    );
    return this.fetchJson<UploadApiResponse>('/api/upload', { method: 'POST', body: form });
  }

  /**
   * Direct-to-Blob upload for large media (videos, big finals). The web issues
   * a short-lived client token (/api/blob-token, key validated) and the file
   * goes straight to Vercel Blob — no 4.5 MB serverless limit. The media is
   * then registered (/api/register-media) to obtain its folio.
   */
  private async uploadDirect(
    eventFolio: string,
    input: { mediaType: 'photo' | 'video'; absPath: string; contentType: string },
    bytes: Buffer,
    clientRef: string
  ): Promise<UploadApiResponse> {
    const { siteUrl, apiKey } = this.getConfig();
    const name = basename(input.absPath);
    const ext = name.split('.').pop()?.toLowerCase() ?? (input.mediaType === 'video' ? 'webm' : 'png');
    const rand = Math.random().toString(36).slice(2, 8);
    const pathname = `media/${eventFolio}/${Date.now()}-${rand}.${ext}`;

    let blobUrl: string;
    let blobPathname: string;
    try {
      const { upload } = await import('@vercel/blob/client');
      const result = await upload(pathname, new Blob([new Uint8Array(bytes)], { type: input.contentType }), {
        access: 'public',
        handleUploadUrl: `${siteUrl}/api/blob-token`,
        clientPayload: JSON.stringify({ apiKey }),
        multipart: bytes.length > 8_000_000,
        contentType: input.contentType
      });
      blobUrl = result.url;
      blobPathname = result.pathname;
    } catch (err) {
      throw webError(
        'No se pudo subir el archivo grande.',
        'Revisa tu internet y reintenta desde "Página web".',
        `direct upload failed: ${String(err)}`
      );
    }

    return this.fetchJson<UploadApiResponse>('/api/register-media', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        eventFolio,
        type: input.mediaType,
        name,
        url: blobUrl,
        key: blobPathname,
        clientRef
      })
    });
  }

  listUploads(eventId: string): WebUploadRecord[] {
    return this.repos.webUploads.list({
      where: 'event_id = ?',
      params: [eventId],
      orderBy: 'created_at DESC'
    });
  }

  /** Retries every failed upload of an event; returns how many succeeded. */
  async retryPending(eventId: string): Promise<{ retried: number; succeeded: number }> {
    const failed = this.repos.webUploads.list({
      where: "event_id = ? AND status IN ('failed','pending')",
      params: [eventId]
    });
    let succeeded = 0;
    for (const item of failed) {
      try {
        if (item.mediaType === 'photo' && item.sessionId) {
          // Drop the stale row; publish creates a fresh one (idempotent by session).
          this.repos.webUploads.delete(item.id);
          await this.publishSessionFinal(item.sessionId);
          succeeded += 1;
        } else if (item.mediaType === 'video' && item.videoId) {
          this.repos.webUploads.delete(item.id);
          await this.publishVideo(item.videoId);
          succeeded += 1;
        }
      } catch {
        // Row already re-created as failed by publish(); keep going.
      }
    }
    return { retried: failed.length, succeeded };
  }

  /** File size guard so huge videos do not hang the booth (Vercel limit ~50MB). */
  assertUploadable(absPath: string): void {
    const size = statSync(absPath).size;
    const MAX = 500 * 1024 * 1024;
    if (size > MAX) {
      throw webError(
        'El video es demasiado grande para subirlo (máx ~500 MB).',
        'Graba clips más cortos o reduce la calidad.'
      );
    }
  }
}
