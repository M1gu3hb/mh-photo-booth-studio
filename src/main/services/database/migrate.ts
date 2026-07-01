import type { Db } from './types';
import { MIGRATIONS } from './migrations';

/** Highest migration version known to this build. */
export const LATEST_SCHEMA_VERSION = MIGRATIONS.reduce((max, m) => Math.max(max, m.version), 0);

interface UserVersionRow {
  user_version: number;
}

function getSchemaVersion(db: Db): number {
  const row = db.prepare('PRAGMA user_version').get() as UserVersionRow | undefined;
  return row?.user_version ?? 0;
}

/**
 * Applies all pending migrations in order, each inside its own transaction,
 * advancing `PRAGMA user_version`. Idempotent: running again with no new
 * migrations is a no-op. Returns the resulting schema version.
 */
export function runMigrations(db: Db): number {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  let current = getSchemaVersion(db);
  const pending = MIGRATIONS.filter((m) => m.version > current).sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    db.transaction(() => {
      db.exec(migration.sql);
      db.prepare('INSERT OR REPLACE INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
        migration.version,
        migration.name,
        new Date().toISOString()
      );
    });
    // user_version cannot be parameterized; the value is an internal integer.
    db.exec(`PRAGMA user_version = ${migration.version}`);
    current = migration.version;
  }

  return current;
}

export function getCurrentSchemaVersion(db: Db): number {
  return getSchemaVersion(db);
}
