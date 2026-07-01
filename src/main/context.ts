import type { Db } from './services/database/types';
import type { Repositories } from './services/database/repositories';
import type { StorageService } from './services/storage/StorageService';
import type { SettingsService } from './services/settings/SettingsService';
import type { EventService } from './services/events/EventService';
import type { TemplateService } from './services/templates/TemplateService';
import type { PrintTemplateService } from './services/printTemplates/PrintTemplateService';
import type { SessionService } from './services/sessions/SessionService';
import type { QRService } from './services/qr/QRService';
import type { PrintService } from './services/print/PrintService';
import type { DiagnosticsService } from './services/diagnostics/DiagnosticsService';
import type { BackupService } from './services/backup/BackupService';

/** Live service container assembled at startup (see bootstrap.ts). */
export interface AppContext {
  db: Db;
  repos: Repositories;
  storage: StorageService;
  settings: SettingsService;
  events: EventService;
  templates: TemplateService;
  printTemplates: PrintTemplateService;
  sessions: SessionService;
  qr: QRService;
  print: PrintService;
  diagnostics: DiagnosticsService;
  backup: BackupService;
}

let context: AppContext | null = null;

export function setContext(next: AppContext): void {
  context = next;
}

export function getContext(): AppContext {
  if (!context) {
    throw new Error('App context not initialized (bootstrap did not run)');
  }
  return context;
}

export function hasContext(): boolean {
  return context !== null;
}
