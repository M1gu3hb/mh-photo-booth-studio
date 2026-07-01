import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import imageSize from 'image-size';
import { AppError } from '@shared/errors/appError';
import type { PrintRequest, PrinterInfo, PrintMethod, Orientation } from '@shared/types/print';
import type { PrintJobRecord } from '@shared/types/entities';
import type { Repositories } from '../database/repositories';
import type { StorageService } from '../storage/StorageService';
import type { PrintAdapter } from './adapters';

export interface PrintDeps {
  resolveAdapter: (method: PrintMethod) => PrintAdapter;
  listSystemPrinters: () => Promise<PrinterInfo[]>;
}

function asOrientation(value: string | null): Orientation {
  return value === 'landscape' ? 'landscape' : 'portrait';
}

/**
 * Records and runs print jobs. The sheet is ALWAYS saved before sending to any
 * adapter (save-before-print). Every chosen option is recorded on the job
 * (printer, method, copies, paper, layout, orientation, sessions). A failed
 * print never deletes files; the job is marked failed and can be retried.
 */
export class PrintService {
  private readonly repos: Repositories;
  private readonly storage: StorageService;
  private readonly deps: PrintDeps;

  constructor(repos: Repositories, storage: StorageService, deps: PrintDeps) {
    this.repos = repos;
    this.storage = storage;
    this.deps = deps;
  }

  async listPrinters(): Promise<PrinterInfo[]> {
    try {
      return await this.deps.listSystemPrinters();
    } catch {
      return [];
    }
  }

  async testPrinter(name: string): Promise<boolean> {
    const list = await this.listPrinters();
    return list.some((p) => p.name === name);
  }

  listJobs(eventId: string): PrintJobRecord[] {
    return this.repos.printJobs.list({
      where: 'event_id = ?',
      params: [eventId],
      orderBy: 'created_at DESC'
    });
  }

  private sheetRel(eventId: string, jobId: string): string {
    return `events/event_${eventId}/print_sheets/print_sheet_${jobId}.png`;
  }

  async print(request: PrintRequest): Promise<PrintJobRecord> {
    const jobId = randomUUID();
    const sheetRel = this.sheetRel(request.eventId, jobId);

    // Save the sheet BEFORE attempting to print.
    await this.storage.safeWrite(sheetRel, Buffer.from(request.sheetBytes));

    this.repos.printJobs.create({
      id: jobId,
      eventId: request.eventId,
      sessionId: request.sessionId,
      printSheetPath: sheetRel,
      printerName: request.printerName,
      paperSize: request.paperSize,
      copies: request.copies,
      status: 'sent',
      errorCode: null,
      errorMessage: null,
      method: request.method,
      layout: request.layout,
      orientation: request.orientation,
      sheetSessions: JSON.stringify(request.sheetSessions)
    });

    return this.runAdapter(jobId, request.method, {
      printerName: request.printerName,
      copies: request.copies,
      orientation: request.orientation,
      widthPx: request.sheetWidth,
      heightPx: request.sheetHeight,
      sheetAbsPath: this.storage.toAbsolute(sheetRel)
    });
  }

  async retry(jobId: string): Promise<PrintJobRecord> {
    const job = this.repos.printJobs.getById(jobId);
    if (!job) {
      throw new AppError({
        code: 'PRINT_JOB_NOT_FOUND',
        message: 'job missing',
        userMessage: 'No se encontró el trabajo de impresión.',
        action: 'Genera la impresión de nuevo.',
        severity: 'medium',
        module: 'print'
      });
    }
    const sheetAbs = this.storage.toAbsolute(job.printSheetPath);
    if (!existsSync(sheetAbs)) {
      throw new AppError({
        code: 'PRINT_SHEET_FAILED',
        message: 'sheet file missing',
        userMessage: 'No se encontró la hoja de impresión guardada.',
        action: 'Vuelve a generar la impresión desde la sesión.',
        severity: 'high',
        module: 'print'
      });
    }
    let width = 0;
    let height = 0;
    try {
      const dims = imageSize(readFileSync(sheetAbs));
      width = dims.width ?? 0;
      height = dims.height ?? 0;
    } catch {
      // dims only needed by pdf/windows adapters; image adapter ignores them.
    }
    this.repos.printJobs.update(jobId, { status: 'sent', errorCode: null, errorMessage: null });
    return this.runAdapter(jobId, (job.method as PrintMethod) ?? 'image', {
      printerName: job.printerName,
      copies: job.copies,
      orientation: asOrientation(job.orientation),
      widthPx: width,
      heightPx: height,
      sheetAbsPath: sheetAbs
    });
  }

  private async runAdapter(
    jobId: string,
    method: PrintMethod,
    ctx: {
      printerName: string | null;
      copies: number;
      orientation: Orientation;
      widthPx: number;
      heightPx: number;
      sheetAbsPath: string;
    }
  ): Promise<PrintJobRecord> {
    try {
      const adapter = this.deps.resolveAdapter(method);
      await adapter.send({ ...ctx, jobId, storage: this.storage });
      return this.repos.printJobs.update(jobId, { status: 'completed' });
    } catch (err) {
      const appErr = err instanceof AppError ? err : null;
      return this.repos.printJobs.update(jobId, {
        status: 'failed',
        errorCode: appErr?.code ?? 'PRINT_FAILED',
        errorMessage: appErr?.userMessage ?? 'No se pudo imprimir.'
      });
    }
  }
}
