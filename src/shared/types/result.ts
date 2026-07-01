/**
 * Unified result envelope used across the IPC boundary and services.
 * Every fallible operation returns a `Result<T>` so the renderer never sees
 * raw exceptions or stack traces (see docs/ERROR_HANDLING.md).
 */

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';

export type ErrorModule =
  | 'app'
  | 'database'
  | 'storage'
  | 'event'
  | 'template'
  | 'camera'
  | 'print'
  | 'qr'
  | 'diagnostics'
  | 'settings'
  | 'ui';

/**
 * Structured, user-facing error payload.
 * - `message`: technical text for logs.
 * - `userMessage`: friendly "what happened".
 * - `action`: "what to do" guidance for the operator.
 */
export interface AppErrorPayload {
  code: string;
  message: string;
  userMessage: string;
  action: string;
  severity: ErrorSeverity;
  module: ErrorModule;
  details?: string;
  timestamp: string;
}

export interface Ok<T> {
  ok: true;
  data: T;
}

export interface Err {
  ok: false;
  error: AppErrorPayload;
}

export type Result<T> = Ok<T> | Err;

export function ok<T>(data: T): Ok<T> {
  return { ok: true, data };
}

export function isOk<T>(result: Result<T>): result is Ok<T> {
  return result.ok;
}

export function isErr<T>(result: Result<T>): result is Err {
  return !result.ok;
}
