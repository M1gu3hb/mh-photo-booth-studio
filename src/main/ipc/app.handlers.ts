import { app, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc';
import { DEFAULT_BRANDING } from '@shared/constants/branding';
import type { AppInfo } from '@shared/types/app';
import { handle } from './handle';

/** Registers the `app:*` IPC channels (runtime info, fullscreen for event mode). */
export function registerAppHandlers(): void {
  handle(IPC_CHANNELS.app.getInfo, 'app', (): AppInfo => {
    return {
      productName: DEFAULT_BRANDING.productName,
      version: app.getVersion(),
      electronVersion: process.versions.electron ?? 'unknown',
      chromeVersion: process.versions.chrome ?? 'unknown',
      nodeVersion: process.versions.node ?? 'unknown',
      platform: process.platform,
      environment: app.isPackaged ? 'production' : 'development'
    };
  });

  handle(IPC_CHANNELS.app.setFullscreen, 'app', (enabled: unknown): boolean => {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
    if (!win) return false;
    win.setFullScreen(enabled === true);
    return win.isFullScreen();
  });
}
