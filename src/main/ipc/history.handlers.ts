import { shell, dialog } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc';
import { AppError } from '@shared/errors/appError';
import type { SessionRecord } from '@shared/types/entities';
import type { DiagnosticsReport } from '@shared/types/diagnostics';
import { getContext } from '../context';
import { handle } from './handle';

function requireId(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new AppError({
      code: 'INVALID_ARGUMENT',
      message: 'id required',
      userMessage: 'Falta un dato requerido.',
      action: 'Reintenta.',
      severity: 'medium',
      module: 'diagnostics'
    });
  }
  return value;
}

export function registerHistoryHandlers(): void {
  handle(IPC_CHANNELS.history.archive, 'storage', (sessionId: unknown): SessionRecord =>
    getContext().sessions.archive(requireId(sessionId))
  );

  handle(IPC_CHANNELS.history.openFinal, 'storage', async (sessionId: unknown): Promise<boolean> => {
    const abs = getContext().sessions.finalAbsPath(requireId(sessionId));
    if (!abs) return false;
    const err = await shell.openPath(abs);
    return err === '';
  });

  handle(IPC_CHANNELS.history.openOriginals, 'storage', async (sessionId: unknown): Promise<boolean> => {
    const abs = getContext().sessions.originalsAbsDir(requireId(sessionId));
    if (!abs) return false;
    const err = await shell.openPath(abs);
    return err === '';
  });

  handle(IPC_CHANNELS.history.exportSession, 'storage', async (sessionId: unknown): Promise<string | null> => {
    const id = requireId(sessionId);
    const result = await dialog.showSaveDialog({
      title: 'Exportar sesión',
      defaultPath: `session_export_${id.slice(0, 8)}.zip`,
      filters: [{ name: 'Sesión', extensions: ['zip'] }]
    });
    if (result.canceled || !result.filePath) return null;
    return getContext().sessions.exportSession(id, result.filePath);
  });

  // ---- Diagnostics ----
  handle(IPC_CHANNELS.diagnostics.run, 'diagnostics', (): Promise<DiagnosticsReport> =>
    getContext().diagnostics.run()
  );

  handle(IPC_CHANNELS.diagnostics.export, 'diagnostics', async (): Promise<string | null> => {
    const stamp = new Date().toISOString().slice(0, 10);
    const result = await dialog.showSaveDialog({
      title: 'Exportar diagnóstico',
      defaultPath: `diagnostics_${stamp}.zip`,
      filters: [{ name: 'Diagnóstico', extensions: ['zip'] }]
    });
    if (result.canceled || !result.filePath) return null;
    return getContext().diagnostics.export(result.filePath);
  });
}
