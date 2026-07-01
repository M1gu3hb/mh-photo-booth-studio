import { IPC_CHANNELS } from '@shared/constants/ipc';
import { AppError } from '@shared/errors/appError';
import type { PrinterInfo, PrintRequest, PrintMethod, Orientation } from '@shared/types/print';
import type { PrintJobRecord } from '@shared/types/entities';
import { getContext } from '../context';
import { handle } from './handle';

function requireId(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new AppError({
      code: 'INVALID_ARGUMENT',
      message: `${field} required`,
      userMessage: 'Falta un dato requerido.',
      action: 'Reintenta.',
      severity: 'medium',
      module: 'print'
    });
  }
  return value;
}

function asPrintRequest(raw: unknown): PrintRequest {
  const r = (raw ?? {}) as Record<string, unknown>;
  const method: PrintMethod = r.method === 'pdf' ? 'pdf' : r.method === 'windows' ? 'windows' : 'image';
  const orientation: Orientation = r.orientation === 'landscape' ? 'landscape' : 'portrait';
  if (!(r.sheetBytes instanceof ArrayBuffer)) {
    throw new AppError({
      code: 'PRINT_RENDER_FAILED',
      message: 'sheetBytes missing',
      userMessage: 'No se pudo preparar la hoja de impresión.',
      action: 'Reintenta la impresión.',
      severity: 'high',
      module: 'print'
    });
  }
  return {
    eventId: requireId(r.eventId, 'eventId'),
    sessionId: typeof r.sessionId === 'string' && r.sessionId ? r.sessionId : null,
    sheetSessions: Array.isArray(r.sheetSessions) ? (r.sheetSessions as string[]) : [],
    printerName: typeof r.printerName === 'string' && r.printerName ? r.printerName : null,
    method,
    paperSize: typeof r.paperSize === 'string' ? r.paperSize : '4x6',
    orientation,
    layout: typeof r.layout === 'string' ? r.layout : '1-up',
    copies: typeof r.copies === 'number' && r.copies > 0 ? Math.floor(r.copies) : 1,
    sheetBytes: r.sheetBytes,
    sheetWidth: typeof r.sheetWidth === 'number' ? r.sheetWidth : 0,
    sheetHeight: typeof r.sheetHeight === 'number' ? r.sheetHeight : 0
  };
}

export function registerPrintHandlers(): void {
  handle(IPC_CHANNELS.print.listPrinters, 'print', (): Promise<PrinterInfo[]> =>
    getContext().print.listPrinters()
  );

  handle(IPC_CHANNELS.print.test, 'print', (name: unknown): Promise<boolean> =>
    getContext().print.testPrinter(requireId(name, 'printerName'))
  );

  handle(IPC_CHANNELS.print.print, 'print', (raw: unknown): Promise<PrintJobRecord> =>
    getContext().print.print(asPrintRequest(raw))
  );

  handle(IPC_CHANNELS.print.retry, 'print', (jobId: unknown): Promise<PrintJobRecord> =>
    getContext().print.retry(requireId(jobId, 'jobId'))
  );

  handle(IPC_CHANNELS.print.listJobs, 'print', (eventId: unknown): PrintJobRecord[] =>
    getContext().print.listJobs(requireId(eventId, 'eventId'))
  );
}
