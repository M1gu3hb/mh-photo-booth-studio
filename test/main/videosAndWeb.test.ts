import { mkdtempSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { openNodeSqlite } from '../helpers/nodeSqlite';
import { runMigrations } from '../../src/main/services/database/migrate';
import { createRepositories, type Repositories } from '../../src/main/services/database/repositories';
import { StorageService } from '../../src/main/services/storage/StorageService';
import { VideoService } from '../../src/main/services/videos/VideoService';
import { VideoTemplateService } from '../../src/main/services/videos/VideoTemplateService';
import type { Db } from '../../src/main/services/database/types';

function insertEvent(db: Db, id: string): void {
  db.prepare(
    "INSERT INTO events (id, name, event_type, status, created_at, updated_at) VALUES (?, 'Boda', 'wedding', 'active', '2026-01-01', '2026-01-01')"
  ).run(id);
}

describe('VideoService + VideoTemplateService (Fase 17)', () => {
  let dir: string;
  let db: Db;
  let repos: Repositories;
  let videos: VideoService;
  let videoTemplates: VideoTemplateService;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'pbs-vid-'));
    db = openNodeSqlite();
    runMigrations(db);
    repos = createRepositories(db);
    const storage = new StorageService(dir);
    storage.ensureStructure();
    videos = new VideoService(repos, storage);
    videoTemplates = new VideoTemplateService(repos);
    insertEvent(db, 'ev1');
  });

  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('saves a recorded clip to the event folder and lists it', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]).buffer;
    const video = await videos.saveRecorded('ev1', bytes, 'webm', 4200);
    expect(video.eventId).toBe('ev1');
    expect(video.source).toBe('recorded');
    expect(video.durationMs).toBe(4200);
    expect(existsSync(join(dir, video.filePath))).toBe(true);
    expect(videos.list('ev1')).toHaveLength(1);
    expect(videos.getDataUrl(video.id)).toMatch(/^data:video\/webm;base64,/);
  });

  it('imports an existing mp4 file', async () => {
    const src = join(dir, 'clip.mp4');
    writeFileSync(src, Buffer.from([0, 0, 0, 24]));
    const video = await videos.importFromPath('ev1', src);
    expect(video.source).toBe('imported');
    expect(video.filePath.endsWith('.mp4')).toBe(true);
    expect(existsSync(join(dir, video.filePath))).toBe(true);
  });

  it('rejects empty recordings and unsupported formats', async () => {
    await expect(videos.saveRecorded('ev1', new ArrayBuffer(0), 'webm', null)).rejects.toThrow();
    const bad = join(dir, 'raro.avi');
    writeFileSync(bad, Buffer.from([1]));
    await expect(videos.importFromPath('ev1', bad)).rejects.toThrow();
  });

  it('video template CRUD + clears event reference on delete', () => {
    const tpl = videoTemplates.create({
      name: 'Logo dorado',
      config: {
        items: [
          {
            kind: 'text',
            id: 't1',
            text: 'Generación 2026',
            x: 0.1,
            y: 0.1,
            size: 0.08,
            font: 'display',
            color: '#e8ce84',
            opacity: 1
          }
        ]
      }
    });
    expect(videoTemplates.list()).toHaveLength(1);
    const saved = videoTemplates.save(tpl.id, { name: 'Logo 2', config: { items: [] } });
    expect(saved.name).toBe('Logo 2');

    db.prepare('UPDATE events SET video_template_id = ? WHERE id = ?').run(tpl.id, 'ev1');
    videoTemplates.delete(tpl.id, db);
    expect(videoTemplates.list()).toHaveLength(0);
    const ev = db.prepare("SELECT video_template_id FROM events WHERE id = 'ev1'").get() as {
      video_template_id: string | null;
    };
    expect(ev.video_template_id).toBeNull();
  });

  it('web_uploads table stores the publish queue rows', () => {
    const row = repos.webUploads.create({
      eventId: 'ev1',
      sessionId: null,
      videoId: 'v1',
      mediaType: 'video',
      folio: null,
      pageUrl: null,
      mediaUrl: null,
      status: 'pending',
      errorMessage: null
    });
    expect(row.status).toBe('pending');
    repos.webUploads.update(row.id, { status: 'done', folio: 'MH-TEST-0001' });
    const done = repos.webUploads.list({ where: "status = 'done'" });
    expect(done).toHaveLength(1);
    expect(done[0]?.folio).toBe('MH-TEST-0001');
  });
});
