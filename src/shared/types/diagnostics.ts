export type CheckStatus = 'ok' | 'warn' | 'error';

export interface DiagnosticsCheck {
  key: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

/** Snapshot for the diagnostics board + exported report. No photos, no PII. */
export interface DiagnosticsReport {
  generatedAt: string;
  version: string;
  platform: string;
  environment: string;
  dataRoot: string;
  diskFreeBytes: number;
  diskTotalBytes: number;
  counts: { events: number; templates: number; sessions: number };
  printers: string[];
  cameraLabel: string;
  checks: DiagnosticsCheck[];
  recentErrors: string[];
}
