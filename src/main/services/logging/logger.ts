import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { AppErrorPayload, ErrorModule } from '@shared/types/result';

/**
 * Append-only module logs under <dataRoot>/logs. Initialized at startup. Never
 * logs photo content or personal data — only codes, technical messages and paths.
 */
let logsDir: string | null = null;

const MODULE_LOG: Partial<Record<ErrorModule, string>> = {
  print: 'print.log',
  camera: 'camera.log'
};

export function setLogsDir(dir: string): void {
  logsDir = dir;
  try {
    mkdirSync(dir, { recursive: true });
  } catch {
    // best-effort
  }
}

function write(file: string, line: string): void {
  if (!logsDir) return;
  try {
    appendFileSync(join(logsDir, file), `${line}\n`, 'utf-8');
  } catch {
    // Logging must never throw into the app.
  }
}

export function logError(payload: AppErrorPayload): void {
  const line = `[${payload.timestamp}] ${payload.severity.toUpperCase()} ${payload.module}/${payload.code} — ${payload.message}`;
  write('errors.log', line);
  write('app.log', line);
  const moduleFile = MODULE_LOG[payload.module];
  if (moduleFile) write(moduleFile, line);
}

export function logInfo(module: ErrorModule, message: string): void {
  const line = `[${new Date().toISOString()}] INFO ${module} — ${message}`;
  write('app.log', line);
  const moduleFile = MODULE_LOG[module];
  if (moduleFile) write(moduleFile, line);
}
