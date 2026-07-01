import { mkdtempSync, rmSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { openNodeSqlite } from '../helpers/nodeSqlite';
import { runMigrations } from '../../src/main/services/database/migrate';
import { createRepositories, type Repositories } from '../../src/main/services/database/repositories';
import { StorageService } from '../../src/main/services/storage/StorageService';
import { BackupService } from '../../src/main/services/backup/BackupService';
import type { Db } from '../../src/main/services/database/types';

describe('BackupService event round-trip', () => {
  let dir: string;
  let db: Db;
  let repos: Repositories;
  let storage: StorageService;
  let service: BackupService;
  let eventId: string;
  let sessionId: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'pbs-backup-'));
    db = openNodeSqlite();
    runMigrations(db);
    repos = createRepositories(db);
    storage = new StorageService(dir);
    storage.ensureStructure();
    service = new BackupService(repos, storage);

    const event = repos.events.create({
      name: 'Boda Demo',
      eventType: 'boda',
      eventDate: null,
      clientReference: null,
      templateId: null,
      defaultPhotoCount: 2,
      defaultCopies: 1,
      qrEnabled: 0,
      qrLink: null,
      status: 'active',
    enablePhotos: 1,
    enableVideos: 0,
    webUploadEnabled: 0,
    webEventFolio: null,
    videoTemplateId: null
    });
    eventId = event.id;
    const session = repos.sessions.create({
      eventId,
      templateId: 'tpl-x',
      photoCount: 2,
      status: 'completed',
      finalOutputPath: `events/event_${eventId}/outputs/session_PLACEHOLDER/final.png`,
      thumbnailPath: `events/event_${eventId}/outputs/session_PLACEHOLDER/thumbnail.jpg`,
      notes: null
    });
    sessionId = session.id;
    // Fix the placeholder paths to the real session id.
    repos.sessions.update(sessionId, {
      finalOutputPath: `events/event_${eventId}/outputs/session_${sessionId}/final.png`,
      thumbnailPath: `events/event_${eventId}/outputs/session_${sessionId}/thumbnail.jpg`
    });
    repos.sessionPhotos.create({
      sessionId,
      photoIndex: 0,
      originalPath: `events/event_${eventId}/originals/session_${sessionId}/photo_01.jpg`,
      processedPath: null,
      widthPx: 800,
      heightPx: 600
    });
    repos.sessionOutputs.create({
      sessionId,
      outputType: 'strip',
      filePath: `events/event_${eventId}/outputs/session_${sessionId}/final.png`,
      widthPx: 600,
      heightPx: 900,
      format: 'png'
    });

    // Create real files on disk.
    const orig = join(dir, 'events', `event_${eventId}`, 'originals', `session_${sessionId}`);
    const out = join(dir, 'events', `event_${eventId}`, 'outputs', `session_${sessionId}`);
    mkdirSync(orig, { recursive: true });
    mkdirSync(out, { recursive: true });
    writeFileSync(join(orig, 'photo_01.jpg'), Buffer.from([0xff, 0xd8, 1, 2, 3]));
    writeFileSync(join(out, 'final.png'), Buffer.from([0x89, 0x50, 4, 5, 6]));
    writeFileSync(join(out, 'thumbnail.jpg'), Buffer.from([0xff, 0xd8, 7, 8]));
  });

  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('exports an event to a zip and imports it as a new event with files + rows', () => {
    const zipPath = join(dir, 'event.zip');
    service.exportEvent(eventId, zipPath);
    expect(existsSync(zipPath)).toBe(true);

    const imported = service.importEvent(zipPath);
    expect(imported.id).not.toBe(eventId);
    expect(imported.name).toContain('(importado)');
    expect(imported.eventType).toBe('boda');

    const sessions = repos.sessions.list({ where: 'event_id = ?', params: [imported.id] });
    expect(sessions).toHaveLength(1);
    const newSession = sessions[0]!;
    expect(newSession.id).not.toBe(sessionId);

    // Paths remapped to the new ids.
    expect(newSession.finalOutputPath).toContain(`event_${imported.id}`);
    expect(newSession.finalOutputPath).toContain(`session_${newSession.id}`);

    // Photos + outputs restored.
    expect(repos.sessionPhotos.list({ where: 'session_id = ?', params: [newSession.id] })).toHaveLength(1);
    expect(repos.sessionOutputs.list({ where: 'session_id = ?', params: [newSession.id] })).toHaveLength(1);

    // Files copied into the new event folder.
    expect(existsSync(join(dir, newSession.finalOutputPath as string))).toBe(true);
    const newOrig = join(dir, 'events', `event_${imported.id}`, 'originals', `session_${newSession.id}`, 'photo_01.jpg');
    expect(existsSync(newOrig)).toBe(true);
  });
});
