/**
 * Live session state broadcast from the operator window to the public-display
 * window (Fase 14). Kept small and serializable so it travels over IPC cheaply.
 */
export type LiveSessionPhase = 'idle' | 'countdown' | 'capturing' | 'flash' | 'composing' | 'review';

export interface LiveSessionState {
  phase: LiveSessionPhase;
  /** 0-based index of the photo being captured. */
  photoIndex: number;
  photoCount: number;
  countdown: number | null;
  poseText: string;
  autoMode: boolean;
  eventName: string;
  /** Web publish result for the finished session (QR to scan), else null. */
  qrDataUrl: string | null;
  folio: string | null;
  /** Auto mode variant: show the QR screen instead of print/next buttons. */
  qrInsteadOfPrint: boolean;
}

/** Commands the public window sends back to the operator (auto mode). */
export type LiveCommand = 'start' | 'print' | 'finalize' | 'retake';
