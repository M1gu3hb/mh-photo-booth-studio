import { app, session } from 'electron';

/**
 * Grants only the camera/media permission to our own local content; denies
 * everything else (geolocation, notifications, etc.). The webcam needs this or
 * getUserMedia is rejected under the hardened defaults.
 */
export function configurePermissions(): void {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'media');
  });
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => permission === 'media');
}

/**
 * Defense in depth: block any attempt by renderer content to navigate away from
 * the local app shell. Only the production `app://` origin and the Vite dev URL
 * are allowed. (CSP for the packaged renderer is set on app:// responses.)
 */
export function hardenNavigation(): void {
  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-navigate', (event, url) => {
      const devUrl = process.env['ELECTRON_RENDERER_URL'];
      if (url.startsWith('app://')) return;
      if (devUrl && url.startsWith(devUrl)) return;
      event.preventDefault();
    });
  });
}
