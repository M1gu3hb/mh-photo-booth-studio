import { join, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';
import { app, net, protocol } from 'electron';

/**
 * Serves the production renderer from a custom `app://bundle/...` origin instead
 * of `file://`. This gives the renderer a real, stable origin so a strict CSP
 * (`script-src 'self'`) actually matches its bundled scripts/styles/fonts —
 * `file://` has a null origin and would block them, shipping a blank window.
 */
const SCHEME = 'app';
const HOST = 'bundle';

/**
 * CSP for the packaged renderer (origin app://bundle). `'self'` now matches the
 * bundled scripts/styles/fonts. `data:`/`blob:` cover camera previews and
 * generated thumbnails; `'unsafe-inline'` style is needed for React inline styles.
 */
const APP_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-src 'none'"
].join('; ');

export function registerAppScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, codeCache: true }
    }
  ]);
}

export function handleAppProtocol(): void {
  protocol.handle(SCHEME, async (request) => {
    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '' || pathname === '/') pathname = '/index.html';
    const rendererRoot = join(app.getAppPath(), 'out', 'renderer');
    // Resolve + contain inside the renderer root (no path traversal).
    const resolved = normalize(join(rendererRoot, pathname));
    if (!resolved.startsWith(rendererRoot)) {
      return new Response('Forbidden', { status: 403 });
    }
    const response = await net.fetch(pathToFileURL(resolved).toString());
    const headers = new Headers(response.headers);
    headers.set('Content-Security-Policy', APP_CSP);
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(response.body, { status: response.status, headers });
  });
}

export const APP_INDEX_URL = `${SCHEME}://${HOST}/index.html`;
