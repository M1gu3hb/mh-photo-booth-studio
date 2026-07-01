import type { PhotoBoothApi } from '@shared/types/api';

declare global {
  interface Window {
    /** Secure bridge exposed by the preload (see src/preload/index.ts). */
    photoBooth: PhotoBoothApi;
  }
}

export {};
