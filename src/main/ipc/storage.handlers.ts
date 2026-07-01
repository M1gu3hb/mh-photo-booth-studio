import { dialog } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc';
import type { AppSettings } from '@shared/types/settings';
import { AppError } from '@shared/errors/appError';
import { getContext } from '../context';
import { changeDataRoot } from '../bootstrap';
import { handle } from './handle';

export function registerStorageHandlers(): void {
  handle(IPC_CHANNELS.storage.getDataRoot, 'storage', (): string => getContext().storage.getDataRoot());

  handle(IPC_CHANNELS.storage.pickDataRoot, 'storage', async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({
      title: 'Selecciona la carpeta de datos',
      defaultPath: getContext().storage.getDataRoot(),
      properties: ['openDirectory', 'createDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0] ?? null;
  });

  handle(IPC_CHANNELS.storage.setDataRoot, 'storage', (raw: unknown): AppSettings => {
    if (typeof raw !== 'string' || raw.trim().length === 0) {
      throw new AppError({
        code: 'INVALID_DATA_ROOT',
        message: 'Data root path must be a non-empty string',
        userMessage: 'La carpeta seleccionada no es válida.',
        action: 'Elige otra carpeta.',
        severity: 'medium',
        module: 'storage'
      });
    }
    const ctx = changeDataRoot(raw.trim());
    return { dataRoot: ctx.storage.getDataRoot(), ...ctx.settings.getValues() };
  });
}
