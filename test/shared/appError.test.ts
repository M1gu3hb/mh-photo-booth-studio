import { describe, it, expect } from 'vitest';
import { AppError, toAppError } from '@shared/errors/appError';
import { ok, isOk, isErr } from '@shared/types/result';

describe('AppError', () => {
  it('carries the full user-facing payload', () => {
    const error = new AppError({
      code: 'CAMERA_NOT_FOUND',
      message: 'device index 0 missing',
      userMessage: 'No se encontró la cámara seleccionada.',
      action: 'Conecta la cámara o selecciona otra desde Configuración.',
      severity: 'high',
      module: 'camera'
    });

    const payload = error.toPayload();
    expect(payload.code).toBe('CAMERA_NOT_FOUND');
    expect(payload.userMessage).toContain('cámara');
    expect(payload.action).toContain('Configuración');
    expect(payload.severity).toBe('high');
    expect(payload.module).toBe('camera');
    expect(payload.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('defaults severity to medium and module to app', () => {
    const error = new AppError({
      code: 'X',
      message: 'm',
      userMessage: 'u',
      action: 'a'
    });
    expect(error.severity).toBe('medium');
    expect(error.module).toBe('app');
  });
});

describe('toAppError', () => {
  it('passes AppError payloads through unchanged', () => {
    const original = new AppError({
      code: 'PRINT_FAILED',
      message: 'spooler down',
      userMessage: 'No se pudo imprimir.',
      action: 'Reintenta desde Historial.',
      module: 'print'
    });
    const payload = toAppError(original);
    expect(payload.code).toBe('PRINT_FAILED');
    expect(payload.module).toBe('print');
  });

  it('normalizes unknown errors with a friendly message and captures details', () => {
    const payload = toAppError(new Error('boom'), 'storage');
    expect(payload.code).toBe('UNEXPECTED_ERROR');
    expect(payload.module).toBe('storage');
    expect(payload.userMessage).toBeTruthy();
    expect(payload.action).toBeTruthy();
    expect(payload.details).toContain('boom');
  });

  it('handles non-Error thrown values', () => {
    const payload = toAppError('string failure');
    expect(payload.code).toBe('UNEXPECTED_ERROR');
    expect(payload.message).toBe('string failure');
  });
});

describe('Result helpers', () => {
  it('discriminates ok and err results', () => {
    const good = ok(42);
    expect(isOk(good)).toBe(true);
    expect(isErr(good)).toBe(false);
    if (isOk(good)) {
      expect(good.data).toBe(42);
    }
  });
});
