/**
 * Domain record types mirroring docs/DATABASE_SCHEMA.md.
 * Columns are stored snake_case in SQLite; these camelCase shapes are what the
 * repositories return and what crosses IPC. Integer flags (0/1) stay `number`
 * so the row mapper can remain purely structural (snake↔camel).
 */

export type EventStatus = 'active' | 'archived';

export interface EventRecord {
  id: string;
  name: string;
  eventType: string;
  eventDate: string | null;
  clientReference: string | null;
  templateId: string | null;
  defaultPhotoCount: number;
  defaultCopies: number;
  qrEnabled: number;
  qrLink: string | null;
  status: EventStatus;
  /** Capture modes offered by this event (0/1). */
  enablePhotos: number;
  enableVideos: number;
  /** Publish finals/videos to the web gallery (0/1). */
  webUploadEnabled: number;
  /** Master folio assigned by the web (null until created / offline). */
  webEventFolio: string | null;
  /** Video overlay template used when recording (video_templates.id). */
  videoTemplateId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type VideoSource = 'recorded' | 'imported';

export interface VideoRecord {
  id: string;
  eventId: string;
  filePath: string;
  source: VideoSource;
  durationMs: number | null;
  sizeBytes: number | null;
  createdAt: string;
  updatedAt: string;
}

export type WebUploadStatus = 'pending' | 'done' | 'failed';
export type WebMediaType = 'photo' | 'video';

export interface WebUploadRecord {
  id: string;
  eventId: string;
  sessionId: string | null;
  videoId: string | null;
  mediaType: WebMediaType;
  folio: string | null;
  pageUrl: string | null;
  mediaUrl: string | null;
  status: WebUploadStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VideoTemplateRecord {
  id: string;
  name: string;
  /** JSON overlay config (see shared/types/videoTemplates.ts). */
  configJson: string;
  createdAt: string;
  updatedAt: string;
}

export type TemplateSlotType = 'photo' | 'qr' | 'text' | 'logo' | 'decoration';
export type FitMode = 'cover' | 'contain' | 'stretch';

export interface TemplateRecord {
  id: string;
  name: string;
  type: string;
  baseImagePath: string | null;
  widthPx: number;
  heightPx: number;
  formatLabel: string | null;
  isArchived: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateSlotRecord {
  id: string;
  templateId: string;
  slotType: TemplateSlotType;
  slotKey: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  fitMode: FitMode;
  createdAt: string;
  updatedAt: string;
}

export type PrintTemplateMode = 'grid' | 'custom' | 'full';

export interface PrintTemplateRecord {
  id: string;
  eventId: string;
  name: string;
  photoTemplateId: string | null;
  paperKey: string;
  orientation: 'portrait' | 'landscape';
  mode: PrintTemplateMode;
  cellCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PrintTemplateSlotRecord {
  id: string;
  printTemplateId: string;
  /** Normalized 0..1 coordinates relative to the sheet (paper-size independent). */
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
}

export type SessionStatus = 'in_progress' | 'completed' | 'archived' | 'error';

export interface SessionRecord {
  id: string;
  eventId: string;
  templateId: string;
  photoCount: number;
  status: SessionStatus;
  finalOutputPath: string | null;
  thumbnailPath: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionPhotoRecord {
  id: string;
  sessionId: string;
  photoIndex: number;
  originalPath: string;
  processedPath: string | null;
  widthPx: number | null;
  heightPx: number | null;
  createdAt: string;
}

export type OutputType = 'strip' | 'postcard' | 'print_sheet' | 'thumbnail';

export interface SessionOutputRecord {
  id: string;
  sessionId: string;
  outputType: OutputType;
  filePath: string;
  widthPx: number | null;
  heightPx: number | null;
  format: string | null;
  createdAt: string;
}

export type PrintJobStatus =
  | 'pending'
  | 'rendering'
  | 'ready'
  | 'sent'
  | 'completed'
  | 'failed'
  | 'canceled';

export interface PrintJobRecord {
  id: string;
  eventId: string;
  sessionId: string | null;
  printSheetPath: string;
  printerName: string | null;
  paperSize: string | null;
  copies: number;
  status: PrintJobStatus;
  errorCode: string | null;
  errorMessage: string | null;
  /** Adapter used: windows | pdf | image. */
  method: string | null;
  /** Sheet layout descriptor, e.g. "1-up".."4-up". */
  layout: string | null;
  orientation: string | null;
  /** JSON array of session ids included in a multi-session sheet. */
  sheetSessions: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PosePackRecord {
  id: string;
  name: string;
  eventType: string | null;
  isDefault: number;
  createdAt: string;
  updatedAt: string;
}

export interface PoseRecord {
  id: string;
  posePackId: string;
  text: string;
  displayOrder: number;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

export type QrScope = 'event' | 'session' | 'global';

export interface QrLinkRecord {
  id: string;
  eventId: string | null;
  label: string | null;
  url: string;
  qrImagePath: string | null;
  scope: QrScope;
  createdAt: string;
  updatedAt: string;
}

export interface SettingRecord {
  key: string;
  value: string;
  updatedAt: string;
}
