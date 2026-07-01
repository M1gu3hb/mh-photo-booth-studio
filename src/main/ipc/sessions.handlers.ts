import { IPC_CHANNELS } from '@shared/constants/ipc';
import { AppError } from '@shared/errors/appError';
import type { SessionRecord, SessionPhotoRecord, OutputType } from '@shared/types/entities';
import type { SessionStartResult } from '@shared/types/session';
import type { CameraConfig } from '@shared/types/camera';
import { getContext } from '../context';
import { handle } from './handle';

function requireId(value: unknown, field = 'id'): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new AppError({
      code: 'INVALID_ARGUMENT',
      message: `${field} required`,
      userMessage: 'Falta un dato requerido.',
      action: 'Reintenta.',
      severity: 'medium',
      module: 'camera'
    });
  }
  return value;
}

export function registerSessionHandlers(): void {
  handle(IPC_CHANNELS.sessions.start, 'camera', (eventId: unknown): SessionStartResult =>
    getContext().sessions.start(requireId(eventId, 'eventId'))
  );

  handle(
    IPC_CHANNELS.sessions.savePhoto,
    'camera',
    (
      sessionId: unknown,
      photoIndex: unknown,
      bytes: unknown,
      width: unknown,
      height: unknown
    ): Promise<SessionPhotoRecord> => {
      const data = new Uint8Array(bytes as ArrayBuffer);
      const widthPx = typeof width === 'number' ? width : null;
      const heightPx = typeof height === 'number' ? height : null;
      return getContext().sessions.savePhoto(
        requireId(sessionId, 'sessionId'),
        typeof photoIndex === 'number' ? photoIndex : -1,
        data,
        widthPx,
        heightPx
      );
    }
  );

  handle(IPC_CHANNELS.sessions.complete, 'camera', (sessionId: unknown): SessionRecord =>
    getContext().sessions.complete(requireId(sessionId, 'sessionId'))
  );

  handle(
    IPC_CHANNELS.sessions.saveComposition,
    'template',
    (
      sessionId: unknown,
      png: unknown,
      jpg: unknown,
      thumb: unknown,
      width: unknown,
      height: unknown,
      outputType: unknown
    ): Promise<SessionRecord> => {
      const type: OutputType = outputType === 'postcard' ? 'postcard' : 'strip';
      return getContext().sessions.saveComposition(
        requireId(sessionId, 'sessionId'),
        new Uint8Array(png as ArrayBuffer),
        new Uint8Array(jpg as ArrayBuffer),
        new Uint8Array(thumb as ArrayBuffer),
        typeof width === 'number' ? width : 0,
        typeof height === 'number' ? height : 0,
        type
      );
    }
  );

  // ---- QR (validate + generate per event) ----
  handle(IPC_CHANNELS.qr.validate, 'qr', (url: unknown): boolean =>
    typeof url === 'string' ? getContext().qr.validate(url) : false
  );

  handle(IPC_CHANNELS.qr.ensureForEvent, 'qr', (eventId: unknown): Promise<string | null> =>
    getContext().qr.ensureForEvent(requireId(eventId, 'eventId'))
  );

  handle(IPC_CHANNELS.sessions.discard, 'camera', (sessionId: unknown): void =>
    getContext().sessions.discard(requireId(sessionId, 'sessionId'))
  );

  handle(IPC_CHANNELS.sessions.listForEvent, 'camera', (eventId: unknown): SessionRecord[] =>
    getContext().sessions.listForEvent(requireId(eventId, 'eventId'))
  );

  handle(IPC_CHANNELS.sessions.getThumbnail, 'camera', (sessionId: unknown): string =>
    getContext().sessions.getThumbnailDataUrl(requireId(sessionId, 'sessionId'))
  );

  handle(IPC_CHANNELS.sessions.getFinal, 'camera', (sessionId: unknown): string =>
    getContext().sessions.getFinalDataUrl(requireId(sessionId, 'sessionId'))
  );

  // ---- Camera configuration (persisted; enumeration happens in the renderer) ----
  handle(IPC_CHANNELS.camera.getConfig, 'camera', (): CameraConfig => getContext().settings.getCameraConfig());

  handle(IPC_CHANNELS.camera.setConfig, 'camera', (raw: unknown): CameraConfig => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const config: CameraConfig = {
      kind: r.kind === 'mock' ? 'mock' : 'webcam',
      deviceId: typeof r.deviceId === 'string' && r.deviceId ? r.deviceId : null,
      label: typeof r.label === 'string' && r.label ? r.label : null
    };
    getContext().settings.setCameraConfig(config);
    return config;
  });
}
