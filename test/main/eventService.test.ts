import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { openNodeSqlite } from '../helpers/nodeSqlite';
import { runMigrations } from '../../src/main/services/database/migrate';
import { createRepositories, type Repositories } from '../../src/main/services/database/repositories';
import { StorageService } from '../../src/main/services/storage/StorageService';
import { EventService } from '../../src/main/services/events/EventService';
import type { Db } from '../../src/main/services/database/types';
import type { EventInput } from '../../src/shared/types/events';

function baseInput(over: Partial<EventInput> = {}): EventInput {
  return {
    name: 'XV Ana',
    eventType: 'xv',
    eventDate: '2026-07-01',
    clientReference: null,
    templateId: null,
    defaultPhotoCount: 3,
    defaultCopies: 2,
    qrEnabled: false,
    qrLink: null,
    ...over
  };
}

describe('EventService', () => {
  let dir: string;
  let db: Db;
  let repos: Repositories;
  let service: EventService;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'pbs-event-'));
    db = openNodeSqlite();
    runMigrations(db);
    repos = createRepositories(db);
    const storage = new StorageService(dir);
    storage.ensureStructure();
    service = new EventService(repos, storage);
  });

  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('creates event with folder, subfolders, event.json and sets it active', async () => {
    const event = await service.create(baseInput());
    expect(event.id).toBeTruthy();
    expect(event.qrEnabled).toBe(0);

    const eventDir = join(dir, 'events', `event_${event.id}`);
    expect(existsSync(eventDir)).toBe(true);
    for (const sub of ['originals', 'outputs', 'print_sheets', 'qr', 'exports']) {
      expect(existsSync(join(eventDir, sub))).toBe(true);
    }
    const json = JSON.parse(readFileSync(join(eventDir, 'event.json'), 'utf-8')) as { id: string };
    expect(json.id).toBe(event.id);

    expect(service.getActive()?.id).toBe(event.id);
  });

  it('rejects invalid input', async () => {
    await expect(service.create(baseInput({ name: '   ' }))).rejects.toThrow();
    await expect(service.create(baseInput({ defaultPhotoCount: 5 }))).rejects.toThrow();
    await expect(service.create(baseInput({ defaultCopies: 0 }))).rejects.toThrow();
    await expect(service.create(baseInput({ qrEnabled: true, qrLink: null }))).rejects.toThrow();
    await expect(service.create(baseInput({ qrEnabled: true, qrLink: 'not-a-url' }))).rejects.toThrow();
  });

  it('updates and re-reads every field', async () => {
    const event = await service.create(baseInput());
    const updated = await service.update(
      event.id,
      baseInput({
        name: 'XV Ana Paula',
        defaultCopies: 4,
        defaultPhotoCount: 4,
        qrEnabled: true,
        qrLink: 'https://drive.example.com/gallery'
      })
    );
    expect(updated.name).toBe('XV Ana Paula');
    expect(updated.defaultCopies).toBe(4);
    expect(updated.defaultPhotoCount).toBe(4);
    expect(updated.qrEnabled).toBe(1);
    expect(updated.qrLink).toBe('https://drive.example.com/gallery');

    const reread = repos.events.getById(event.id);
    expect(reread?.name).toBe('XV Ana Paula');
  });

  it('lists active events and archiving clears the active selection', async () => {
    const a = await service.create(baseInput({ name: 'Evento A' }));
    await service.create(baseInput({ name: 'Evento B' }));
    expect(service.list()).toHaveLength(2);

    service.setActive(a.id);
    expect(service.getActive()?.id).toBe(a.id);

    service.archive(a.id);
    expect(service.getActive()).toBeNull();
    expect(service.list()).toHaveLength(1);
  });
});
