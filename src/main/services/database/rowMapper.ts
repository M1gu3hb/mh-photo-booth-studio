/**
 * Structural mapping between SQLite snake_case columns and camelCase domain
 * fields. Purely mechanical — no per-field knowledge — so it works for every
 * table. Numbers/strings/null pass through unchanged (integer flags stay 0/1).
 */

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_match, char: string) => char.toUpperCase());
}

function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
}

/** Convert a raw DB row (possibly null-prototype) into a camelCase object. */
export function rowToCamel<T>(row: unknown): T {
  const source = row as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(source)) {
    out[snakeToCamel(key)] = source[key];
  }
  return out as T;
}

export function rowsToCamel<T>(rows: unknown[]): T[] {
  return rows.map((row) => rowToCamel<T>(row));
}

/** Convert a camelCase object into snake_case columns for insert/update. */
export function camelToColumns(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    out[camelToSnake(key)] = obj[key];
  }
  return out;
}
