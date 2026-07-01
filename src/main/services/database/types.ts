/**
 * Minimal SQLite driver surface used by repositories and the migration runner.
 * Implemented by `betterSqlite.ts` (production) and a `node:sqlite` adapter
 * (tests). Keeping repos on this interface lets identical SQL run under both,
 * sidestepping the native-ABI mismatch between Electron and the Node test runner.
 *
 * All SQL uses positional `?` parameters so both drivers behave identically.
 */
export interface DbRunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

export interface DbStatement {
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
  run(...params: unknown[]): DbRunResult;
}

export interface Db {
  exec(sql: string): void;
  prepare(sql: string): DbStatement;
  /** Runs `fn` inside BEGIN/COMMIT, rolling back on throw. */
  transaction<T>(fn: () => T): T;
  close(): void;
}

export interface Migration {
  version: number;
  name: string;
  sql: string;
}
