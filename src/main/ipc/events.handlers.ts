import { IPC_CHANNELS } from '@shared/constants/ipc';
import type { EventInput } from '@shared/types/events';
import type { EventRecord } from '@shared/types/entities';
import { AppError } from '@shared/errors/appError';
import { getContext } from '../context';
import { handle } from './handle';

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError({
      code: 'INVALID_ARGUMENT',
      message: `${field} must be a non-empty string`,
      userMessage: 'Falta un dato requerido.',
      action: 'Reintenta la acción.',
      severity: 'medium',
      module: 'event'
    });
  }
  return value;
}

/** Coerces an untyped IPC payload into a validated EventInput (service re-validates). */
function asEventInput(raw: unknown): EventInput {
  if (typeof raw !== 'object' || raw === null) {
    throw new AppError({
      code: 'INVALID_ARGUMENT',
      message: 'Event payload must be an object',
      userMessage: 'Los datos del evento no son válidos.',
      action: 'Revisa el formulario e intenta de nuevo.',
      severity: 'medium',
      module: 'event'
    });
  }
  const r = raw as Record<string, unknown>;
  return {
    name: typeof r.name === 'string' ? r.name : '',
    eventType: typeof r.eventType === 'string' ? r.eventType : '',
    eventDate: typeof r.eventDate === 'string' && r.eventDate ? r.eventDate : null,
    clientReference: typeof r.clientReference === 'string' && r.clientReference ? r.clientReference : null,
    templateId: typeof r.templateId === 'string' && r.templateId ? r.templateId : null,
    defaultPhotoCount: typeof r.defaultPhotoCount === 'number' ? r.defaultPhotoCount : 3,
    defaultCopies: typeof r.defaultCopies === 'number' ? r.defaultCopies : 1,
    qrEnabled: r.qrEnabled === true,
    qrLink: typeof r.qrLink === 'string' && r.qrLink ? r.qrLink : null
  };
}

export function registerEventHandlers(): void {
  handle(IPC_CHANNELS.events.create, 'event', (raw: unknown): Promise<EventRecord> => {
    return getContext().events.create(asEventInput(raw));
  });

  handle(IPC_CHANNELS.events.update, 'event', (idRaw: unknown, raw: unknown): Promise<EventRecord> => {
    const id = requireString(idRaw, 'id');
    return getContext().events.update(id, asEventInput(raw));
  });

  handle(IPC_CHANNELS.events.archive, 'event', (idRaw: unknown): EventRecord => {
    const id = requireString(idRaw, 'id');
    return getContext().events.archive(id);
  });

  handle(IPC_CHANNELS.events.list, 'event', (): EventRecord[] => getContext().events.list());

  handle(IPC_CHANNELS.events.getActive, 'event', (): EventRecord | null =>
    getContext().events.getActive()
  );

  handle(IPC_CHANNELS.events.setActive, 'event', (idRaw: unknown): EventRecord => {
    const id = requireString(idRaw, 'id');
    return getContext().events.setActive(id);
  });

  handle(IPC_CHANNELS.events.markReady, 'event', (idRaw: unknown): boolean => {
    getContext().events.markReady(requireString(idRaw, 'id'));
    return true;
  });

  handle(IPC_CHANNELS.events.isReady, 'event', (idRaw: unknown): boolean =>
    getContext().events.isReady(requireString(idRaw, 'id'))
  );
}
