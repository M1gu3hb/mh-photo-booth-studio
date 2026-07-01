import { randomUUID } from 'node:crypto';
import type { Db } from './types';
import { rowToCamel, rowsToCamel, camelToColumns } from './rowMapper';

interface RepoOptions {
  /** Set false for tables with only `created_at` (e.g. session_photos). */
  hasUpdatedAt?: boolean;
}

interface ListOptions {
  where?: string;
  params?: unknown[];
  orderBy?: string;
  limit?: number;
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}

/**
 * Generic CRUD for tables with a TEXT `id` PK and timestamp columns.
 * Table/column identifiers come only from our own typed code (never external
 * input); all user-supplied VALUES are bound with positional `?` parameters.
 */
export class BaseRepository<
  TRecord extends { id: string },
  TCreate extends Record<string, unknown>
> {
  protected readonly db: Db;
  protected readonly table: string;
  private readonly hasUpdatedAt: boolean;

  constructor(db: Db, table: string, options: RepoOptions = {}) {
    this.db = db;
    this.table = table;
    this.hasUpdatedAt = options.hasUpdatedAt ?? true;
  }

  protected now(): string {
    return new Date().toISOString();
  }

  create(input: TCreate & { id?: string }): TRecord {
    const now = this.now();
    const record: Record<string, unknown> = {
      id: input.id ?? randomUUID(),
      ...input,
      createdAt: now
    };
    if (this.hasUpdatedAt) record.updatedAt = now;

    const columns = camelToColumns(stripUndefined(record));
    const keys = Object.keys(columns);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${placeholders})`;
    this.db.prepare(sql).run(...keys.map((key) => columns[key]));
    return this.requireById(record.id as string);
  }

  getById(id: string): TRecord | null {
    const row = this.db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(id);
    return row ? rowToCamel<TRecord>(row) : null;
  }

  requireById(id: string): TRecord {
    const found = this.getById(id);
    if (!found) {
      throw new Error(`${this.table} row not found: ${id}`);
    }
    return found;
  }

  list(options: ListOptions = {}): TRecord[] {
    let sql = `SELECT * FROM ${this.table}`;
    if (options.where) sql += ` WHERE ${options.where}`;
    if (options.orderBy) sql += ` ORDER BY ${options.orderBy}`;
    if (options.limit != null) sql += ` LIMIT ${Math.trunc(options.limit)}`;
    const rows = this.db.prepare(sql).all(...(options.params ?? []));
    return rowsToCamel<TRecord>(rows);
  }

  update(id: string, patch: Partial<TCreate>): TRecord {
    const merged: Record<string, unknown> = { ...stripUndefined(patch as Record<string, unknown>) };
    if (this.hasUpdatedAt) merged.updatedAt = this.now();
    const columns = camelToColumns(merged);
    const keys = Object.keys(columns);
    if (keys.length === 0) return this.requireById(id);
    const assignments = keys.map((key) => `${key} = ?`).join(', ');
    const sql = `UPDATE ${this.table} SET ${assignments} WHERE id = ?`;
    this.db.prepare(sql).run(...keys.map((key) => columns[key]), id);
    return this.requireById(id);
  }

  delete(id: string): void {
    this.db.prepare(`DELETE FROM ${this.table} WHERE id = ?`).run(id);
  }

  count(where?: string, params?: unknown[]): number {
    let sql = `SELECT COUNT(*) AS n FROM ${this.table}`;
    if (where) sql += ` WHERE ${where}`;
    const row = this.db.prepare(sql).get(...(params ?? [])) as { n: number };
    return row.n;
  }
}
