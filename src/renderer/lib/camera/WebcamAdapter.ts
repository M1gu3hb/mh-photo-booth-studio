import type { CameraAdapter, CaptureResult } from './types';
import { canvasToResult } from './types';

/** USB / capture-card webcam via getUserMedia. */
export class WebcamAdapter implements CameraAdapter {
  readonly kind = 'webcam' as const;
  readonly label: string;
  private readonly deviceId: string | null;
  private stream: MediaStream | null = null;

  constructor(deviceId: string | null, label: string) {
    this.deviceId = deviceId;
    this.label = label || 'Cámara';
  }

  async start(): Promise<void> {
    const video: MediaTrackConstraints = {
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    };
    if (this.deviceId) {
      video.deviceId = { exact: this.deviceId };
    }
    this.stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }

  async capture(source: HTMLVideoElement | null): Promise<CaptureResult> {
    if (!source || source.videoWidth === 0) {
      throw new Error('La vista previa no está lista.');
    }
    const width = source.videoWidth;
    const height = source.videoHeight;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo crear el lienzo de captura.');
    ctx.drawImage(source, 0, 0, width, height);
    return canvasToResult(canvas);
  }
}
