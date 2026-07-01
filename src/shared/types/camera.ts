/** How frames are sourced. `webcam` = getUserMedia (USB / capture card). */
export type CameraKind = 'webcam' | 'mock';

export interface CameraConfig {
  kind: CameraKind;
  /** Selected mediaDevices deviceId (webcam), or null for the default device. */
  deviceId: string | null;
  /** Human-readable device label (shown in diagnostics). */
  label: string | null;
}
