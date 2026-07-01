import { dialog } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc';
import { AppError } from '@shared/errors/appError';
import type { TemplateRecord } from '@shared/types/entities';
import type {
  TemplateSavePayload,
  TemplateWithSlots,
  TemplateValidation,
  TemplateSlotInput
} from '@shared/types/templates';
import { getContext } from '../context';
import { handle } from './handle';

function requireId(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new AppError({
      code: 'INVALID_ARGUMENT',
      message: 'template id required',
      userMessage: 'Falta el identificador de la plantilla.',
      action: 'Reintenta.',
      severity: 'medium',
      module: 'template'
    });
  }
  return value;
}

function asSavePayload(raw: unknown): TemplateSavePayload {
  const r = (raw ?? {}) as Record<string, unknown>;
  const slots = Array.isArray(r.slots) ? (r.slots as TemplateSlotInput[]) : [];
  return {
    name: typeof r.name === 'string' ? r.name : '',
    formatLabel: typeof r.formatLabel === 'string' && r.formatLabel ? r.formatLabel : null,
    slots
  };
}

export function registerTemplateHandlers(): void {
  handle(IPC_CHANNELS.templates.create, 'template', async (): Promise<TemplateRecord | null> => {
    const result = await dialog.showOpenDialog({
      title: 'Selecciona la imagen base (PNG o JPG)',
      properties: ['openFile'],
      filters: [{ name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg'] }]
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return getContext().templates.createFromImage(result.filePaths[0] ?? '');
  });

  handle(IPC_CHANNELS.templates.list, 'template', (): TemplateRecord[] => getContext().templates.list());

  handle(IPC_CHANNELS.templates.get, 'template', (idRaw: unknown): TemplateWithSlots =>
    getContext().templates.getWithSlots(requireId(idRaw))
  );

  handle(IPC_CHANNELS.templates.getImage, 'template', (idRaw: unknown): string =>
    getContext().templates.getImageDataUrl(requireId(idRaw))
  );

  handle(IPC_CHANNELS.templates.save, 'template', (idRaw: unknown, payload: unknown): Promise<TemplateWithSlots> =>
    getContext().templates.save(requireId(idRaw), asSavePayload(payload))
  );

  handle(IPC_CHANNELS.templates.validate, 'template', (idRaw: unknown, payload: unknown): TemplateValidation =>
    getContext().templates.validate(requireId(idRaw), asSavePayload(payload))
  );

  handle(IPC_CHANNELS.templates.duplicate, 'template', (idRaw: unknown): Promise<TemplateRecord> =>
    getContext().templates.duplicate(requireId(idRaw))
  );

  handle(
    IPC_CHANNELS.templates.delete,
    'template',
    (idRaw: unknown): Promise<{ affectedEvents: number }> =>
      getContext().templates.delete(requireId(idRaw))
  );

  handle(IPC_CHANNELS.templates.export, 'template', async (idRaw: unknown): Promise<string | null> => {
    const id = requireId(idRaw);
    const { template } = getContext().templates.getWithSlots(id);
    const safeName = template.name.replace(/[^a-z0-9_-]+/gi, '_').slice(0, 60) || 'plantilla';
    const result = await dialog.showSaveDialog({
      title: 'Exportar plantilla',
      defaultPath: `template_export_${safeName}.zip`,
      filters: [{ name: 'Plantilla', extensions: ['zip'] }]
    });
    if (result.canceled || !result.filePath) return null;
    return getContext().templates.exportTemplate(id, result.filePath);
  });

  handle(IPC_CHANNELS.templates.import, 'template', async (): Promise<TemplateRecord | null> => {
    const result = await dialog.showOpenDialog({
      title: 'Importar plantilla (.zip)',
      properties: ['openFile'],
      filters: [{ name: 'Plantilla', extensions: ['zip'] }]
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return getContext().templates.importTemplate(result.filePaths[0] ?? '');
  });
}
