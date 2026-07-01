import { readFileSync } from 'node:fs';
import { BrowserWindow } from 'electron';
import { PRINT_DPI } from '@shared/constants/print';
import { AppError } from '@shared/errors/appError';
import type { PrintMethod } from '@shared/types/print';
import type { StorageService } from '../storage/StorageService';

export interface AdapterContext {
  sheetAbsPath: string;
  jobId: string;
  printerName: string | null;
  copies: number;
  orientation: 'portrait' | 'landscape';
  widthPx: number;
  heightPx: number;
  storage: StorageService;
}

export interface PrintAdapter {
  readonly method: PrintMethod;
  send(ctx: AdapterContext): Promise<{ outputPath: string | null }>;
}

function sheetHtml(sheetAbsPath: string, widthPx: number, heightPx: number): string {
  const dataUrl = `data:image/png;base64,${readFileSync(sheetAbsPath).toString('base64')}`;
  const wIn = widthPx / PRINT_DPI;
  const hIn = heightPx / PRINT_DPI;
  return (
    '<!doctype html><html><head><meta charset="utf-8"><style>' +
    `@page { size: ${wIn}in ${hIn}in; margin: 0; }` +
    'html,body{margin:0;padding:0;}img{width:100%;display:block;}' +
    `</style></head><body><img src="${dataUrl}"></body></html>`
  );
}

async function offscreenWindow(html: string): Promise<BrowserWindow> {
  const win = new BrowserWindow({
    show: false,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
  });
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  return win;
}

/** Reliable, offline: writes the sheet PNG to exports/ for external printing. */
export const imageExportAdapter: PrintAdapter = {
  method: 'image',
  async send(ctx) {
    const buffer = readFileSync(ctx.sheetAbsPath);
    const out = await ctx.storage.safeWrite(`exports/print_${ctx.jobId}.png`, buffer);
    return { outputPath: out };
  }
};

/** Renders the sheet to a PDF in exports/ (no printer needed). */
export const pdfExportAdapter: PrintAdapter = {
  method: 'pdf',
  async send(ctx) {
    const win = await offscreenWindow(sheetHtml(ctx.sheetAbsPath, ctx.widthPx, ctx.heightPx));
    try {
      const pdf = await win.webContents.printToPDF({
        printBackground: true,
        preferCSSPageSize: true,
        margins: { top: 0, bottom: 0, left: 0, right: 0 }
      });
      const out = await ctx.storage.safeWrite(`exports/print_${ctx.jobId}.pdf`, pdf);
      return { outputPath: out };
    } catch (err) {
      throw new AppError({
        code: 'PRINT_RENDER_FAILED',
        message: `printToPDF failed: ${String(err)}`,
        userMessage: 'No se pudo preparar la hoja de impresión.',
        action: 'Revisa el tamaño de papel o imprime una tira individual.',
        severity: 'high',
        module: 'print'
      });
    } finally {
      win.destroy();
    }
  }
};

/** Sends to a Windows printer via the OS. Requires a selected, available printer. */
export const windowsPrintAdapter: PrintAdapter = {
  method: 'windows',
  async send(ctx) {
    if (!ctx.printerName) {
      throw new AppError({
        code: 'PRINTER_NOT_SELECTED',
        message: 'No printer selected',
        userMessage: 'No hay impresora seleccionada.',
        action: 'Selecciona una impresora en Configuración o Impresión.',
        severity: 'high',
        module: 'print'
      });
    }
    const win = await offscreenWindow(sheetHtml(ctx.sheetAbsPath, ctx.widthPx, ctx.heightPx));
    try {
      const success = await new Promise<boolean>((resolve) => {
        win.webContents.print(
          {
            silent: true,
            printBackground: true,
            deviceName: ctx.printerName ?? '',
            copies: Math.max(1, ctx.copies),
            landscape: ctx.orientation === 'landscape'
          },
          (ok) => resolve(ok)
        );
      });
      if (!success) {
        throw new AppError({
          code: 'PRINT_SEND_FAILED',
          message: 'webContents.print returned failure',
          userMessage: 'No se pudo imprimir.',
          action: 'La foto ya quedó guardada. Puedes reintentar desde Historial.',
          severity: 'high',
          module: 'print'
        });
      }
      return { outputPath: null };
    } finally {
      win.destroy();
    }
  }
};

export function adapterForMethod(method: PrintMethod): PrintAdapter {
  if (method === 'pdf') return pdfExportAdapter;
  if (method === 'windows') return windowsPrintAdapter;
  return imageExportAdapter;
}
