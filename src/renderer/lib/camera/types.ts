import type { CameraKind } from '@shared/types/camera';

export interface CaptureResult {
  bytes: ArrayBuffer;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Hardware-agnostic camera adapter (renderer side, since webcam capture needs
 * getUserMedia). Webcam is the functional default; Mock generates synthetic
 * frames so the full flow runs with no hardware (HARDWARE.md). Capture-card
 * cameras appear as webcams; DSLR/watch-folder adapters are future work.
 */
export interface CameraAdapter {
  readonly kind: CameraKind;
  readonly label: string;
  start(): Promise<void>;
  stop(): void;
  getStream(): MediaStream | null;
  capture(source: HTMLVideoElement | null): Promise<CaptureResult>;
}

export interface CameraErrorInfo {
  userMessage: string;
  action: string;
}

/** Translate a getUserMedia failure into a friendly message + action. */
export function describeCameraError(err: unknown): CameraErrorInfo {
  const name = err instanceof DOMException ? err.name : '';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return {
      userMessage: 'No se encontró la cámara seleccionada.',
      action: 'Conecta la cámara o selecciona otra en Configuración.'
    };
  }
  if (name === 'NotReadableError') {
    return {
      userMessage: 'La cámara está siendo usada por otro programa.',
      action: 'Cierra otras apps que usen la cámara y reintenta.'
    };
  }
  if (name === 'NotAllowedError') {
    return {
      userMessage: 'No hay permiso para usar la cámara.',
      action: 'Concede permiso de cámara y reintenta.'
    };
  }
  return {
    userMessage: 'No se pudo iniciar la vista previa.',
    action: 'Selecciona otra cámara o usa la cámara simulada en Configuración.'
  };
}

export async function listVideoInputs(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === 'videoinput');
}

export async function canvasToResult(canvas: HTMLCanvasElement): Promise<CaptureResult> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
  );
  if (!blob) throw new Error('No se pudo generar la imagen.');
  const bytes = await blob.arrayBuffer();
  return { bytes, dataUrl: canvas.toDataURL('image/jpeg', 0.85), width: canvas.width, height: canvas.height };
}
