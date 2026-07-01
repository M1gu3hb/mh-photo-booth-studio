import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc';
import type { PhotoBoothApi } from '@shared/types/api';
import type { UpdatableSettings } from '@shared/types/settings';
import type { EventInput } from '@shared/types/events';
import type { TemplateSavePayload } from '@shared/types/templates';
import type { PrintTemplateCreateInput, PrintTemplateSavePayload } from '@shared/types/printTemplates';
import type { LiveSessionState, LiveCommand } from '@shared/types/live';
import type { WebConfig } from '@shared/types/web';
import type { VideoTemplateInput } from '@shared/types/videoTemplates';
import type { CameraConfig } from '@shared/types/camera';
import type { PrintRequest } from '@shared/types/print';
import type { BrandingConfig } from '@shared/constants/branding';

/**
 * The only object exposed to the renderer. Node and ipcRenderer are never
 * leaked directly — the renderer can only call these explicit, typed methods.
 */
const api: PhotoBoothApi = {
  app: {
    getInfo: () => ipcRenderer.invoke(IPC_CHANNELS.app.getInfo),
    setFullscreen: (enabled: boolean) => ipcRenderer.invoke(IPC_CHANNELS.app.setFullscreen, enabled)
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.settings.get),
    update: (partial: UpdatableSettings) => ipcRenderer.invoke(IPC_CHANNELS.settings.update, partial)
  },
  storage: {
    getDataRoot: () => ipcRenderer.invoke(IPC_CHANNELS.storage.getDataRoot),
    pickDataRoot: () => ipcRenderer.invoke(IPC_CHANNELS.storage.pickDataRoot),
    setDataRoot: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.storage.setDataRoot, path)
  },
  db: {
    status: () => ipcRenderer.invoke(IPC_CHANNELS.db.status)
  },
  events: {
    create: (input: EventInput) => ipcRenderer.invoke(IPC_CHANNELS.events.create, input),
    update: (id: string, input: EventInput) => ipcRenderer.invoke(IPC_CHANNELS.events.update, id, input),
    archive: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.events.archive, id),
    list: () => ipcRenderer.invoke(IPC_CHANNELS.events.list),
    getActive: () => ipcRenderer.invoke(IPC_CHANNELS.events.getActive),
    setActive: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.events.setActive, id),
    markReady: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.events.markReady, id),
    isReady: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.events.isReady, id)
  },
  templates: {
    create: () => ipcRenderer.invoke(IPC_CHANNELS.templates.create),
    list: () => ipcRenderer.invoke(IPC_CHANNELS.templates.list),
    get: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.templates.get, id),
    getImage: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.templates.getImage, id),
    save: (id: string, payload: TemplateSavePayload) =>
      ipcRenderer.invoke(IPC_CHANNELS.templates.save, id, payload),
    validate: (id: string, payload: TemplateSavePayload) =>
      ipcRenderer.invoke(IPC_CHANNELS.templates.validate, id, payload),
    duplicate: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.templates.duplicate, id),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.templates.delete, id),
    export: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.templates.export, id),
    import: () => ipcRenderer.invoke(IPC_CHANNELS.templates.import)
  },
  printTemplates: {
    list: (eventId: string) => ipcRenderer.invoke(IPC_CHANNELS.printTemplates.list, eventId),
    get: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.printTemplates.get, id),
    create: (eventId: string, input: PrintTemplateCreateInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.printTemplates.create, eventId, input),
    save: (id: string, payload: PrintTemplateSavePayload) =>
      ipcRenderer.invoke(IPC_CHANNELS.printTemplates.save, id, payload),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.printTemplates.delete, id)
  },
  sessions: {
    start: (eventId: string) => ipcRenderer.invoke(IPC_CHANNELS.sessions.start, eventId),
    savePhoto: (sessionId: string, photoIndex: number, bytes: ArrayBuffer, width: number | null, height: number | null) =>
      ipcRenderer.invoke(IPC_CHANNELS.sessions.savePhoto, sessionId, photoIndex, bytes, width, height),
    complete: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.sessions.complete, sessionId),
    listForEvent: (eventId: string) => ipcRenderer.invoke(IPC_CHANNELS.sessions.listForEvent, eventId),
    getThumbnail: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.sessions.getThumbnail, sessionId),
    getFinal: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.sessions.getFinal, sessionId),
    saveComposition: (
      sessionId: string,
      png: ArrayBuffer,
      jpg: ArrayBuffer,
      thumb: ArrayBuffer,
      width: number,
      height: number,
      outputType: string
    ) => ipcRenderer.invoke(IPC_CHANNELS.sessions.saveComposition, sessionId, png, jpg, thumb, width, height, outputType),
    discard: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.sessions.discard, sessionId)
  },
  camera: {
    getConfig: () => ipcRenderer.invoke(IPC_CHANNELS.camera.getConfig),
    setConfig: (config: CameraConfig) => ipcRenderer.invoke(IPC_CHANNELS.camera.setConfig, config)
  },
  qr: {
    validate: (url: string) => ipcRenderer.invoke(IPC_CHANNELS.qr.validate, url),
    ensureForEvent: (eventId: string) => ipcRenderer.invoke(IPC_CHANNELS.qr.ensureForEvent, eventId)
  },
  print: {
    listPrinters: () => ipcRenderer.invoke(IPC_CHANNELS.print.listPrinters),
    test: (printerName: string) => ipcRenderer.invoke(IPC_CHANNELS.print.test, printerName),
    print: (request: PrintRequest) => ipcRenderer.invoke(IPC_CHANNELS.print.print, request),
    retry: (jobId: string) => ipcRenderer.invoke(IPC_CHANNELS.print.retry, jobId),
    listJobs: (eventId: string) => ipcRenderer.invoke(IPC_CHANNELS.print.listJobs, eventId)
  },
  history: {
    archive: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.history.archive, sessionId),
    openFinal: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.history.openFinal, sessionId),
    openOriginals: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.history.openOriginals, sessionId),
    exportSession: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.history.exportSession, sessionId)
  },
  diagnostics: {
    run: () => ipcRenderer.invoke(IPC_CHANNELS.diagnostics.run),
    export: () => ipcRenderer.invoke(IPC_CHANNELS.diagnostics.export)
  },
  branding: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.branding.get),
    set: (partial: Partial<BrandingConfig>) => ipcRenderer.invoke(IPC_CHANNELS.branding.set, partial),
    pickLogo: () => ipcRenderer.invoke(IPC_CHANNELS.branding.pickLogo),
    clearLogo: () => ipcRenderer.invoke(IPC_CHANNELS.branding.clearLogo),
    getLogo: () => ipcRenderer.invoke(IPC_CHANNELS.branding.getLogo)
  },
  license: {
    status: () => ipcRenderer.invoke(IPC_CHANNELS.license.status)
  },
  backup: {
    exportEvent: (eventId: string) => ipcRenderer.invoke(IPC_CHANNELS.backup.exportEvent, eventId),
    importEvent: () => ipcRenderer.invoke(IPC_CHANNELS.backup.importEvent)
  },
  web: {
    getConfig: () => ipcRenderer.invoke(IPC_CHANNELS.web.getConfig),
    setConfig: (config: Partial<WebConfig>) => ipcRenderer.invoke(IPC_CHANNELS.web.setConfig, config),
    testConnection: () => ipcRenderer.invoke(IPC_CHANNELS.web.testConnection),
    ensureEventFolio: (eventId: string) => ipcRenderer.invoke(IPC_CHANNELS.web.ensureEventFolio, eventId),
    publishSessionFinal: (sessionId: string, force?: boolean) =>
      ipcRenderer.invoke(IPC_CHANNELS.web.publishSessionFinal, sessionId, force === true),
    publishVideo: (videoId: string) => ipcRenderer.invoke(IPC_CHANNELS.web.publishVideo, videoId),
    listUploads: (eventId: string) => ipcRenderer.invoke(IPC_CHANNELS.web.listUploads, eventId),
    retryPending: (eventId: string) => ipcRenderer.invoke(IPC_CHANNELS.web.retryPending, eventId),
    openPage: (url: string) => ipcRenderer.invoke(IPC_CHANNELS.web.openPage, url)
  },
  videos: {
    saveRecorded: (eventId: string, bytes: ArrayBuffer, ext: string, durationMs: number | null) =>
      ipcRenderer.invoke(IPC_CHANNELS.videos.saveRecorded, eventId, bytes, ext, durationMs),
    importVideo: (eventId: string) => ipcRenderer.invoke(IPC_CHANNELS.videos.importVideo, eventId),
    list: (eventId: string) => ipcRenderer.invoke(IPC_CHANNELS.videos.list, eventId),
    delete: (videoId: string) => ipcRenderer.invoke(IPC_CHANNELS.videos.delete, videoId),
    getDataUrl: (videoId: string) => ipcRenderer.invoke(IPC_CHANNELS.videos.getDataUrl, videoId)
  },
  videoTemplates: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.videoTemplates.list),
    get: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.videoTemplates.get, id),
    create: (input: VideoTemplateInput) => ipcRenderer.invoke(IPC_CHANNELS.videoTemplates.create, input),
    save: (id: string, input: VideoTemplateInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.videoTemplates.save, id, input),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.videoTemplates.delete, id)
  },
  display: {
    openPublic: () => ipcRenderer.invoke(IPC_CHANNELS.display.openPublic),
    closePublic: () => ipcRenderer.invoke(IPC_CHANNELS.display.closePublic),
    isPublicOpen: () => ipcRenderer.invoke(IPC_CHANNELS.display.isPublicOpen)
  },
  live: {
    publishState: (state: LiveSessionState) =>
      ipcRenderer.invoke(IPC_CHANNELS.live.publishState, state),
    sendCommand: (command: LiveCommand) => ipcRenderer.invoke(IPC_CHANNELS.live.sendCommand, command),
    onState: (callback: (state: LiveSessionState) => void): (() => void) => {
      const listener = (_event: unknown, state: LiveSessionState) => callback(state);
      ipcRenderer.on(IPC_CHANNELS.live.stateChannel, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.live.stateChannel, listener);
    },
    onCommand: (callback: (command: LiveCommand) => void): (() => void) => {
      const listener = (_event: unknown, command: LiveCommand) => callback(command);
      ipcRenderer.on(IPC_CHANNELS.live.commandChannel, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.live.commandChannel, listener);
    }
  }
};

try {
  contextBridge.exposeInMainWorld('photoBooth', api);
} catch (error) {
  // contextIsolation is always on; this only fires on a misconfiguration.
  console.error('[preload] Failed to expose photoBooth API', error);
}
