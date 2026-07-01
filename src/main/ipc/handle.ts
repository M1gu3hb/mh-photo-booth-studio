import { ipcMain } from 'electron';
import type { Result, ErrorModule } from '@shared/types/result';
import { toAppError } from '@shared/errors/appError';
import { logError } from '../services/logging/logger';

type IpcHandler = (...args: unknown[]) => Promise<unknown> | unknown;

/**
 * Registers a typed IPC handler that always resolves to a `Result<T>`.
 * Handlers simply return data or throw (`AppError` for friendly errors);
 * this wrapper guarantees the renderer never receives a raw exception.
 */
export function handle(channel: string, module: ErrorModule, handler: IpcHandler): void {
  ipcMain.handle(channel, async (_event, ...args: unknown[]): Promise<Result<unknown>> => {
    try {
      const data = await handler(...args);
      return { ok: true, data };
    } catch (err) {
      const payload = toAppError(err, module);
      logError(payload);
      return { ok: false, error: payload };
    }
  });
}
