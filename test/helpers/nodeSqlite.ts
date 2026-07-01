import { createRequire } from 'node:module';
import type { Db, DbStatement } from '../../src/main/services/database/types';

interface RawStatement {
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
  run(...params: unknown[]): { changes: number | bigint; lastInsertRowid: number | bigint };
}
interface RawDatabase {
  exec(sql: string): void;
  prepare(sql: string): RawStatement;
  close(): void;
}
type DatabaseSyncCtor = new (path: string) => RawDatabase;

// Loaded via createRequire so Vite's static resolver (vitest) doesn't try to
// bundle the `node:sqlite` builtin; it is required at runtime under Node.
const nodeRequire = createRequire(import.meta.url);
const { DatabaseSync } = nodeRequire('node:sqlite') as { DatabaseSync: DatabaseSyncCtor };

/**
 * Test-only `Db` adapter backed by Node's built-in `node:sqlite`. Lets the
 * exact production SQL/migrations/repositories run under the Node test runner,
 * where the Electron-ABI better-sqlite3 binary cannot load.
 */
export function openNodeSqlite(path = ':memory:'): Db {
  const raw = new DatabaseSync(path);
  raw.exec('PRAGMA foreign_keys = ON');

  return {
    exec: (sql: string) => {
      raw.exec(sql);
    },
    prepare: (sql: string): DbStatement => {
      const stmt = raw.prepare(sql);
      return {
        get: (...params: unknown[]) => stmt.get(...params),
        all: (...params: unknown[]) => stmt.all(...params),
        run: (...params: unknown[]) => {
          const result = stmt.run(...params);
          return { changes: Number(result.changes), lastInsertRowid: result.lastInsertRowid };
        }
      };
    },
    transaction: <T,>(fn: () => T): T => {
      raw.exec('BEGIN');
      try {
        const value = fn();
        raw.exec('COMMIT');
        return value;
      } catch (err) {
        raw.exec('ROLLBACK');
        throw err;
      }
    },
    close: () => {
      raw.close();
    }
  };
}
