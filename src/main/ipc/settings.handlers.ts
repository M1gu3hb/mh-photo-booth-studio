import { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc';
import { COUNTDOWN_OPTIONS } from '@shared/constants/settings';
import type { AppSettings, UpdatableSettings } from '@shared/types/settings';
import type { DbStatus } from '@shared/types/api';
import { AppError } from '@shared/errors/appError';
import { getContext } from '../context';
import { getCurrentSchemaVersion } from '../services/database/migrate';
import { handle } from './handle';

function assembleSettings(): AppSettings {
  const ctx = getContext();
  return { dataRoot: ctx.storage.getDataRoot(), ...ctx.settings.getValues() };
}

function validationError(message: string): AppError {
  return new AppError({
    code: 'INVALID_SETTINGS',
    message,
    userMessage: 'No se pudo guardar la configuración.',
    action: 'Revisa los valores e intenta de nuevo.',
    severity: 'medium',
    module: 'settings'
  });
}

function validateUpdate(input: unknown): UpdatableSettings {
  if (typeof input !== 'object' || input === null) {
    throw validationError('Settings payload must be an object');
  }
  const partial = input as Record<string, unknown>;
  const out: UpdatableSettings = {};

  if ('soundEnabled' in partial) {
    if (typeof partial.soundEnabled !== 'boolean') throw validationError('soundEnabled must be boolean');
    out.soundEnabled = partial.soundEnabled;
  }
  if ('fullscreenDefault' in partial) {
    if (typeof partial.fullscreenDefault !== 'boolean') {
      throw validationError('fullscreenDefault must be boolean');
    }
    out.fullscreenDefault = partial.fullscreenDefault;
  }
  if ('defaultCountdownSeconds' in partial) {
    const value = partial.defaultCountdownSeconds;
    if (typeof value !== 'number' || !(COUNTDOWN_OPTIONS as readonly number[]).includes(value)) {
      throw validationError('defaultCountdownSeconds must be one of the allowed options');
    }
    out.defaultCountdownSeconds = value;
  }
  return out;
}

export function registerSettingsHandlers(): void {
  handle(IPC_CHANNELS.settings.get, 'settings', (): AppSettings => assembleSettings());

  handle(IPC_CHANNELS.settings.update, 'settings', (raw: unknown): AppSettings => {
    const partial = validateUpdate(raw);
    const ctx = getContext();
    ctx.settings.update(partial);

    // Fullscreen applies immediately (real consequence) in addition to persisting.
    if (partial.fullscreenDefault !== undefined) {
      const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
      win?.setFullScreen(partial.fullscreenDefault);
    }
    return assembleSettings();
  });

  handle(IPC_CHANNELS.db.status, 'database', (): DbStatus => {
    const ctx = getContext();
    return {
      schemaVersion: getCurrentSchemaVersion(ctx.db),
      dataRoot: ctx.storage.getDataRoot(),
      posePackCount: ctx.repos.posePacks.count()
    };
  });
}
