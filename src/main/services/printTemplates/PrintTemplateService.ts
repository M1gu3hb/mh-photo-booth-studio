import { randomUUID } from 'node:crypto';
import { AppError } from '@shared/errors/appError';
import type { PrintTemplateRecord, PrintTemplateSlotRecord } from '@shared/types/entities';
import type {
  PrintTemplateCreateInput,
  PrintTemplateSavePayload,
  PrintTemplateWithSlots
} from '@shared/types/printTemplates';
import type { Db } from '../database/types';
import type { Repositories } from '../database/repositories';

function ptError(code: string, userMessage: string, action: string): AppError {
  return new AppError({ code, message: userMessage, userMessage, action, severity: 'medium', module: 'print' });
}

/**
 * CRUD for per-event print templates (Fase 13). The record lives in
 * `print_templates`; manual slots (custom mode) live in `print_template_slots`
 * and are managed with raw SQL since that table has no timestamp columns.
 */
export class PrintTemplateService {
  private readonly repos: Repositories;
  private readonly db: Db;

  constructor(repos: Repositories, db: Db) {
    this.repos = repos;
    this.db = db;
  }

  list(eventId: string): PrintTemplateRecord[] {
    return this.repos.printTemplates.list({
      where: 'event_id = ?',
      params: [eventId],
      orderBy: 'updated_at DESC'
    });
  }

  getWithSlots(id: string): PrintTemplateWithSlots {
    const template = this.repos.printTemplates.getById(id);
    if (!template) {
      throw ptError('PRINT_TEMPLATE_MISSING', 'No se encontró la plantilla de impresión.', 'Actualiza la lista.');
    }
    const slots = this.readSlots(id);
    return { template, slots };
  }

  private readSlots(printTemplateId: string): PrintTemplateSlotRecord[] {
    const rows = this.db
      .prepare(
        'SELECT id, print_template_id, x, y, width, height, rotation, z_index FROM print_template_slots WHERE print_template_id = ? ORDER BY z_index ASC'
      )
      .all(printTemplateId) as Array<Record<string, number | string>>;
    return rows.map((r) => ({
      id: String(r.id),
      printTemplateId: String(r.print_template_id),
      x: Number(r.x),
      y: Number(r.y),
      width: Number(r.width),
      height: Number(r.height),
      rotation: Number(r.rotation),
      zIndex: Number(r.z_index)
    }));
  }

  create(eventId: string, input: PrintTemplateCreateInput): PrintTemplateRecord {
    if (!eventId) {
      throw ptError('INVALID_ARGUMENT', 'Falta el evento.', 'Selecciona un evento activo.');
    }
    return this.repos.printTemplates.create({
      id: randomUUID(),
      eventId,
      name: input.name.trim().slice(0, 90) || 'Plantilla de impresión',
      photoTemplateId: input.photoTemplateId,
      paperKey: input.paperKey,
      orientation: input.orientation,
      mode: input.mode,
      cellCount: Math.max(1, Math.floor(input.cellCount))
    });
  }

  save(id: string, payload: PrintTemplateSavePayload): PrintTemplateWithSlots {
    const existing = this.repos.printTemplates.getById(id);
    if (!existing) {
      throw ptError('PRINT_TEMPLATE_MISSING', 'La plantilla de impresión ya no existe.', 'Crea una nueva.');
    }
    this.db.transaction(() => {
      this.repos.printTemplates.update(id, {
        name: payload.name.trim().slice(0, 90) || 'Plantilla de impresión',
        photoTemplateId: payload.photoTemplateId,
        paperKey: payload.paperKey,
        orientation: payload.orientation,
        mode: payload.mode,
        cellCount: Math.max(1, Math.floor(payload.cellCount))
      });
      this.db.prepare('DELETE FROM print_template_slots WHERE print_template_id = ?').run(id);
      const insert = this.db.prepare(
        'INSERT INTO print_template_slots (id, print_template_id, x, y, width, height, rotation, z_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      );
      for (const slot of payload.slots) {
        insert.run(randomUUID(), id, slot.x, slot.y, slot.width, slot.height, slot.rotation, slot.zIndex);
      }
    });
    return this.getWithSlots(id);
  }

  delete(id: string): void {
    const existing = this.repos.printTemplates.getById(id);
    if (!existing) return;
    this.db.transaction(() => {
      this.db.prepare('DELETE FROM print_template_slots WHERE print_template_id = ?').run(id);
      this.repos.printTemplates.delete(id);
    });
  }
}
