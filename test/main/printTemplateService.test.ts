import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { openNodeSqlite } from '../helpers/nodeSqlite';
import { runMigrations } from '../../src/main/services/database/migrate';
import { createRepositories } from '../../src/main/services/database/repositories';
import { PrintTemplateService } from '../../src/main/services/printTemplates/PrintTemplateService';
import type { Db } from '../../src/main/services/database/types';

function insertEvent(db: Db, id: string): void {
  db.prepare(
    "INSERT INTO events (id, name, event_type, status, created_at, updated_at) VALUES (?, 'Boda', 'wedding', 'active', '2026-01-01', '2026-01-01')"
  ).run(id);
}

describe('PrintTemplateService', () => {
  let db: Db;
  let service: PrintTemplateService;

  beforeEach(() => {
    db = openNodeSqlite();
    runMigrations(db);
    service = new PrintTemplateService(createRepositories(db), db);
    insertEvent(db, 'ev1');
  });

  afterEach(() => db.close());

  it('creates a grid print template scoped to an event', () => {
    const tpl = service.create('ev1', {
      name: 'Tiras 8',
      photoTemplateId: 'tpl-photo-1',
      paperKey: '4x6',
      orientation: 'portrait',
      mode: 'grid',
      cellCount: 8
    });
    expect(tpl.eventId).toBe('ev1');
    expect(tpl.mode).toBe('grid');
    expect(tpl.cellCount).toBe(8);
    expect(service.list('ev1')).toHaveLength(1);
    expect(service.list('other-event')).toHaveLength(0);
  });

  it('saves custom slots and reads them back ordered by z-index', () => {
    const tpl = service.create('ev1', {
      name: 'Custom',
      photoTemplateId: null,
      paperKey: 'letter',
      orientation: 'portrait',
      mode: 'custom',
      cellCount: 2
    });
    const saved = service.save(tpl.id, {
      name: 'Custom 2 tiras',
      photoTemplateId: 'tpl-photo-1',
      paperKey: 'letter',
      orientation: 'portrait',
      mode: 'custom',
      cellCount: 2,
      slots: [
        { x: 0.05, y: 0.05, width: 0.4, height: 0.9, rotation: 0, zIndex: 1 },
        { x: 0.55, y: 0.05, width: 0.4, height: 0.9, rotation: 0, zIndex: 0 }
      ]
    });
    expect(saved.template.name).toBe('Custom 2 tiras');
    expect(saved.template.photoTemplateId).toBe('tpl-photo-1');
    expect(saved.slots).toHaveLength(2);
    expect(saved.slots[0]?.zIndex).toBe(0); // ordered by z-index asc
    expect(saved.slots[0]?.x).toBeCloseTo(0.55, 5);
  });

  it('deletes a print template and its slots', () => {
    const tpl = service.create('ev1', {
      name: 'Borrable',
      photoTemplateId: null,
      paperKey: '4x6',
      orientation: 'portrait',
      mode: 'custom',
      cellCount: 1
    });
    service.save(tpl.id, {
      name: 'Borrable',
      photoTemplateId: null,
      paperKey: '4x6',
      orientation: 'portrait',
      mode: 'custom',
      cellCount: 1,
      slots: [{ x: 0, y: 0, width: 1, height: 1, rotation: 0, zIndex: 0 }]
    });
    service.delete(tpl.id);
    expect(service.list('ev1')).toHaveLength(0);
    const slotCount = db
      .prepare('SELECT COUNT(*) AS n FROM print_template_slots WHERE print_template_id = ?')
      .get(tpl.id) as { n: number };
    expect(slotCount.n).toBe(0);
  });

  it('throws a friendly error when getting an unknown template', () => {
    expect(() => service.getWithSlots('nope')).toThrow();
  });
});
