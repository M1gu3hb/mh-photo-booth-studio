import { writeFile } from 'node:fs/promises';
import { app, BrowserWindow } from 'electron';
import { registerIpcHandlers } from './ipc';
import { createMainWindow } from './window';
import { hardenNavigation, configurePermissions } from './security';
import { registerAppScheme, handleAppProtocol } from './appProtocol';
import { bootstrap } from './bootstrap';
import { getContext, hasContext } from './context';

// Must run before app is ready: registers app:// as a standard, secure scheme.
registerAppScheme();

// Single-instance lock: a photo booth must never run twice over the same data root.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [existing] = BrowserWindow.getAllWindows();
    if (existing) {
      if (existing.isMinimized()) existing.restore();
      existing.focus();
    }
  });

  hardenNavigation();

  app
    .whenReady()
    .then(() => {
      handleAppProtocol();
      configurePermissions();

      // Initialize local data layer (data root, SQLite, migrations, seed, settings).
      try {
        bootstrap();
      } catch (err) {
        // The window still opens; IPC handlers surface a friendly error if the
        // data layer is unavailable rather than crashing the whole app.
        console.error('[main] Data layer bootstrap failed', err);
      }

      registerIpcHandlers();
      const mainWindow = createMainWindow();

      // Apply the persisted fullscreen-default preference on launch.
      if (hasContext() && getContext().settings.getValues().fullscreenDefault) {
        mainWindow.setFullScreen(true);
      }

      // Smoke-test hook: boot the full app, optionally navigate + screenshot,
      // confirm the IPC-fed version rendered, then exit cleanly (CI / verification).
      if (process.env['PBS_SMOKE_EXIT'] || process.env['PBS_SMOKE_SHOT']) {
        mainWindow.webContents.once('did-finish-load', () => {
          const route = process.env['PBS_SMOKE_ROUTE'];
          const shot = process.env['PBS_SMOKE_SHOT'];
          void (async () => {
            try {
              if (route) {
                await mainWindow.webContents.executeJavaScript(
                  `location.hash = ${JSON.stringify(route)}`
                );
              }
              await new Promise((resolve) => setTimeout(resolve, 1200));
              const version = await mainWindow.webContents.executeJavaScript(
                'document.querySelector("[data-testid=app-version]")?.textContent ?? "MISSING"'
              );
              console.log(`[smoke] footer version = ${String(version)}`);
              const probe = await mainWindow.webContents.executeJavaScript(
                'JSON.stringify({hash: location.hash, title: document.querySelector(".pb-topbar__title")?.textContent})'
              );
              console.log(`[smoke] probe = ${String(probe)}`);
              const evalScript = process.env['PBS_SMOKE_EVAL'];
              if (evalScript) {
                const evalResult = await mainWindow.webContents.executeJavaScript(evalScript);
                console.log(`[smoke] eval = ${String(evalResult)}`);
              }
              if (shot) {
                const image = await mainWindow.webContents.capturePage();
                await writeFile(shot, image.toPNG());
                console.log(`[smoke] screenshot saved = ${shot}`);
              }
            } catch (err) {
              console.error('[smoke] failed', err);
            } finally {
              app.quit();
            }
          })();
        });
      }

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          createMainWindow();
        }
      });
    })
    .catch((err: unknown) => {
      // Startup failure: log to stderr (no renderer exists yet to show a dialog).
      console.error('[main] Failed to start application', err);
      app.quit();
    });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
