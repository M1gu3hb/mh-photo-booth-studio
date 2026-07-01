import type { Db } from '../types';
import { BaseRepository } from '../BaseRepository';
import type {
  EventRecord,
  TemplateRecord,
  TemplateSlotRecord,
  SessionRecord,
  SessionPhotoRecord,
  SessionOutputRecord,
  PrintJobRecord,
  PrintTemplateRecord,
  QrLinkRecord
} from '@shared/types/entities';
import { SettingsRepository } from './SettingsRepository';
import { PosePacksRepository } from './PosePacksRepository';
import { PosesRepository } from './PosesRepository';

export type EventCreate = Omit<EventRecord, 'id' | 'createdAt' | 'updatedAt'>;
export type TemplateCreate = Omit<TemplateRecord, 'id' | 'createdAt' | 'updatedAt'>;
export type TemplateSlotCreate = Omit<TemplateSlotRecord, 'id' | 'createdAt' | 'updatedAt'>;
export type SessionCreate = Omit<SessionRecord, 'id' | 'createdAt' | 'updatedAt'>;
export type SessionPhotoCreate = Omit<SessionPhotoRecord, 'id' | 'createdAt'>;
export type SessionOutputCreate = Omit<SessionOutputRecord, 'id' | 'createdAt'>;
export type PrintJobCreate = Omit<PrintJobRecord, 'id' | 'createdAt' | 'updatedAt'>;
export type PrintTemplateCreate = Omit<PrintTemplateRecord, 'id' | 'createdAt' | 'updatedAt'>;
export type QrLinkCreate = Omit<QrLinkRecord, 'id' | 'createdAt' | 'updatedAt'>;

export interface Repositories {
  events: BaseRepository<EventRecord, EventCreate>;
  templates: BaseRepository<TemplateRecord, TemplateCreate>;
  templateSlots: BaseRepository<TemplateSlotRecord, TemplateSlotCreate>;
  sessions: BaseRepository<SessionRecord, SessionCreate>;
  sessionPhotos: BaseRepository<SessionPhotoRecord, SessionPhotoCreate>;
  sessionOutputs: BaseRepository<SessionOutputRecord, SessionOutputCreate>;
  printJobs: BaseRepository<PrintJobRecord, PrintJobCreate>;
  printTemplates: BaseRepository<PrintTemplateRecord, PrintTemplateCreate>;
  qrLinks: BaseRepository<QrLinkRecord, QrLinkCreate>;
  posePacks: PosePacksRepository;
  poses: PosesRepository;
  settings: SettingsRepository;
}

/** Builds the typed repository set over a database connection. */
export function createRepositories(db: Db): Repositories {
  return {
    events: new BaseRepository<EventRecord, EventCreate>(db, 'events'),
    templates: new BaseRepository<TemplateRecord, TemplateCreate>(db, 'templates'),
    templateSlots: new BaseRepository<TemplateSlotRecord, TemplateSlotCreate>(db, 'template_slots'),
    sessions: new BaseRepository<SessionRecord, SessionCreate>(db, 'sessions'),
    sessionPhotos: new BaseRepository<SessionPhotoRecord, SessionPhotoCreate>(db, 'session_photos', {
      hasUpdatedAt: false
    }),
    sessionOutputs: new BaseRepository<SessionOutputRecord, SessionOutputCreate>(
      db,
      'session_outputs',
      { hasUpdatedAt: false }
    ),
    printJobs: new BaseRepository<PrintJobRecord, PrintJobCreate>(db, 'print_jobs'),
    printTemplates: new BaseRepository<PrintTemplateRecord, PrintTemplateCreate>(db, 'print_templates'),
    qrLinks: new BaseRepository<QrLinkRecord, QrLinkCreate>(db, 'qr_links'),
    posePacks: new PosePacksRepository(db),
    poses: new PosesRepository(db),
    settings: new SettingsRepository(db)
  };
}

export { SettingsRepository, PosePacksRepository, PosesRepository };
