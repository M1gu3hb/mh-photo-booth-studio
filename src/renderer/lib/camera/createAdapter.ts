import type { CameraConfig } from '@shared/types/camera';
import type { CameraAdapter } from './types';
import { WebcamAdapter } from './WebcamAdapter';
import { MockAdapter } from './MockAdapter';

export function createAdapter(config: CameraConfig): CameraAdapter {
  if (config.kind === 'mock') {
    return new MockAdapter();
  }
  return new WebcamAdapter(config.deviceId, config.label ?? 'Cámara');
}
