import type { Result } from '@shared/types/result';
import type { AppInfo } from '@shared/types/app';
import type { AppSettings, UpdatableSettings } from '@shared/types/settings';
import type { EventInput } from '@shared/types/events';
import type {
  EventRecord,
  TemplateRecord,
  SessionRecord,
  SessionPhotoRecord,
  PrintTemplateRecord,
  VideoRecord,
  WebUploadRecord,
  VideoTemplateRecord
} from '@shared/types/entities';
import type { TemplateSavePayload, TemplateWithSlots, TemplateValidation } from '@shared/types/templates';
import type {
  PrintTemplateCreateInput,
  PrintTemplateSavePayload,
  PrintTemplateWithSlots
} from '@shared/types/printTemplates';
import type { SessionStartResult } from '@shared/types/session';
import type { CameraConfig } from '@shared/types/camera';
import type { PrinterInfo, PrintRequest } from '@shared/types/print';
import type { PrintJobRecord } from '@shared/types/entities';
import type { DiagnosticsReport } from '@shared/types/diagnostics';
import type { BrandingConfig } from '@shared/constants/branding';
import type { LicenseStatus } from '@shared/types/license';
import type { LiveSessionState, LiveCommand } from '@shared/types/live';
import type { WebConfig, WebConnectionStatus, WebPublishResult, EventFolioResult } from '@shared/types/web';
import type { VideoTemplateInput } from '@shared/types/videoTemplates';

export interface DbStatus {
  schemaVersion: number;
  dataRoot: string;
  posePackCount: number;
}

/**
 * The complete, typed surface exposed to the renderer as `window.photoBooth`.
 * Every method returns a `Result<T>` — the renderer never touches Node directly.
 * Areas grow phase by phase (events, templates, sessions, print, ...).
 */
export interface PhotoBoothApi {
  app: {
    getInfo: () => Promise<Result<AppInfo>>;
    setFullscreen: (enabled: boolean) => Promise<Result<boolean>>;
  };
  settings: {
    get: () => Promise<Result<AppSettings>>;
    update: (partial: UpdatableSettings) => Promise<Result<AppSettings>>;
  };
  storage: {
    getDataRoot: () => Promise<Result<string>>;
    pickDataRoot: () => Promise<Result<string | null>>;
    setDataRoot: (path: string) => Promise<Result<AppSettings>>;
  };
  db: {
    status: () => Promise<Result<DbStatus>>;
  };
  events: {
    create: (input: EventInput) => Promise<Result<EventRecord>>;
    update: (id: string, input: EventInput) => Promise<Result<EventRecord>>;
    archive: (id: string) => Promise<Result<EventRecord>>;
    list: () => Promise<Result<EventRecord[]>>;
    getActive: () => Promise<Result<EventRecord | null>>;
    setActive: (id: string) => Promise<Result<EventRecord>>;
    markReady: (id: string) => Promise<Result<boolean>>;
    isReady: (id: string) => Promise<Result<boolean>>;
  };
  templates: {
    create: () => Promise<Result<TemplateRecord | null>>;
    list: () => Promise<Result<TemplateRecord[]>>;
    get: (id: string) => Promise<Result<TemplateWithSlots>>;
    getImage: (id: string) => Promise<Result<string>>;
    save: (id: string, payload: TemplateSavePayload) => Promise<Result<TemplateWithSlots>>;
    validate: (id: string, payload: TemplateSavePayload) => Promise<Result<TemplateValidation>>;
    duplicate: (id: string) => Promise<Result<TemplateRecord>>;
    delete: (id: string) => Promise<Result<{ affectedEvents: number }>>;
    export: (id: string) => Promise<Result<string | null>>;
    import: () => Promise<Result<TemplateRecord | null>>;
  };
  printTemplates: {
    list: (eventId: string) => Promise<Result<PrintTemplateRecord[]>>;
    get: (id: string) => Promise<Result<PrintTemplateWithSlots>>;
    create: (eventId: string, input: PrintTemplateCreateInput) => Promise<Result<PrintTemplateRecord>>;
    save: (id: string, payload: PrintTemplateSavePayload) => Promise<Result<PrintTemplateWithSlots>>;
    delete: (id: string) => Promise<Result<{ ok: true }>>;
  };
  sessions: {
    start: (eventId: string) => Promise<Result<SessionStartResult>>;
    savePhoto: (
      sessionId: string,
      photoIndex: number,
      bytes: ArrayBuffer,
      width: number | null,
      height: number | null
    ) => Promise<Result<SessionPhotoRecord>>;
    complete: (sessionId: string) => Promise<Result<SessionRecord>>;
    listForEvent: (eventId: string) => Promise<Result<SessionRecord[]>>;
    getThumbnail: (sessionId: string) => Promise<Result<string>>;
    getFinal: (sessionId: string) => Promise<Result<string>>;
    saveComposition: (
      sessionId: string,
      png: ArrayBuffer,
      jpg: ArrayBuffer,
      thumb: ArrayBuffer,
      width: number,
      height: number,
      outputType: string
    ) => Promise<Result<SessionRecord>>;
    discard: (sessionId: string) => Promise<Result<void>>;
  };
  camera: {
    getConfig: () => Promise<Result<CameraConfig>>;
    setConfig: (config: CameraConfig) => Promise<Result<CameraConfig>>;
  };
  qr: {
    validate: (url: string) => Promise<Result<boolean>>;
    ensureForEvent: (eventId: string) => Promise<Result<string | null>>;
  };
  print: {
    listPrinters: () => Promise<Result<PrinterInfo[]>>;
    test: (printerName: string) => Promise<Result<boolean>>;
    print: (request: PrintRequest) => Promise<Result<PrintJobRecord>>;
    retry: (jobId: string) => Promise<Result<PrintJobRecord>>;
    listJobs: (eventId: string) => Promise<Result<PrintJobRecord[]>>;
  };
  history: {
    archive: (sessionId: string) => Promise<Result<SessionRecord>>;
    openFinal: (sessionId: string) => Promise<Result<boolean>>;
    openOriginals: (sessionId: string) => Promise<Result<boolean>>;
    exportSession: (sessionId: string) => Promise<Result<string | null>>;
  };
  diagnostics: {
    run: () => Promise<Result<DiagnosticsReport>>;
    export: () => Promise<Result<string | null>>;
  };
  branding: {
    get: () => Promise<Result<BrandingConfig>>;
    set: (partial: Partial<BrandingConfig>) => Promise<Result<BrandingConfig>>;
    pickLogo: () => Promise<Result<BrandingConfig>>;
    clearLogo: () => Promise<Result<BrandingConfig>>;
    getLogo: () => Promise<Result<string | null>>;
  };
  license: {
    status: () => Promise<Result<LicenseStatus>>;
  };
  backup: {
    exportEvent: (eventId: string) => Promise<Result<string | null>>;
    importEvent: () => Promise<Result<EventRecord | null>>;
  };
  web: {
    getConfig: () => Promise<Result<WebConfig>>;
    setConfig: (config: Partial<WebConfig>) => Promise<Result<WebConfig>>;
    testConnection: () => Promise<Result<WebConnectionStatus>>;
    ensureEventFolio: (eventId: string) => Promise<Result<EventFolioResult>>;
    publishSessionFinal: (sessionId: string, force?: boolean) => Promise<Result<WebPublishResult>>;
    publishVideo: (videoId: string) => Promise<Result<WebPublishResult>>;
    listUploads: (eventId: string) => Promise<Result<WebUploadRecord[]>>;
    retryPending: (eventId: string) => Promise<Result<{ retried: number; succeeded: number }>>;
    openPage: (url: string) => Promise<Result<{ ok: true }>>;
  };
  videos: {
    saveRecorded: (
      eventId: string,
      bytes: ArrayBuffer,
      ext: string,
      durationMs: number | null
    ) => Promise<Result<VideoRecord>>;
    importVideo: (eventId: string) => Promise<Result<VideoRecord | null>>;
    list: (eventId: string) => Promise<Result<VideoRecord[]>>;
    delete: (videoId: string) => Promise<Result<void>>;
    getDataUrl: (videoId: string) => Promise<Result<string>>;
  };
  videoTemplates: {
    list: () => Promise<Result<VideoTemplateRecord[]>>;
    get: (id: string) => Promise<Result<VideoTemplateRecord>>;
    create: (input: VideoTemplateInput) => Promise<Result<VideoTemplateRecord>>;
    save: (id: string, input: VideoTemplateInput) => Promise<Result<VideoTemplateRecord>>;
    delete: (id: string) => Promise<Result<{ ok: true }>>;
  };
  display: {
    openPublic: () => Promise<Result<{ open: boolean }>>;
    closePublic: () => Promise<Result<{ open: boolean }>>;
    isPublicOpen: () => Promise<Result<{ open: boolean }>>;
  };
  live: {
    publishState: (state: LiveSessionState) => Promise<Result<{ ok: true }>>;
    sendCommand: (command: LiveCommand) => Promise<Result<{ ok: true }>>;
    /** Subscribe to live state (public window). Returns an unsubscribe fn. */
    onState: (callback: (state: LiveSessionState) => void) => () => void;
    /** Subscribe to public commands (operator window). Returns an unsubscribe fn. */
    onCommand: (callback: (command: LiveCommand) => void) => () => void;
  };
}
