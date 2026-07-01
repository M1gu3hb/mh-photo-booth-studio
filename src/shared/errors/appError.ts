import type {
  AppErrorPayload,
  ErrorModule,
  ErrorSeverity
} from '@shared/types/result';

interface AppErrorInit {
  code: string;
  message: string;
  userMessage: string;
  action: string;
  severity?: ErrorSeverity;
  module?: ErrorModule;
  details?: string;
}

/**
 * Domain error carrying the full user-facing payload.
 * Services throw `AppError`; the IPC layer converts it to a `Result` `Err`.
 */
export class AppError extends Error {
  readonly code: string;
  readonly userMessage: string;
  readonly action: string;
  readonly severity: ErrorSeverity;
  readonly module: ErrorModule;
  readonly details: string | undefined;
  readonly timestamp: string;

  constructor(init: AppErrorInit) {
    super(init.message);
    this.name = 'AppError';
    this.code = init.code;
    this.userMessage = init.userMessage;
    this.action = init.action;
    this.severity = init.severity ?? 'medium';
    this.module = init.module ?? 'app';
    this.details = init.details;
    this.timestamp = new Date().toISOString();
  }

  toPayload(): AppErrorPayload {
    return {
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      action: this.action,
      severity: this.severity,
      module: this.module,
      ...(this.details !== undefined ? { details: this.details } : {}),
      timestamp: this.timestamp
    };
  }
}

/**
 * Normalize any thrown value into a structured payload so the renderer
 * always receives a friendly message + action, never a raw stack trace.
 */
export function toAppError(
  err: unknown,
  fallbackModule: ErrorModule = 'app'
): AppErrorPayload {
  if (err instanceof AppError) {
    return err.toPayload();
  }

  const details = err instanceof Error ? (err.stack ?? err.message) : String(err);
  return {
    code: 'UNEXPECTED_ERROR',
    message: err instanceof Error ? err.message : String(err),
    userMessage: 'Ocurrió un error inesperado.',
    action: 'Reintenta la acción. Si continúa, exporta el diagnóstico desde Diagnóstico.',
    severity: 'high',
    module: fallbackModule,
    details,
    timestamp: new Date().toISOString()
  };
}
