import Database from 'better-sqlite3';
import type { Db, DbStatement } from './types';

/**
 * Opens a better-sqlite3 connection and adapts it to the `Db` interface.
 * WAL journaling keeps reads non-blocking during writes; foreign keys on.
 */
export function openBetterSqlite(filePath: string): Db {
  const raw = new Database(filePath);
  raw.pragma('journal_mode = WAL');
  raw.pragma('foreign_keys = ON');

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
          return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
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
