import { IPC_CHANNELS } from '@shared/constants/ipc';
import { AppError } from '@shared/errors/appError';
import type {
  PrintTemplateRecord,
  PrintTemplateMode
} from '@shared/types/entities';
import type {
  PrintTemplateCreateInput,
  PrintTemplateSavePayload,
  PrintTemplateSlotInput,
  PrintTemplateWithSlots
} from '@shared/types/printTemplates';
import { getContext } from '../context';
import { handle } from './handle';

function requireId(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new AppError({
      code: 'INVALID_ARGUMENT',
      message: 'id required',
      userMessage: 'Falta el identificador.',
      action: 'Reintenta.',
      severity: 'medium',
      module: 'print'
    });
  }
  return value;
}

const MODES: PrintTemplateMode[] = ['grid', 'custom', 'full'];

function asMode(raw: unknown): PrintTemplateMode {
  return MODES.includes(raw as PrintTemplateMode) ? (raw as PrintTemplateMode) : 'grid';
}

function asCreateInput(raw: unknown): PrintTemplateCreateInput {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    name: typeof r.name === 'string' ? r.name : '',
    photoTemplateId: typeof r.photoTemplateId === 'string' ? r.photoTemplateId : null,
    paperKey: typeof r.paperKey === 'string' && r.paperKey ? r.paperKey : '4x6',
    orientation: r.orientation === 'landscape' ? 'landscape' : 'portrait',
    mode: asMode(r.mode),
    cellCount: Number(r.cellCount) > 0 ? Math.floor(Number(r.cellCount)) : 2
  };
}

function asSavePayload(raw: unknown): PrintTemplateSavePayload {
  const base = asCreateInput(raw);
  const r = (raw ?? {}) as Record<string, unknown>;
  const slots: PrintTemplateSlotInput[] = Array.isArray(r.slots)
    ? (r.slots as Array<Record<string, unknown>>).map((s, i) => ({
        x: Number(s.x) || 0,
        y: Number(s.y) || 0,
        width: Number(s.width) || 0,
        height: Number(s.height) || 0,
        rotation: Number(s.rotation) || 0,
        zIndex: Number(s.zIndex) || i
      }))
    : [];
  return { ...base, slots };
}

export function registerPrintTemplateHandlers(): void {
  handle(IPC_CHANNELS.printTemplates.list, 'print', (eventIdRaw: unknown): PrintTemplateRecord[] =>
    getContext().printTemplates.list(requireId(eventIdRaw))
  );

  handle(IPC_CHANNELS.printTemplates.get, 'print', (idRaw: unknown): PrintTemplateWithSlots =>
    getContext().printTemplates.getWithSlots(requireId(idRaw))
  );

  handle(
    IPC_CHANNELS.printTemplates.create,
    'print',
    (eventIdRaw: unknown, input: unknown): PrintTemplateRecord =>
      getContext().printTemplates.create(requireId(eventIdRaw), asCreateInput(input))
  );

  handle(
    IPC_CHANNELS.printTemplates.save,
    'print',
    (idRaw: unknown, payload: unknown): PrintTemplateWithSlots =>
      getContext().printTemplates.save(requireId(idRaw), asSavePayload(payload))
  );

  handle(IPC_CHANNELS.printTemplates.delete, 'print', (idRaw: unknown): { ok: true } => {
    getContext().printTemplates.delete(requireId(idRaw));
    return { ok: true };
  });
}
