import { statfs } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import AdmZip from 'adm-zip';
import type { DiagnosticsReport, DiagnosticsCheck } from '@shared/types/diagnostics';
import type { Repositories } from '../database/repositories';
import type { StorageService } from '../storage/StorageService';
import type { SettingsService } from '../settings/SettingsService';
import type { EventService } from '../events/EventService';

const GB = 1024 * 1024 * 1024;
const ROOT_FOLDERS = ['database', 'templates', 'events', 'logs', 'backups', 'exports'];

export interface DiagnosticsDeps {
  listPrinters: () => Promise<{ name: string }[]>;
  appInfo: { version: string; platform: string; environment: string };
}

/** Collects a non-PII diagnostics snapshot and exports it as a support zip. */
export class DiagnosticsService {
  private readonly repos: Repositories;
  private readonly storage: StorageService;
  private readonly settings: SettingsService;
  private readonly events: EventService;
  private readonly deps: DiagnosticsDeps;

  constructor(
    repos: Repositories,
    storage: StorageService,
    settings: SettingsService,
    events: EventService,
    deps: DiagnosticsDeps
  ) {
    this.repos = repos;
    this.storage = storage;
    this.settings = settings;
    this.events = events;
    this.deps = deps;
  }

  private readErrorsTail(max: number): string[] {
    const file = this.storage.toAbsolute('logs/errors.log');
    if (!existsSync(file)) return [];
    try {
      const lines = readFileSync(file, 'utf-8').split('\n').filter(Boolean);
      return lines.slice(-max).reverse();
    } catch {
      return [];
    }
  }

  async run(): Promise<DiagnosticsReport> {
    const dataRoot = this.storage.getDataRoot();
    let diskFreeBytes = 0;
    let diskTotalBytes = 0;
    try {
      const fsStat = await statfs(dataRoot);
      diskFreeBytes = Number(fsStat.bsize) * Number(fsStat.bavail);
      diskTotalBytes = Number(fsStat.bsize) * Number(fsStat.blocks);
    } catch {
      // disk stats unavailable
    }

    const printers = await this.deps.listPrinters().catch(() => []);
    const camera = this.settings.getCameraConfig();
    const active = this.events.getActive();

    const checks: DiagnosticsCheck[] = [];

    checks.push({
      key: 'storage',
      label: 'Almacenamiento',
      status: ROOT_FOLDERS.every((f) => existsSync(join(dataRoot, f))) ? 'ok' : 'error',
      detail: dataRoot
    });

    checks.push({
      key: 'disk',
      label: 'Espacio en disco',
      status: diskFreeBytes > GB ? 'ok' : diskFreeBytes > GB / 10 ? 'warn' : 'error',
      detail: `${(diskFreeBytes / GB).toFixed(1)} GB libres`
    });

    checks.push({
      key: 'camera',
      label: 'Cámara',
      status: camera.kind === 'mock' ? 'warn' : 'ok',
      detail: camera.kind === 'mock' ? 'Cámara simulada (mock)' : (camera.label ?? 'Predeterminada')
    });

    checks.push({
      key: 'printer',
      label: 'Impresora',
      status: printers.length > 0 ? 'ok' : 'warn',
      detail: printers.length > 0 ? `${printers.length} detectada(s)` : 'Sin impresora (puedes exportar imagen/PDF)'
    });

    checks.push({
      key: 'event',
      label: 'Evento activo',
      status: active ? (active.templateId ? 'ok' : 'warn') : 'warn',
      detail: active ? (active.templateId ? active.name : `${active.name} · falta plantilla`) : 'Sin evento activo'
    });

    checks.push({
      key: 'qr',
      label: 'QR',
      status: 'ok',
      detail: active?.qrEnabled ? 'Activado' : 'Desactivado'
    });

    return {
      generatedAt: new Date().toISOString(),
      version: this.deps.appInfo.version,
      platform: this.deps.appInfo.platform,
      environment: this.deps.appInfo.environment,
      dataRoot,
      diskFreeBytes,
      diskTotalBytes,
      counts: {
        events: this.repos.events.count("status = 'active'"),
        templates: this.repos.templates.count('is_archived = 0'),
        sessions: this.repos.sessions.count()
      },
      printers: printers.map((p) => p.name),
      cameraLabel: camera.label ?? (camera.kind === 'mock' ? 'Simulada' : 'Predeterminada'),
      checks,
      recentErrors: this.readErrorsTail(10)
    };
  }

  /** Exports logs + the report as diagnostics_<date>.zip (no photos). */
  async export(destPath: string): Promise<string> {
    const report = await this.run();
    const zip = new AdmZip();
    zip.addFile('diagnostics.json', Buffer.from(JSON.stringify(report, null, 2)));
    const logsDir = this.storage.toAbsolute('logs');
    if (existsSync(logsDir)) {
      zip.addLocalFolder(logsDir, 'logs');
    }
    zip.writeZip(destPath);
    return destPath;
  }
}
