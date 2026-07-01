export type PrintMethod = 'image' | 'pdf' | 'windows';
export type Orientation = 'portrait' | 'landscape';

export interface PrinterInfo {
  name: string;
  displayName: string;
  isDefault: boolean;
}

/** Sent from the renderer (which builds the sheet PNG) to the print service. */
export interface PrintRequest {
  eventId: string;
  /** Primary session (single-session sheet/reprint), or null for multi-session. */
  sessionId: string | null;
  /** All session ids included on the sheet (recorded on the job). */
  sheetSessions: string[];
  printerName: string | null;
  method: PrintMethod;
  paperSize: string;
  orientation: Orientation;
  /** e.g. "1-up".."4-up". */
  layout: string;
  copies: number;
  sheetBytes: ArrayBuffer;
  sheetWidth: number;
  sheetHeight: number;
}
