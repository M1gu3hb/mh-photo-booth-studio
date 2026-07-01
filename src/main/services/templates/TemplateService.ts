import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { extname, basename, join } from 'node:path';
import AdmZip from 'adm-zip';
import imageSize from 'image-size';
import { AppError } from '@shared/errors/appError';
import type { TemplateRecord, TemplateSlotRecord } from '@shared/types/entities';
import type {
  TemplateSavePayload,
  TemplateWithSlots,
  TemplateValidation,
  TemplateSlotInput
} from '@shared/types/templates';
import type { Db } from '../database/types';
import type { Repositories } from '../database/repositories';
import type { StorageService } from '../storage/StorageService';
import { validateTemplate } from './validateTemplate';

const ALLOWED_EXT = ['.png', '.jpg', '.jpeg'] as const;

function mimeFor(ext: string): string {
  return ext.toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
}

function templateError(code: string, userMessage: string, action: string, message = userMessage): AppError {
  return new AppError({ code, message, userMessage, action, severity: 'medium', module: 'template' });
}

export class TemplateService {
  private readonly repos: Repositories;
  private readonly storage: StorageService;
  private readonly db: Db;

  constructor(repos: Repositories, storage: StorageService, db: Db) {
    this.repos = repos;
    this.storage = storage;
    this.db = db;
  }

  private templateDir(id: string): string {
    return `templates/template_${id}`;
  }

  list(): TemplateRecord[] {
    return this.repos.templates.list({ where: 'is_archived = 0', orderBy: 'updated_at DESC' });
  }

  getWithSlots(id: string): TemplateWithSlots {
    const template = this.repos.templates.getById(id);
    if (!template) {
      throw templateError(
        'TEMPLATE_FILE_MISSING',
        'No se encontró la plantilla.',
        'Vuelve a cargar la plantilla o selecciona otra.'
      );
    }
    const slots = this.repos.templateSlots.list({
      where: 'template_id = ?',
      params: [id],
      orderBy: 'z_index ASC'
    });
    return { template, slots };
  }

  getImageDataUrl(id: string): string {
    const template = this.repos.templates.getById(id);
    if (!template?.baseImagePath) {
      throw templateError(
        'TEMPLATE_FILE_MISSING',
        'La plantilla no tiene imagen base.',
        'Vuelve a importar la imagen.'
      );
    }
    const abs = this.storage.toAbsolute(template.baseImagePath);
    if (!existsSync(abs)) {
      throw templateError(
        'TEMPLATE_FILE_MISSING',
        'No se encontró el archivo de la plantilla.',
        'Vuelve a cargar la plantilla o selecciona otra.'
      );
    }
    const buffer = readFileSync(abs);
    return `data:${mimeFor(extname(abs))};base64,${buffer.toString('base64')}`;
  }

  /** Imports a base image and creates a slot-less draft template. */
  async createFromImage(sourcePath: string): Promise<TemplateRecord> {
    const ext = extname(sourcePath).toLowerCase();
    if (!(ALLOWED_EXT as readonly string[]).includes(ext)) {
      throw templateError(
        'TEMPLATE_INVALID',
        'Formato no soportado. Usa PNG o JPG.',
        'Selecciona una imagen PNG o JPG.'
      );
    }
    if (!existsSync(sourcePath)) {
      throw templateError('TEMPLATE_FILE_MISSING', 'No se encontró la imagen.', 'Selecciona otra imagen.');
    }

    const buffer = readFileSync(sourcePath);
    const dims = imageSize(buffer);
    if (!dims.width || !dims.height) {
      throw templateError(
        'TEMPLATE_INVALID',
        'No se pudieron leer las dimensiones de la imagen.',
        'Usa una imagen PNG o JPG válida.'
      );
    }

    const id = randomUUID();
    const relImage = `${this.templateDir(id)}/template${ext === '.jpeg' ? '.jpg' : ext}`;
    await this.storage.safeWrite(relImage, buffer);

    return this.repos.templates.create({
      id,
      name: basename(sourcePath, extname(sourcePath)).slice(0, 80) || 'Plantilla',
      type: 'image_slots',
      baseImagePath: relImage,
      widthPx: dims.width,
      heightPx: dims.height,
      formatLabel: null,
      isArchived: 0
    });
  }

  validate(id: string, payload: TemplateSavePayload): TemplateValidation {
    const template = this.repos.templates.getById(id);
    if (!template) {
      return { valid: false, errors: ['La plantilla ya no existe.'] };
    }
    return validateTemplate(payload.name, template.widthPx, template.heightPx, payload.slots);
  }

  async save(id: string, payload: TemplateSavePayload): Promise<TemplateWithSlots> {
    const template = this.repos.templates.getById(id);
    if (!template) {
      throw templateError('TEMPLATE_FILE_MISSING', 'La plantilla ya no existe.', 'Crea una nueva plantilla.');
    }

    const validation = validateTemplate(payload.name, template.widthPx, template.heightPx, payload.slots);
    if (!validation.valid) {
      throw templateError(
        'TEMPLATE_INVALID',
        'La plantilla está incompleta.',
        validation.errors.join(' '),
        validation.errors.join(' ')
      );
    }

    this.db.transaction(() => {
      this.repos.templates.update(id, {
        name: payload.name.trim(),
        formatLabel: payload.formatLabel
      });
      this.db.prepare('DELETE FROM template_slots WHERE template_id = ?').run(id);
      for (const slot of payload.slots) {
        this.repos.templateSlots.create({
          templateId: id,
          slotType: slot.slotType,
          slotKey: slot.slotKey,
          x: slot.x,
          y: slot.y,
          width: slot.width,
          height: slot.height,
          rotation: slot.rotation,
          zIndex: slot.zIndex,
          fitMode: slot.fitMode
        });
      }
    });

    await this.writeTemplateJson(id);
    return this.getWithSlots(id);
  }

  /**
   * Permanently deletes a template: its slots (cascade), DB row and on-disk
   * folder. Clears the reference from any event that had it selected (those
   * events keep their sessions/outputs; they simply need a template reselected).
   * Returns how many events were un-assigned so the UI can warn.
   */
  async delete(id: string): Promise<{ affectedEvents: number }> {
    const template = this.repos.templates.getById(id);
    if (!template) {
      throw templateError('TEMPLATE_FILE_MISSING', 'La plantilla ya no existe.', 'Actualiza la lista.');
    }
    let affectedEvents = 0;
    this.db.transaction(() => {
      affectedEvents = this.db
        .prepare('UPDATE events SET template_id = NULL WHERE template_id = ?')
        .run(id).changes;
      this.db.prepare('DELETE FROM template_slots WHERE template_id = ?').run(id);
      this.db.prepare('DELETE FROM templates WHERE id = ?').run(id);
    });
    await this.storage.removeDir(this.templateDir(id)).catch(() => undefined);
    return { affectedEvents };
  }

  async duplicate(id: string): Promise<TemplateRecord> {
    const { template, slots } = this.getWithSlots(id);
    if (!template.baseImagePath) {
      throw templateError('TEMPLATE_FILE_MISSING', 'La plantilla no tiene imagen base.', 'Vuelve a importarla.');
    }
    const srcAbs = this.storage.toAbsolute(template.baseImagePath);
    const ext = extname(srcAbs);
    const newId = randomUUID();
    const relImage = `${this.templateDir(newId)}/template${ext}`;
    await this.storage.safeWrite(relImage, readFileSync(srcAbs));

    const copy = this.repos.templates.create({
      id: newId,
      name: `${template.name} (copia)`.slice(0, 90),
      type: template.type,
      baseImagePath: relImage,
      widthPx: template.widthPx,
      heightPx: template.heightPx,
      formatLabel: template.formatLabel,
      isArchived: 0
    });
    for (const slot of slots) {
      this.repos.templateSlots.create({
        templateId: copy.id,
        slotType: slot.slotType,
        slotKey: slot.slotKey,
        x: slot.x,
        y: slot.y,
        width: slot.width,
        height: slot.height,
        rotation: slot.rotation,
        zIndex: slot.zIndex,
        fitMode: slot.fitMode
      });
    }
    await this.writeTemplateJson(copy.id);
    return copy;
  }

  /** Bundles template image + json (+ preview/thumbnail if present) into a zip. */
  async exportTemplate(id: string, destPath: string): Promise<string> {
    const { template } = this.getWithSlots(id);
    if (!template.baseImagePath) {
      throw templateError('TEMPLATE_FILE_MISSING', 'La plantilla no tiene imagen base.', 'Vuelve a importarla.');
    }
    await this.writeTemplateJson(id);
    const dirAbs = this.storage.toAbsolute(this.templateDir(id));
    const imageAbs = this.storage.toAbsolute(template.baseImagePath);
    const ext = extname(imageAbs);

    const zip = new AdmZip();
    zip.addLocalFile(imageAbs, '', `template${ext}`);
    zip.addLocalFile(join(dirAbs, 'template.json'));
    for (const optional of ['preview.png', 'thumbnail.png']) {
      if (existsSync(join(dirAbs, optional))) {
        zip.addLocalFile(join(dirAbs, optional));
      }
    }
    zip.writeZip(destPath);
    return destPath;
  }

  /** Recreates a template (new id) from an exported zip. */
  async importTemplate(zipPath: string): Promise<TemplateRecord> {
    if (!existsSync(zipPath)) {
      throw templateError('TEMPLATE_FILE_MISSING', 'No se encontró el archivo.', 'Selecciona un .zip válido.');
    }
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();
    const jsonEntry = entries.find((e) => e.entryName.endsWith('template.json'));
    const imageEntry = entries.find((e) => /template\.(png|jpe?g)$/i.test(e.entryName));
    if (!jsonEntry || !imageEntry) {
      throw templateError(
        'TEMPLATE_INVALID',
        'El archivo no es una plantilla válida.',
        'Usa un .zip exportado por la app.'
      );
    }

    const parsed = JSON.parse(jsonEntry.getData().toString('utf-8')) as {
      name?: string;
      widthPx?: number;
      heightPx?: number;
      format?: string | null;
      slots?: Array<Record<string, unknown>>;
    };
    const imageBuffer = imageEntry.getData();
    const dims = imageSize(imageBuffer);
    const widthPx = parsed.widthPx && parsed.widthPx > 0 ? parsed.widthPx : (dims.width ?? 0);
    const heightPx = parsed.heightPx && parsed.heightPx > 0 ? parsed.heightPx : (dims.height ?? 0);
    if (!(widthPx > 0) || !(heightPx > 0)) {
      throw templateError('TEMPLATE_INVALID', 'La plantilla importada no tiene dimensiones.', 'Reexporta la plantilla.');
    }

    const id = randomUUID();
    const ext = extname(imageEntry.entryName).toLowerCase() === '.png' ? '.png' : '.jpg';
    const relImage = `${this.templateDir(id)}/template${ext}`;
    await this.storage.safeWrite(relImage, imageBuffer);

    const created = this.repos.templates.create({
      id,
      name: (parsed.name ?? 'Plantilla importada').slice(0, 90),
      type: 'image_slots',
      baseImagePath: relImage,
      widthPx,
      heightPx,
      formatLabel: parsed.format ?? null,
      isArchived: 0
    });

    for (const raw of parsed.slots ?? []) {
      const slot = raw as Record<string, unknown>;
      this.repos.templateSlots.create({
        templateId: created.id,
        slotType: (slot.type as TemplateSlotRecord['slotType']) ?? 'photo',
        slotKey: String(slot.key ?? slot.slotKey ?? randomUUID().slice(0, 8)),
        x: Number(slot.x) || 0,
        y: Number(slot.y) || 0,
        width: Number(slot.width) || 0,
        height: Number(slot.height) || 0,
        rotation: Number(slot.rotation) || 0,
        zIndex: Number(slot.zIndex) || 0,
        fitMode: (slot.fit as TemplateSlotInput['fitMode']) ?? (slot.fitMode as TemplateSlotInput['fitMode']) ?? 'cover'
      });
    }
    await this.writeTemplateJson(created.id);
    return created;
  }

  private async writeTemplateJson(id: string): Promise<void> {
    const { template, slots } = this.getWithSlots(id);
    const json = {
      id: template.id,
      name: template.name,
      widthPx: template.widthPx,
      heightPx: template.heightPx,
      format: template.formatLabel,
      slots: slots.map((s) => ({
        id: s.id,
        type: s.slotType,
        key: s.slotKey,
        x: s.x,
        y: s.y,
        width: s.width,
        height: s.height,
        rotation: s.rotation,
        zIndex: s.zIndex,
        fit: s.fitMode
      }))
    };
    await this.storage.safeWrite(`${this.templateDir(id)}/template.json`, JSON.stringify(json, null, 2));
  }
}
