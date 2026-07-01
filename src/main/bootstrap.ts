import { existsSync, copyFileSync } from 'node:fs';
import { openBetterSqlite } from './services/database/betterSqlite';
import { runMigrations, getCurrentSchemaVersion, LATEST_SCHEMA_VERSION } from './services/database/migrate';
import { createRepositories } from './services/database/repositories';
import { seedPosePacks } from './services/database/seed';
import { StorageService } from './services/storage/StorageService';
import { readAppConfig, writeAppConfig } from './services/storage/appConfig';
import { SettingsService } from './services/settings/SettingsService';
import { EventService } from './services/events/EventService';
import { TemplateService } from './services/templates/TemplateService';
import { PrintTemplateService } from './services/printTemplates/PrintTemplateService';
import { WebService } from './services/web/WebService';
import { VideoService } from './services/videos/VideoService';
import { VideoTemplateService } from './services/videos/VideoTemplateService';
import { SessionService } from './services/sessions/SessionService';
import { app, BrowserWindow } from 'electron';
import { QRService } from './services/qr/QRService';
import { PrintService } from './services/print/PrintService';
import { adapterForMethod } from './services/print/adapters';
import { DiagnosticsService } from './services/diagnostics/DiagnosticsService';
import { BackupService } from './services/backup/BackupService';
import { setLogsDir } from './services/logging/logger';
import type { PrinterInfo } from '@shared/types/print';
import { setContext, getContext, type AppContext } from './context';

/**
 * Startup sequence: resolve data root → ensure folders → open DB → run
 * migrations → build repos → seed pose packs → ensure setting defaults.
 * All local and offline; no network anywhere.
 */
export function bootstrap(): AppContext {
  const config = readAppConfig();
  const storage = new StorageService(config.dataRoot);
  storage.ensureStructure();
  setLogsDir(storage.toAbsolute('logs'));

  const dbPath = storage.databasePath();
  const existedBefore = existsSync(dbPath);
  let db = openBetterSqlite(dbPath);

  // Back up an existing DB before applying a schema upgrade (RELEASE_PACKAGING.md).
  if (existedBefore) {
    const current = getCurrentSchemaVersion(db);
    if (current > 0 && current < LATEST_SCHEMA_VERSION) {
      db.close();
      const backup = storage.toAbsolute(`backups/app_${Date.now()}_v${current}.sqlite`);
      try {
        copyFileSync(dbPath, backup);
      } catch {
        // best-effort backup
      }
      db = openBetterSqlite(dbPath);
    }
  }
  runMigrations(db);

  const repos = createRepositories(db);
  seedPosePacks(db, repos);

  const settings = new SettingsService(repos.settings);
  settings.ensureDefaults();
  settings.ensureLicense();

  const events = new EventService(repos, storage);
  const templates = new TemplateService(repos, storage, db);
  const printTemplates = new PrintTemplateService(repos, db);
  const sessions = new SessionService(repos, storage, db);
  const qr = new QRService(repos, storage);
  const print = new PrintService(repos, storage, {
    resolveAdapter: adapterForMethod,
    listSystemPrinters: async (): Promise<PrinterInfo[]> => {
      const win = BrowserWindow.getAllWindows()[0];
      if (!win) return [];
      const printers = await win.webContents.getPrintersAsync();
      return printers.map((p) => ({
        name: p.name,
        displayName: p.displayName || p.name,
        isDefault: p.isDefault
      }));
    }
  });

  const diagnostics = new DiagnosticsService(repos, storage, settings, events, {
    listPrinters: () => print.listPrinters(),
    appInfo: {
      version: app.getVersion(),
      platform: process.platform,
      environment: app.isPackaged ? 'production' : 'development'
    }
  });

  const backup = new BackupService(repos, storage);
  const web = new WebService(repos, storage);
  const videos = new VideoService(repos, storage);
  const videoTemplates = new VideoTemplateService(repos);

  const context: AppContext = {
    db,
    repos,
    storage,
    settings,
    events,
    templates,
    printTemplates,
    sessions,
    qr,
    print,
    diagnostics,
    backup,
    web,
    videos,
    videoTemplates
  };
  setContext(context);
  return context;
}

/**
 * Relocates the data root: closes the current DB, persists the new path, and
 * re-bootstraps at the new location (fresh structure + migrations + seed).
 * Existing files are left in place (never auto-deleted — FILE_STORAGE.md).
 */
export function changeDataRoot(newRoot: string): AppContext {
  const current = getContext();
  current.db.close();
  writeAppConfig({ dataRoot: newRoot });
  return bootstrap();
}
