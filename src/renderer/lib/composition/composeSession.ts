import { computeDrawRect } from '@shared/lib/fit';
import type { TemplateSlotRecord } from '@shared/types/entities';
import { loadImage, canvasBytes } from './loadImage';

export interface ComposeInput {
  baseImageUrl: string;
  widthPx: number;
  heightPx: number;
  slots: TemplateSlotRecord[];
  /** Captured photo data URLs, in capture order. */
  photoUrls: string[];
  /** QR image data URL (already generated for the event), or null. */
  qrDataUrl: string | null;
  /** Token → value map for text slots (e.g. "{event_name}" → "XV de Ana"). */
  texts: Record<string, string>;
}

export interface ComposeOutput {
  png: ArrayBuffer;
  jpg: ArrayBuffer;
  thumb: ArrayBuffer;
  previewDataUrl: string;
  width: number;
  height: number;
}

export class CompositionError extends Error {
  readonly code: string;
  readonly action: string;
  constructor(code: string, message: string, action: string) {
    super(message);
    this.code = code;
    this.action = action;
  }
}

function resolveText(slotKey: string, texts: Record<string, string>): string {
  return texts[slotKey] ?? slotKey;
}

function drawText(ctx: CanvasRenderingContext2D, slot: TemplateSlotRecord, text: string): void {
  let fontSize = Math.max(12, Math.floor(slot.height * 0.7));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const maxWidth = slot.width * 0.96;
  do {
    ctx.font = `600 ${fontSize}px Cinzel, "Times New Roman", serif`;
    if (ctx.measureText(text).width <= maxWidth || fontSize <= 12) break;
    fontSize -= 2;
  } while (fontSize > 12);
  ctx.fillStyle = '#f4efe2';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = Math.max(2, fontSize * 0.08);
  ctx.fillText(text, slot.x + slot.width / 2, slot.y + slot.height / 2, maxWidth);
  ctx.shadowBlur = 0;
}

/**
 * Composes the final image on a canvas at the template's full resolution:
 * base → photo slots (with fit) → QR → text, by z-index. Returns PNG + JPG +
 * thumbnail bytes plus a preview data URL. Pure rendering — saving is the
 * caller's job (save-before-print).
 */
export async function composeSession(input: ComposeInput): Promise<ComposeOutput> {
  const photoSlots = input.slots
    .filter((s) => s.slotType === 'photo')
    .sort((a, b) => a.slotKey.localeCompare(b.slotKey, undefined, { numeric: true }));

  if (photoSlots.length < input.photoUrls.length) {
    throw new CompositionError(
      'SLOT_COUNT_MISMATCH',
      'La plantilla no tiene suficientes espacios para esta sesión.',
      'Usa otra plantilla o cambia el número de fotos del evento.'
    );
  }

  await (document.fonts?.ready ?? Promise.resolve());

  const canvas = document.createElement('canvas');
  canvas.width = input.widthPx;
  canvas.height = input.heightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new CompositionError('TEMPLATE_INVALID', 'No se pudo crear el lienzo.', 'Reintenta.');

  // Background base image.
  const base = await loadImage(input.baseImageUrl);
  ctx.drawImage(base, 0, 0, input.widthPx, input.heightPx);

  // Map photos to photo slots in order.
  const slotPhoto = new Map<string, string>();
  photoSlots.forEach((slot, i) => {
    const url = input.photoUrls[i];
    if (url) slotPhoto.set(slot.id, url);
  });

  const ordered = [...input.slots].sort((a, b) => a.zIndex - b.zIndex);
  for (const slot of ordered) {
    if (slot.slotType === 'photo') {
      const url = slotPhoto.get(slot.id);
      if (!url) continue;
      const img = await loadImage(url);
      const r = computeDrawRect(slot, img.naturalWidth, img.naturalHeight, slot.fitMode);
      ctx.save();
      ctx.beginPath();
      ctx.rect(slot.x, slot.y, slot.width, slot.height);
      ctx.clip();
      ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, r.dx, r.dy, r.dw, r.dh);
      ctx.restore();
    } else if (slot.slotType === 'qr') {
      if (!input.qrDataUrl) continue;
      const img = await loadImage(input.qrDataUrl);
      const r = computeDrawRect(slot, img.naturalWidth, img.naturalHeight, 'contain');
      ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, r.dx, r.dy, r.dw, r.dh);
    } else if (slot.slotType === 'text') {
      drawText(ctx, slot, resolveText(slot.slotKey, input.texts));
    }
  }

  const png = await canvasBytes(canvas, 'image/png');
  const jpg = await canvasBytes(canvas, 'image/jpeg', 0.92);

  // Thumbnail for history / quick preview.
  const thumbScale = Math.min(1, 480 / input.widthPx);
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = Math.max(1, Math.round(input.widthPx * thumbScale));
  thumbCanvas.height = Math.max(1, Math.round(input.heightPx * thumbScale));
  const thumbCtx = thumbCanvas.getContext('2d');
  if (thumbCtx) thumbCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
  const thumb = await canvasBytes(thumbCanvas, 'image/jpeg', 0.82);
  const previewDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.82);

  return { png, jpg, thumb, previewDataUrl, width: input.widthPx, height: input.heightPx };
}
