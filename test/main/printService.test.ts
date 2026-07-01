import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { openNodeSqlite } from '../helpers/nodeSqlite';
import { runMigrations } from '../../src/main/services/database/migrate';
import { createRepositories, type Repositories } from '../../src/main/services/database/repositories';
import { StorageService } from '../../src/main/services/storage/StorageService';
import { PrintService } from '../../src/main/services/print/PrintService';
import { AppError } from '../../src/shared/errors/appError';
import type { Db } from '../../src/main/services/database/types';
import type { PrintRequest } from '../../src/shared/types/print';
import type { PrintAdapter } from '../../src/main/services/print/adapters';

const SHEET = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]).buffer;

function request(eventId: string, over: Partial<PrintRequest> = {}): PrintRequest {
  return {
    eventId,
    sessionId: 'sess-1',
    sheetSessions: ['sess-1'],
    printerName: 'HP-Deskjet',
    method: 'image',
    paperSize: '4x6',
    orientation: 'portrait',
    layout: '2-up',
    copies: 3,
    sheetBytes: SHEET,
    sheetWidth: 1200,
    sheetHeight: 1800,
    ...over
  };
}

const okAdapter: PrintAdapter = { method: 'image', async send() { return { outputPath: null }; } };
const failAdapter: PrintAdapter = {
  method: 'windows',
  async send() {
    throw new AppError({
      code: 'PRINT_SEND_FAILED',
      message: 'fail',
      userMessage: 'No se pudo imprimir.',
      action: 'Reintenta.',
      module: 'print'
    });
  }
};

describe('PrintService', () => {
  let dir: string;
  let db: Db;
  let repos: Repositories;
  let storage: StorageService;
  let eventId: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'pbs-print-'));
    db = openNodeSqlite();
    runMigrations(db);
    repos = createRepositories(db);
    storage = new StorageService(dir);
    storage.ensureStructure();
    const event = repos.events.create({
      name: 'Print Evt',
      eventType: 'xv',
      eventDate: null,
      clientReference: null,
      templateId: null,
      defaultPhotoCount: 2,
      defaultCopies: 1,
      qrEnabled: 0,
      qrLink: null,
      status: 'active'
    });
    eventId = event.id;
  });

  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  function service(adapter: PrintAdapter): PrintService {
    return new PrintService(repos, storage, {
      resolveAdapter: () => adapter,
      listSystemPrinters: async () => [{ name: 'HP-Deskjet', displayName: 'HP Deskjet', isDefault: true }]
    });
  }

  it('records every chosen option on the job and saves the sheet (success)', async () => {
    const job = await service(okAdapter).print(request(eventId));
    expect(job.status).toBe('completed');
    expect(job.printerName).toBe('HP-Deskjet');
    expect(job.method).toBe('image');
    expect(job.copies).toBe(3);
    expect(job.paperSize).toBe('4x6');
    expect(job.layout).toBe('2-up');
    expect(job.orientation).toBe('portrait');
    expect(JSON.parse(job.sheetSessions as string)).toEqual(['sess-1']);
    expect(existsSync(storage.toAbsolute(job.printSheetPath))).toBe(true);
  });

  it('a failed print keeps the saved sheet and records the error', async () => {
    const job = await service(failAdapter).print(request(eventId, { method: 'windows' }));
    expect(job.status).toBe('failed');
    expect(job.errorCode).toBe('PRINT_SEND_FAILED');
    expect(job.errorMessage).toBeTruthy();
    expect(existsSync(storage.toAbsolute(job.printSheetPath))).toBe(true); // NOT deleted
  });

  it('reprint creates a NEW job linked to the same session', async () => {
    const svc = service(okAdapter);
    const a = await svc.print(request(eventId));
    const b = await svc.print(request(eventId));
    expect(a.id).not.toBe(b.id);
    expect(a.sessionId).toBe('sess-1');
    expect(b.sessionId).toBe('sess-1');
    expect(svc.listJobs(eventId)).toHaveLength(2);
  });

  it('retry re-attempts a failed job to success', async () => {
    // First fail, then build a service that succeeds and retry the same job.
    const failed = await service(failAdapter).print(request(eventId, { method: 'windows' }));
    expect(failed.status).toBe('failed');
    const retried = await service(okAdapter).retry(failed.id);
    expect(retried.id).toBe(failed.id);
    expect(retried.status).toBe('completed');
    expect(retried.errorCode).toBeNull();
  });

  it('lists printers and validates a printer name', async () => {
    const svc = service(okAdapter);
    expect((await svc.listPrinters()).length).toBe(1);
    expect(await svc.testPrinter('HP-Deskjet')).toBe(true);
    expect(await svc.testPrinter('Nope')).toBe(false);
  });
});
