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
  /** Composed final (data URL) shown on the review screen, else null. */
  finalUrl: string | null;
  autoMode: boolean;
  eventName: string;
}

/** Commands the public window sends back to the operator (auto mode). */
export type LiveCommand = 'start' | 'print' | 'finalize' | 'retake';
