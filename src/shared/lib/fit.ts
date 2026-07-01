import type { FitMode } from '@shared/types/entities';

export interface SlotBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Source + destination rectangles for canvas `drawImage(img, sx,sy,sw,sh, dx,dy,dw,dh)`. */
export interface DrawRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

/**
 * Computes how an image of `imgW × imgH` should be drawn into `slot` for a
 * given fit mode. Pure function — unit tested; used by the canvas compositor.
 *  - cover:   fill the slot, center-cropping the source (no letterbox).
 *  - contain: fit fully inside the slot, centered (letterbox shows behind).
 *  - stretch: distort to exactly fill the slot.
 */
export function computeDrawRect(slot: SlotBox, imgW: number, imgH: number, fit: FitMode): DrawRect {
  if (imgW <= 0 || imgH <= 0) {
    return { sx: 0, sy: 0, sw: Math.max(imgW, 1), sh: Math.max(imgH, 1), dx: slot.x, dy: slot.y, dw: slot.width, dh: slot.height };
  }

  if (fit === 'stretch') {
    return { sx: 0, sy: 0, sw: imgW, sh: imgH, dx: slot.x, dy: slot.y, dw: slot.width, dh: slot.height };
  }

  if (fit === 'contain') {
    const scale = Math.min(slot.width / imgW, slot.height / imgH);
    const dw = imgW * scale;
    const dh = imgH * scale;
    return {
      sx: 0,
      sy: 0,
      sw: imgW,
      sh: imgH,
      dx: slot.x + (slot.width - dw) / 2,
      dy: slot.y + (slot.height - dh) / 2,
      dw,
      dh
    };
  }

  // cover
  const scale = Math.max(slot.width / imgW, slot.height / imgH);
  const sw = slot.width / scale;
  const sh = slot.height / scale;
  return {
    sx: (imgW - sw) / 2,
    sy: (imgH - sh) / 2,
    sw,
    sh,
    dx: slot.x,
    dy: slot.y,
    dw: slot.width,
    dh: slot.height
  };
}
