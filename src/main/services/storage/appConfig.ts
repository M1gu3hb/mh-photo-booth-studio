import { join, dirname } from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { app } from 'electron';

/**
 * Bootstrap config that lives in Electron's userData (NOT the data root, since
 * it records WHERE the data root is). Everything else is stored inside the data
 * root's SQLite database.
 */
interface AppConfig {
  dataRoot: string;
}

function configPath(): string {
  return join(app.getPath('userData'), 'app-config.json');
}

export function defaultDataRoot(): string {
  // Documents keeps photos human-findable (FILE_STORAGE.md), relative to the user.
  return join(app.getPath('documents'), 'PhotoBoothData');
}

export function readAppConfig(): AppConfig {
  // Highest priority: explicit override (portable mode / automated testing).
  const override = process.env['PBS_DATA_ROOT'];
  if (override && override.trim().length > 0) {
    return { dataRoot: override.trim() };
  }

  const path = configPath();
  if (existsSync(path)) {
    try {
      const parsed = JSON.parse(readFileSync(path, 'utf-8')) as Partial<AppConfig>;
      if (typeof parsed.dataRoot === 'string' && parsed.dataRoot.trim().length > 0) {
        return { dataRoot: parsed.dataRoot };
      }
    } catch {
      // Corrupt config: fall back to default rather than crashing on startup.
    }
  }
  return { dataRoot: defaultDataRoot() };
}

export function writeAppConfig(config: AppConfig): void {
  const path = configPath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(config, null, 2), 'utf-8');
}
