import { shell, dialog } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc';
import { AppError } from '@shared/errors/appError';
import type { WebConfig } from '@shared/types/web';
import type { VideoTemplateInput } from '@shared/types/videoTemplates';
import { getContext } from '../context';
import { handle } from './handle';

function requireId(value: unknown, what: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new AppError({
      code: 'INVALID_ARGUMENT',
      message: `${what} required`,
      userMessage: `Falta el identificador (${what}).`,
      action: 'Reintenta.',
      severity: 'medium',
      module: 'app'
    });
  }
  return value;
}

/** Web gallery + videos + video templates IPC (Fase 17). */
export function registerWebHandlers(): void {
  const ctx = () => getContext();

  // ---- Web config / publishing ----
  handle(IPC_CHANNELS.web.getConfig, 'app', () => ctx().web.getConfig());
  handle(IPC_CHANNELS.web.setConfig, 'app', (raw: unknown) =>
    ctx().web.setConfig((raw ?? {}) as Partial<WebConfig>)
  );
  handle(IPC_CHANNELS.web.testConnection, 'app', () => ctx().web.testConnection());
  handle(IPC_CHANNELS.web.ensureEventFolio, 'app', (eventId: unknown) =>
    ctx().web.ensureEventFolio(requireId(eventId, 'evento'))
  );
  handle(IPC_CHANNELS.web.publishSessionFinal, 'app', (sessionId: unknown, force: unknown) =>
    ctx().web.publishSessionFinal(requireId(sessionId, 'sesión'), force === true)
  );
  handle(IPC_CHANNELS.web.publishVideo, 'app', (videoId: unknown) =>
    ctx().web.publishVideo(requireId(videoId, 'video'))
  );
  handle(IPC_CHANNELS.web.listUploads, 'app', (eventId: unknown) =>
    ctx().web.listUploads(requireId(eventId, 'evento'))
  );
  handle(IPC_CHANNELS.web.retryPending, 'app', (eventId: unknown) =>
    ctx().web.retryPending(requireId(eventId, 'evento'))
  );
  handle(IPC_CHANNELS.web.openPage, 'app', (url: unknown) => {
    const value = requireId(url, 'url');
    if (!/^https?:\/\//.test(value)) {
      throw new AppError({
        code: 'INVALID_ARGUMENT',
        message: 'invalid url',
        userMessage: 'La URL no es válida.',
        action: 'Revisa la configuración de la página web.',
        severity: 'medium',
        module: 'app'
      });
    }
    void shell.openExternal(value);
    return { ok: true } as const;
  });

  // ---- Videos ----
  handle(
    IPC_CHANNELS.videos.saveRecorded,
    'camera',
    (eventId: unknown, bytes: unknown, ext: unknown, durationMs: unknown) =>
      ctx().videos.saveRecorded(
        requireId(eventId, 'evento'),
        bytes as ArrayBuffer,
        typeof ext === 'string' ? ext : 'webm',
        typeof durationMs === 'number' ? durationMs : null
      )
  );
  handle(IPC_CHANNELS.videos.importVideo, 'camera', async (eventId: unknown) => {
    const id = requireId(eventId, 'evento');
    const result = await dialog.showOpenDialog({
      title: 'Selecciona el video (MP4, WEBM o MOV)',
      properties: ['openFile'],
      filters: [{ name: 'Videos', extensions: ['mp4', 'webm', 'mov'] }]
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return ctx().videos.importFromPath(id, result.filePaths[0] ?? '');
  });
  handle(IPC_CHANNELS.videos.list, 'camera', (eventId: unknown) =>
    ctx().videos.list(requireId(eventId, 'evento'))
  );
  handle(IPC_CHANNELS.videos.delete, 'camera', (videoId: unknown) =>
    ctx().videos.delete(requireId(videoId, 'video'))
  );
  handle(IPC_CHANNELS.videos.getDataUrl, 'camera', (videoId: unknown) =>
    ctx().videos.getDataUrl(requireId(videoId, 'video'))
  );

  // ---- Video overlay templates ----
  handle(IPC_CHANNELS.videoTemplates.list, 'template', () => ctx().videoTemplates.list());
  handle(IPC_CHANNELS.videoTemplates.get, 'template', (id: unknown) =>
    ctx().videoTemplates.get(requireId(id, 'plantilla'))
  );
  handle(IPC_CHANNELS.videoTemplates.create, 'template', (raw: unknown) =>
    ctx().videoTemplates.create((raw ?? { name: '', config: { items: [] } }) as VideoTemplateInput)
  );
  handle(IPC_CHANNELS.videoTemplates.save, 'template', (id: unknown, raw: unknown) =>
    ctx().videoTemplates.save(
      requireId(id, 'plantilla'),
      (raw ?? { name: '', config: { items: [] } }) as VideoTemplateInput
    )
  );
  handle(IPC_CHANNELS.videoTemplates.delete, 'template', (id: unknown) => {
    ctx().videoTemplates.delete(requireId(id, 'plantilla'), ctx().db);
    return { ok: true } as const;
  });
}
