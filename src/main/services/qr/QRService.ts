import QRCode from 'qrcode';
import { AppError } from '@shared/errors/appError';
import type { Repositories } from '../database/repositories';
import type { StorageService } from '../storage/StorageService';

export function isValidQrUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Generates the event QR (offline, via the pure-JS `qrcode` lib), persists it
 * under the event folder + a `qr_links` row, and returns it as a data URL for
 * the compositor. Inserted only when the event has QR enabled + a valid link.
 */
export class QRService {
  private readonly repos: Repositories;
  private readonly storage: StorageService;

  constructor(repos: Repositories, storage: StorageService) {
    this.repos = repos;
    this.storage = storage;
  }

  validate(url: string): boolean {
    return isValidQrUrl(url);
  }

  /** Returns a QR data URL for the event, or null if QR is off. Throws if on + invalid. */
  async ensureForEvent(eventId: string): Promise<string | null> {
    const event = this.repos.events.getById(eventId);
    if (!event || !event.qrEnabled || !event.qrLink) {
      return null;
    }
    if (!isValidQrUrl(event.qrLink)) {
      throw new AppError({
        code: 'QR_INVALID',
        message: `Invalid QR url: ${event.qrLink}`,
        userMessage: 'El link del QR no es válido.',
        action: 'Corrige el link del QR en la configuración del evento.',
        severity: 'medium',
        module: 'qr'
      });
    }

    const buffer = await QRCode.toBuffer(event.qrLink, {
      type: 'png',
      width: 600,
      margin: 1,
      errorCorrectionLevel: 'M'
    });
    const relative = `events/event_${eventId}/qr/event_qr.png`;
    await this.storage.safeWrite(relative, buffer);

    const existing = this.repos.qrLinks.list({
      where: 'event_id = ? AND scope = ?',
      params: [eventId, 'event']
    });
    if (existing[0]) {
      this.repos.qrLinks.update(existing[0].id, {
        url: event.qrLink,
        qrImagePath: relative,
        label: event.name
      });
    } else {
      this.repos.qrLinks.create({
        eventId,
        label: event.name,
        url: event.qrLink,
        qrImagePath: relative,
        scope: 'event'
      });
    }

    return `data:image/png;base64,${buffer.toString('base64')}`;
  }
}
