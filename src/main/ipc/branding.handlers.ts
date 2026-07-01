import { readFileSync, existsSync } from 'node:fs';
import { extname } from 'node:path';
import { dialog } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc';
import { AppError } from '@shared/errors/appError';
import type { BrandingConfig } from '@shared/constants/branding';
import type { LicenseStatus } from '@shared/types/license';
import type { EventRecord } from '@shared/types/entities';
import { getContext } from '../context';
import { handle } from './handle';

function asBranding(raw: unknown): Partial<BrandingConfig> {
  const r = (raw ?? {}) as Record<string, unknown>;
  const out: Partial<BrandingConfig> = {};
  if (typeof r.productName === 'string') out.productName = r.productName;
  if (typeof r.venueName === 'string') out.venueName = r.venueName;
  if (typeof r.welcomeText === 'string') out.welcomeText = r.welcomeText;
  if (typeof r.themeId === 'string') out.themeId = r.themeId;
  return out;
}

export function registerBrandingHandlers(): void {
  handle(IPC_CHANNELS.branding.get, 'settings', (): BrandingConfig => getContext().settings.getBranding());

  handle(IPC_CHANNELS.branding.set, 'settings', (raw: unknown): BrandingConfig =>
    getContext().settings.setBranding(asBranding(raw))
  );

  handle(IPC_CHANNELS.branding.pickLogo, 'settings', async (): Promise<BrandingConfig> => {
    const ctx = getContext();
    const result = await dialog.showOpenDialog({
      title: 'Selecciona el logo (PNG o JPG)',
      properties: ['openFile'],
      filters: [{ name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg'] }]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return ctx.settings.getBranding();
    }
    const src = result.filePaths[0] ?? '';
    const ext = extname(src).toLowerCase() === '.png' ? '.png' : '.jpg';
    const rel = `branding/logo${ext}`;
    await ctx.storage.safeWrite(rel, readFileSync(src));
    return ctx.settings.setBranding({ logoPath: rel });
  });

  handle(IPC_CHANNELS.branding.clearLogo, 'settings', (): BrandingConfig =>
    getContext().settings.setBranding({ logoPath: null })
  );

  handle(IPC_CHANNELS.branding.getLogo, 'settings', (): string | null => {
    const ctx = getContext();
    const branding = ctx.settings.getBranding();
    if (!branding.logoPath) return null;
    const abs = ctx.storage.toAbsolute(branding.logoPath);
    if (!existsSync(abs)) return null;
    const mime = extname(abs).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${readFileSync(abs).toString('base64')}`;
  });

  // ---- License (non-blocking, informational) ----
  handle(IPC_CHANNELS.license.status, 'app', (): LicenseStatus => getContext().settings.getLicense());

  // ---- Event backup (export/import) ----
  handle(IPC_CHANNELS.backup.exportEvent, 'storage', async (eventId: unknown): Promise<string | null> => {
    if (typeof eventId !== 'string' || !eventId) {
      throw new AppError({
        code: 'INVALID_ARGUMENT',
        message: 'eventId required',
        userMessage: 'Selecciona un evento.',
        action: 'Reintenta.',
        severity: 'medium',
        module: 'storage'
      });
    }
    const ctx = getContext();
    const event = ctx.repos.events.getById(eventId);
    const safe = (event?.name ?? 'evento').replace(/[^a-z0-9_-]+/gi, '_').slice(0, 50);
    const result = await dialog.showSaveDialog({
      title: 'Exportar evento',
      defaultPath: `event_export_${safe}.zip`,
      filters: [{ name: 'Evento', extensions: ['zip'] }]
    });
    if (result.canceled || !result.filePath) return null;
    return ctx.backup.exportEvent(eventId, result.filePath);
  });

  handle(IPC_CHANNELS.backup.importEvent, 'storage', async (): Promise<EventRecord | null> => {
    const result = await dialog.showOpenDialog({
      title: 'Importar evento (.zip)',
      properties: ['openFile'],
      filters: [{ name: 'Evento', extensions: ['zip'] }]
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return getContext().backup.importEvent(result.filePaths[0] ?? '');
  });
}
