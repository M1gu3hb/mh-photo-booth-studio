import type { CameraAdapter, CaptureResult } from './types';
import { canvasToResult } from './types';

/**
 * Clearly-labelled synthetic camera (HARDWARE.md). Generates a distinct frame
 * each capture so the full session flow works with no physical camera.
 */
export class MockAdapter implements CameraAdapter {
  readonly kind = 'mock' as const;
  readonly label = 'Cámara simulada (mock)';
  private frame = 0;

  async start(): Promise<void> {
    // No device to acquire.
  }

  getStream(): MediaStream | null {
    return null;
  }

  stop(): void {
    // Nothing to release.
  }

  async capture(): Promise<CaptureResult> {
    this.frame += 1;
    const width = 1280;
    const height = 960;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo crear el lienzo simulado.');

    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, `hsl(${(this.frame * 47) % 360}, 45%, 30%)`);
    grad.addColorStop(1, '#061711');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#f6eac2';
    ctx.font = 'bold 120px serif';
    ctx.textAlign = 'center';
    ctx.fillText('MOCK', width / 2, height / 2 - 20);
    ctx.font = '40px sans-serif';
    ctx.fillText(`Cámara simulada · foto ${this.frame}`, width / 2, height / 2 + 60);
    ctx.font = '28px sans-serif';
    ctx.fillText(new Date().toLocaleTimeString('es-MX'), width / 2, height / 2 + 120);

    return canvasToResult(canvas);
  }
}
