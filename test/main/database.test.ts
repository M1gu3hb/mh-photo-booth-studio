import { describe, it, expect } from 'vitest';
import { openNodeSqlite } from '../helpers/nodeSqlite';
import { runMigrations, getCurrentSchemaVersion } from '../../src/main/services/database/migrate';
import { createRepositories } from '../../src/main/services/database/repositories';
import { seedPosePacks } from '../../src/main/services/database/seed';
import { SettingsService } from '../../src/main/services/settings/SettingsService';

const ALL_TABLES = [
  'events',
  'templates',
  'template_slots',
  'sessions',
  'session_photos',
  'session_outputs',
  'print_jobs',
  'print_templates',
  'print_template_slots',
  'settings',
  'pose_packs',
  'poses',
  'qr_links',
  'videos',
  'web_uploads',
  'video_templates'
];

function setup() {
  const db = openNodeSqlite();
  runMigrations(db);
  return { db, repos: createRepositories(db) };
}

describe('migrations', () => {
  it('creates all core tables', () => {
    const db = openNodeSqlite();
    runMigrations(db);
    const rows = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as { name: string }[];
    const names = rows.map((r) => r.name);
    for (const table of ALL_TABLES) {
      expect(names).toContain(table);
    }
    db.close();
  });

  it('is idempotent (runs twice without error, stays at latest version)', () => {
    const db = openNodeSqlite();
    const first = runMigrations(db);
    expect(first).toBe(4);
    expect(runMigrations(db)).toBe(4);
    expect(getCurrentSchemaVersion(db)).toBe(4);
    db.close();
  });
});

describe('BaseRepository (events)', () => {
  it('creates with id + timestamps and maps snake→camel', () => {
    const { repos } = setup();
    const event = repos.events.create({
      name: 'XV Demo',
      eventType: 'xv',
      eventDate: null,
      clientReference: null,
      templateId: null,
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
    expect(event.id).toBeTruthy();
    expect(event.eventType).toBe('xv');
    expect(event.defaultPhotoCount).toBe(3);
    expect(event.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(event.updatedAt).toBe(event.createdAt);
  });

  it('updates, lists, counts and deletes', () => {
    const { repos } = setup();
    const event = repos.events.create({
      name: 'A',
      eventType: 'boda',
      eventDate: null,
      clientReference: null,
      templateId: null,
      defaultPhotoCount: 4,
      defaultCopies: 2,
      qrEnabled: 1,
      qrLink: 'https://example.com',
      status: 'active',
    enablePhotos: 1,
    enableVideos: 0,
    webUploadEnabled: 0,
    webEventFolio: null,
    videoTemplateId: null
    });
    const updated = repos.events.update(event.id, { name: 'B', defaultCopies: 3 });
    expect(updated.name).toBe('B');
    expect(updated.defaultCopies).toBe(3);
    expect(updated.eventType).toBe('boda');
    expect(repos.events.count()).toBe(1);
    expect(repos.events.list({ where: "status = ?", params: ['active'] })).toHaveLength(1);
    repos.events.delete(event.id);
    expect(repos.events.getById(event.id)).toBeNull();
    expect(repos.events.count()).toBe(0);
  });
});

describe('SettingsRepository', () => {
  it('upserts and reads key/values', () => {
    const { repos } = setup();
    expect(repos.settings.get('missing')).toBeNull();
    repos.settings.set('k', '1');
    expect(repos.settings.get('k')).toBe('1');
    repos.settings.set('k', '2');
    expect(repos.settings.get('k')).toBe('2');
    expect(repos.settings.getAll().k).toBe('2');
  });
});

describe('SettingsService', () => {
  it('ensures defaults and applies typed updates', () => {
    const { repos } = setup();
    const service = new SettingsService(repos.settings);
    service.ensureDefaults();
    expect(service.getValues()).toEqual({
      soundEnabled: true,
      fullscreenDefault: false,
      defaultCountdownSeconds: 3,
      language: 'es'
    });
    service.update({ soundEnabled: false, defaultCountdownSeconds: 5, fullscreenDefault: true });
    const values = service.getValues();
    expect(values.soundEnabled).toBe(false);
    expect(values.defaultCountdownSeconds).toBe(5);
    expect(values.fullscreenDefault).toBe(true);
  });
});

describe('seedPosePacks', () => {
  it('seeds 7 default packs with poses, idempotently', () => {
    const { db, repos } = setup();
    expect(seedPosePacks(db, repos)).toBe(true);
    expect(repos.posePacks.count()).toBe(7);

    const general = repos.posePacks.findDefault();
    expect(general?.name).toBe('General');
    expect(repos.poses.listByPack(general?.id ?? '').length).toBeGreaterThan(0);

    const xv = repos.posePacks.findByEventType('xv');
    expect(xv?.name).toBe('XV años');

    // Idempotent: second call seeds nothing.
    expect(seedPosePacks(db, repos)).toBe(false);
    expect(repos.posePacks.count()).toBe(7);
  });
});
