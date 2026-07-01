import { BrowserWindow, shell } from 'electron';
import { DEFAULT_BRANDING } from '@shared/constants/branding';
import { join } from 'node:path';
import { APP_INDEX_URL } from './appProtocol';

/** Dev server URL is injected by electron-vite; absent in production builds. */
const RENDERER_DEV_URL = process.env['ELECTRON_RENDERER_URL'];

/** Base surface color so the window never flashes white before React mounts. */
const WINDOW_BACKGROUND = '#061711';

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 832,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    backgroundColor: WINDOW_BACKGROUND,
    title: DEFAULT_BRANDING.productName,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false
    }
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  // External links open in the OS browser — never navigate the app shell away.
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (RENDERER_DEV_URL) {
    void window.loadURL(RENDERER_DEV_URL);
  } else {
    // Production: served via the app:// protocol so a strict CSP works.
    void window.loadURL(APP_INDEX_URL);
  }

  return window;
}
