import { mkdtempSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { openNodeSqlite } from '../helpers/nodeSqlite';
import { runMigrations } from '../../src/main/services/database/migrate';
import { createRepositories } from '../../src/main/services/database/repositories';
import { StorageService } from '../../src/main/services/storage/StorageService';
import { TemplateService } from '../../src/main/services/templates/TemplateService';
import { validateTemplate } from '../../src/main/services/templates/validateTemplate';
import type { Db } from '../../src/main/services/database/types';
import type { TemplateSlotInput } from '../../src/shared/types/templates';

/** Minimal valid PNG header (image-size reads width/height from the IHDR). */
function makePng(width: number, height: number): Buffer {
  const buf = Buffer.alloc(24);
  buf.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  buf.writeUInt32BE(13, 8);
  buf.write('IHDR', 12, 'ascii');
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  return buf;
}

function photoSlot(key: string, x: number, y: number): TemplateSlotInput {
  return { slotType: 'photo', slotKey: key, x, y, width: 400, height: 400, rotation: 0, zIndex: 1, fitMode: 'cover' };
}

describe('validateTemplate', () => {
  it('requires name, ≥2 photo slots, valid sizes and in-canvas placement', () => {
    expect(validateTemplate('', 1000, 1000, [photoSlot('photo_1', 0, 0)]).valid).toBe(false);
    expect(validateTemplate('T', 1000, 1000, [photoSlot('photo_1', 0, 0)]).valid).toBe(false);
    const ok = validateTemplate('T', 1000, 1000, [photoSlot('photo_1', 0, 0), photoSlot('photo_2', 0, 500)]);
    expect(ok.valid).toBe(true);
    const dup = validateTemplate('T', 1000, 1000, [photoSlot('p', 0, 0), photoSlot('p', 0, 500)]);
    expect(dup.valid).toBe(false);
    const outside = validateTemplate('T', 1000, 1000, [photoSlot('photo_1', 0, 0), photoSlot('photo_2', 900, 900)]);
    expect(outside.valid).toBe(false);
  });
});

describe('TemplateService', () => {
  let dir: string;
  let db: Db;
  let service: TemplateService;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'pbs-tpl-'));
    db = openNodeSqlite();
    runMigrations(db);
    const storage = new StorageService(dir);
    storage.ensureStructure();
    service = new TemplateService(createRepositories(db), storage, db);
  });

  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  async function importBase(): Promise<string> {
    const src = join(dir, 'base.png');
    writeFileSync(src, makePng(1200, 1800));
    const tpl = await service.createFromImage(src);
    return tpl.id;
  }

  it('imports a base image with correct dimensions and a stored copy', async () => {
    const id = await importBase();
    const { template } = service.getWithSlots(id);
    expect(template.widthPx).toBe(1200);
    expect(template.heightPx).toBe(1800);
    expect(template.baseImagePath).toContain(`templates/template_${id}/template.png`);
    expect(existsSync(join(dir, template.baseImagePath as string))).toBe(true);
    expect(service.getImageDataUrl(id)).toMatch(/^data:image\/png;base64,/);
  });

  it('saves slots, writes template.json, and rejects invalid templates', async () => {
    const id = await importBase();
    const slots = [photoSlot('photo_1', 100, 100), photoSlot('photo_2', 100, 700)];
    const saved = await service.save(id, { name: 'XV Vertical', formatLabel: 'vertical_strip', slots });
    expect(saved.slots).toHaveLength(2);
    expect(existsSync(join(dir, `templates/template_${id}/template.json`))).toBe(true);

    await expect(
      service.save(id, { name: 'X', formatLabel: null, slots: [photoSlot('only', 0, 0)] })
    ).rejects.toThrow();
  });

  it('duplicates a template with its slots', async () => {
    const id = await importBase();
    await service.save(id, {
      name: 'Original',
      formatLabel: null,
      slots: [photoSlot('photo_1', 0, 0), photoSlot('photo_2', 0, 700)]
    });
    const copy = await service.duplicate(id);
    expect(copy.id).not.toBe(id);
    expect(copy.name).toContain('(copia)');
    expect(service.getWithSlots(copy.id).slots).toHaveLength(2);
  });

  it('deletes a template: removes slots, row, on-disk folder', async () => {
    const id = await importBase();
    await service.save(id, {
      name: 'Borrable',
      formatLabel: null,
      slots: [photoSlot('photo_1', 0, 0), photoSlot('photo_2', 0, 700)]
    });
    expect(existsSync(join(dir, `templates/template_${id}`))).toBe(true);

    const result = await service.delete(id);
    expect(result.affectedEvents).toBe(0);
    expect(existsSync(join(dir, `templates/template_${id}`))).toBe(false);
    expect(service.list().some((t) => t.id === id)).toBe(false);
    expect(() => service.getWithSlots(id)).toThrow();
  });

  it('clears the template reference from events on delete', async () => {
    const id = await importBase();
    await service.save(id, {
      name: 'Asignada',
      formatLabel: null,
      slots: [photoSlot('photo_1', 0, 0), photoSlot('photo_2', 0, 700)]
    });
    db.prepare(
      "INSERT INTO events (id, name, event_type, template_id, status, created_at, updated_at) VALUES ('ev1','Boda','wedding',?,'active','2026-01-01','2026-01-01')"
    ).run(id);

    const result = await service.delete(id);
    expect(result.affectedEvents).toBe(1);
    const ev = db.prepare("SELECT template_id FROM events WHERE id = 'ev1'").get() as {
      template_id: string | null;
    };
    expect(ev.template_id).toBeNull();
  });

  it('round-trips export → import', async () => {
    const id = await importBase();
    await service.save(id, {
      name: 'Exportable',
      formatLabel: 'vertical_strip',
      slots: [
        photoSlot('photo_1', 50, 50),
        photoSlot('photo_2', 50, 700),
        { slotType: 'qr', slotKey: 'qr_1', x: 900, y: 1600, width: 180, height: 180, rotation: 0, zIndex: 2, fitMode: 'contain' }
      ]
    });
    const zipPath = join(dir, 'export.zip');
    await service.exportTemplate(id, zipPath);
    expect(existsSync(zipPath)).toBe(true);

    const imported = await service.importTemplate(zipPath);
    expect(imported.id).not.toBe(id);
    expect(imported.widthPx).toBe(1200);
    expect(imported.heightPx).toBe(1800);
    const { slots } = service.getWithSlots(imported.id);
    expect(slots).toHaveLength(3);
    expect(slots.some((s) => s.slotType === 'qr')).toBe(true);
  });
});
