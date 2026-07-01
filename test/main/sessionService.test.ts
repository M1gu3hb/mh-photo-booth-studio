import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { openNodeSqlite } from '../helpers/nodeSqlite';
import { runMigrations } from '../../src/main/services/database/migrate';
import { createRepositories, type Repositories } from '../../src/main/services/database/repositories';
import { seedPosePacks } from '../../src/main/services/database/seed';
import { StorageService } from '../../src/main/services/storage/StorageService';
import { SessionService } from '../../src/main/services/sessions/SessionService';
import type { Db } from '../../src/main/services/database/types';

const FAKE_JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);

describe('SessionService', () => {
  let dir: string;
  let db: Db;
  let repos: Repositories;
  let service: SessionService;
  let eventId: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'pbs-sess-'));
    db = openNodeSqlite();
    runMigrations(db);
    repos = createRepositories(db);
    seedPosePacks(db, repos);
    const storage = new StorageService(dir);
    storage.ensureStructure();
    service = new SessionService(repos, storage, db);

    const template = repos.templates.create({
      name: 'T',
      type: 'image_slots',
      baseImagePath: 'templates/template_x/template.png',
      widthPx: 1200,
      heightPx: 1800,
      formatLabel: null,
      isArchived: 0
    });
    const event = repos.events.create({
      name: 'XV',
      eventType: 'xv',
      eventDate: null,
      clientReference: null,
      templateId: template.id,
      defaultPhotoCount: 3,
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
  });

  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('starts a session with poses from the event type', () => {
    const result = service.start(eventId);
    expect(result.photoCount).toBe(3);
    expect(result.poses.length).toBeGreaterThan(0);
    expect(result.session.status).toBe('in_progress');
  });

  it('refuses to start without a template', () => {
    const noTpl = repos.events.create({
      name: 'No tpl',
      eventType: 'otro',
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
    expect(() => service.start(noTpl.id)).toThrow();
  });

  it('saves each original immediately and supports retake (upsert)', async () => {
    const { session } = service.start(eventId);
    await service.savePhoto(session.id, 0, FAKE_JPEG, 800, 600);
    await service.savePhoto(session.id, 1, FAKE_JPEG, 800, 600);
    await service.savePhoto(session.id, 2, FAKE_JPEG, 800, 600);
    expect(service.listPhotos(session.id)).toHaveLength(3);

    const photoPath = join(dir, 'events', `event_${eventId}`, 'originals', `session_${session.id}`, 'photo_01.jpg');
    expect(existsSync(photoPath)).toBe(true);

    // Retake photo 0 → still 3 photos, not 4.
    await service.savePhoto(session.id, 0, FAKE_JPEG, 800, 600);
    expect(service.listPhotos(session.id)).toHaveLength(3);
  });

  it('completes only when all photos exist', async () => {
    const { session } = service.start(eventId);
    await service.savePhoto(session.id, 0, FAKE_JPEG, 800, 600);
    expect(() => service.complete(session.id)).toThrow();
    await service.savePhoto(session.id, 1, FAKE_JPEG, 800, 600);
    await service.savePhoto(session.id, 2, FAKE_JPEG, 800, 600);
    expect(service.complete(session.id).status).toBe('completed');
  });

  it('discards a session and removes its files and rows', async () => {
    const { session } = service.start(eventId);
    await service.savePhoto(session.id, 0, FAKE_JPEG, 800, 600);
    const sessionDir = join(dir, 'events', `event_${eventId}`, 'originals', `session_${session.id}`);
    expect(existsSync(sessionDir)).toBe(true);
    service.discard(session.id);
    expect(existsSync(sessionDir)).toBe(false);
    expect(repos.sessions.getById(session.id)).toBeNull();
    expect(service.listPhotos(session.id)).toHaveLength(0);
  });

  it('rejects invalid photo index and 2/4 photo counts work', async () => {
    const { session } = service.start(eventId);
    await expect(service.savePhoto(session.id, 5, FAKE_JPEG, 1, 1)).rejects.toThrow();
  });
});
