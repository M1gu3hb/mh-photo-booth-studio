import { BrowserWindow, screen, shell } from 'electron';
import { join } from 'node:path';
import { IPC_CHANNELS } from '@shared/constants/ipc';
import { APP_INDEX_URL } from './appProtocol';

const RENDERER_DEV_URL = process.env['ELECTRON_RENDERER_URL'];
const WINDOW_BACKGROUND = '#061711';

let publicWindow: BrowserWindow | null = null;
/** Last live session state published by the operator, replayed to a window that
 * opens after the broadcast so it shows the correct mode/phase immediately. */
let lastLiveState: unknown = null;

export function rememberLiveState(state: unknown): void {
  lastLiveState = state;
}

export function isPublicOpen(): boolean {
  return publicWindow !== null && !publicWindow.isDestroyed();
}

/**
 * Opens the guest-facing "public view" window (Fase 14). Placed on the external
 * monitor in fullscreen when one is present; otherwise a large windowed view on
 * the primary display. Loads the renderer at the `#/publico` route.
 */
export function openPublicWindow(): boolean {
  if (isPublicOpen()) {
    publicWindow?.focus();
    return true;
  }

  const primary = screen.getPrimaryDisplay();
  const external = screen.getAllDisplays().find((d) => d.id !== primary.id);
  const target = external ?? primary;

  const win = new BrowserWindow({
    x: target.bounds.x + (external ? 0 : 60),
    y: target.bounds.y + (external ? 0 : 60),
    width: external ? target.bounds.width : 1024,
    height: external ? target.bounds.height : 680,
    fullscreen: Boolean(external),
    backgroundColor: WINDOW_BACKGROUND,
    title: 'Vista al público',
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

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  const base = RENDERER_DEV_URL ?? APP_INDEX_URL;
  void win.loadURL(`${base}#/publico`);

  // Replay the latest live state so the public view shows the right mode/phase
  // even though it opened after the operator's broadcast.
  win.webContents.on('did-finish-load', () => {
    if (lastLiveState !== null && !win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.live.stateChannel, lastLiveState);
    }
  });

  win.on('closed', () => {
    if (publicWindow === win) publicWindow = null;
  });

  publicWindow = win;
  return true;
}

export function closePublicWindow(): void {
  if (isPublicOpen()) publicWindow?.close();
  publicWindow = null;
}

/** Sends a payload to every live window (operator + public). */
export function broadcastLive(channel: string, payload: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(channel, payload);
  }
}
