import { join, dirname, relative, sep, isAbsolute } from 'node:path';
import { mkdirSync } from 'node:fs';
import { mkdir, writeFile, stat, rename, rm } from 'node:fs/promises';
import { AppError } from '@shared/errors/appError';

/** Top-level folders created under the data root (FILE_STORAGE.md). */
const ROOT_FOLDERS = ['database', 'templates', 'events', 'logs', 'backups', 'exports'] as const;

/**
 * Owns the data root and all path resolution. Paths are stored relative to the
 * data root so the whole folder is portable across machines (no absolute paths).
 */
export class StorageService {
  private dataRoot: string;

  constructor(dataRoot: string) {
    this.dataRoot = dataRoot;
  }

  getDataRoot(): string {
    return this.dataRoot;
  }

  setDataRoot(next: string): void {
    this.dataRoot = next;
    this.ensureStructure();
  }

  /** Creates the standard folder structure (idempotent). */
  ensureStructure(): void {
    mkdirSync(this.dataRoot, { recursive: true });
    for (const folder of ROOT_FOLDERS) {
      mkdirSync(join(this.dataRoot, folder), { recursive: true });
    }
  }

  databasePath(): string {
    return join(this.dataRoot, 'database', 'app.sqlite');
  }

  /** Absolute path from a data-root-relative path. */
  toAbsolute(relativePath: string): string {
    return isAbsolute(relativePath) ? relativePath : join(this.dataRoot, relativePath);
  }

  /** Data-root-relative path (forward slashes) from an absolute path. */
  toRelative(absolutePath: string): string {
    return relative(this.dataRoot, absolutePath).split(sep).join('/');
  }

  /**
   * Safe write: temp file → verify non-empty → atomic rename → return the
   * absolute final path. Prevents half-written/corrupt files (FILE_STORAGE.md).
   * `relativePath` is relative to the data root.
   */
  async safeWrite(relativePath: string, data: Buffer | string): Promise<string> {
    const absolute = this.toAbsolute(relativePath);
    const tmp = `${absolute}.tmp-${Date.now()}`;
    try {
      await mkdir(dirname(absolute), { recursive: true });
      await writeFile(tmp, data);
      const info = await stat(tmp);
      if (info.size === 0) {
        await rm(tmp, { force: true });
        throw new AppError({
          code: 'FILE_WRITE_FAILED',
          message: `Safe write produced a 0-byte file: ${relativePath}`,
          userMessage: 'No se pudo guardar el archivo.',
          action: 'Revisa permisos o cambia la carpeta de datos.',
          severity: 'high',
          module: 'storage'
        });
      }
      await rename(tmp, absolute);
      return absolute;
    } catch (err) {
      await rm(tmp, { force: true }).catch(() => undefined);
      if (err instanceof AppError) throw err;
      throw new AppError({
        code: 'FILE_WRITE_FAILED',
        message: `Failed to write ${relativePath}: ${String(err)}`,
        userMessage: 'No se pudo guardar el archivo.',
        action: 'Revisa permisos o cambia la carpeta de datos.',
        severity: 'high',
        module: 'storage',
        details: err instanceof Error ? err.stack : undefined
      });
    }
  }

  /**
   * Recursively removes a data-root-relative directory (best-effort, idempotent).
   * Refuses to delete the data root itself or paths that escape it.
   */
  async removeDir(relativePath: string): Promise<void> {
    const absolute = this.toAbsolute(relativePath);
    const rel = relative(this.dataRoot, absolute);
    if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) {
      throw new AppError({
        code: 'FILE_WRITE_FAILED',
        message: `Refusing to remove path outside data root: ${relativePath}`,
        userMessage: 'No se pudo borrar la carpeta.',
        action: 'Operación no permitida.',
        severity: 'high',
        module: 'storage'
      });
    }
    await rm(absolute, { recursive: true, force: true });
  }
}
