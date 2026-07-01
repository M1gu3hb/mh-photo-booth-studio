import { computeDrawRect } from '@shared/lib/fit';
import { computePrintCells, type PrintLayoutMode, type NormalizedSlot } from '@shared/lib/printLayout';
import { paperByKey } from '@shared/constants/print';
import { loadImage, canvasBytes } from './loadImage';

export interface BuildSheetInput {
  /** One final-image data URL per cell (caller duplicates for copies-on-sheet). */
  finalUrls: string[];
  paperKey: string;
  orientation: 'portrait' | 'landscape';
  cellCount: number;
  /** Print-template layout mode (defaults to 'grid' auto-pack). */
  mode?: PrintLayoutMode;
  /** Manual slots (normalized 0..1) for 'custom' mode. */
  customSlots?: NormalizedSlot[];
}

export interface BuildSheetOutput {
  png: ArrayBuffer;
  previewDataUrl: string;
  width: number;
  height: number;
}

/** Arranges session finals onto a paper-sized white sheet (Print Sheet Builder). */
export async function buildSheet(input: BuildSheetInput): Promise<BuildSheetOutput> {
  const paper = paperByKey(input.paperKey);
  let width = paper.widthPx;
  let height = paper.heightPx;
  if (input.orientation === 'landscape') {
    [width, height] = [height, width];
  }
  // Tight packing: small margin + gap so strips fill the sheet (no wasted paper).
  const margin = Math.round(Math.min(width, height) * 0.02);
  const gap = Math.round(Math.min(width, height) * 0.012);
  const mode: PrintLayoutMode = input.mode ?? 'grid';

  // How many cells this layout has, so we only load the strips we need.
  const effectiveCount =
    mode === 'full' ? 1 : mode === 'custom' ? (input.customSlots?.length ?? 0) : Math.max(1, Math.floor(input.cellCount));

  // Load every strip up-front; the first one defines the shared aspect ratio used
  // to size the grid cells (all finals share the event template, so same aspect).
  const images = await Promise.all(
    input.finalUrls.slice(0, Math.max(1, effectiveCount)).map((url) =>
      url ? loadImage(url) : Promise.resolve(null)
    )
  );
  const firstImg = images.find((img) => img !== null) ?? null;
  const stripAspect =
    firstImg && firstImg.naturalHeight > 0 ? firstImg.naturalWidth / firstImg.naturalHeight : width / height;

  const cells = computePrintCells({
    sheetW: width,
    sheetH: height,
    mode,
    cellCount: input.cellCount,
    stripAspect,
    margin,
    gap,
    customSlots: input.customSlots
  });

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear la hoja.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < cells.length; i += 1) {
    const img = images[i];
    if (!img) continue;
    const cell = cells[i]!;
    const r = computeDrawRect(cell, img.naturalWidth, img.naturalHeight, 'contain');
    ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, r.dx, r.dy, r.dw, r.dh);
  }

  const png = await canvasBytes(canvas, 'image/png');
  const scale = Math.min(1, 440 / width);
  const preview = document.createElement('canvas');
  preview.width = Math.max(1, Math.round(width * scale));
  preview.height = Math.max(1, Math.round(height * scale));
  preview.getContext('2d')?.drawImage(canvas, 0, 0, preview.width, preview.height);
  const previewDataUrl = preview.toDataURL('image/jpeg', 0.85);

  return { png, previewDataUrl, width, height };
}
