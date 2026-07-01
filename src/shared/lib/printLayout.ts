import type { SlotBox } from './fit';
import { computeStripGrid } from './sheet';

export type PrintLayoutMode = 'grid' | 'custom' | 'full';

export interface NormalizedSlot {
  /** Normalized 0..1 coordinates relative to the sheet. */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PrintLayoutInput {
  sheetW: number;
  sheetH: number;
  mode: PrintLayoutMode;
  /** Strips per sheet for 'grid' mode. */
  cellCount: number;
  /** Strip aspect ratio (width/height) used to size grid cells. */
  stripAspect: number;
  margin: number;
  gap: number;
  /** Manual slots (normalized) for 'custom' mode. */
  customSlots?: NormalizedSlot[];
}

/**
 * Resolves a print template into concrete sheet cells (px boxes):
 *  - 'full'   → one cell filling the printable area.
 *  - 'custom' → the manual slots scaled from normalized to sheet pixels.
 *  - 'grid'   → the tight rows×cols grid from {@link computeStripGrid}.
 * Pure function — unit tested.
 */
export function computePrintCells(input: PrintLayoutInput): SlotBox[] {
  const { sheetW, sheetH, margin } = input;
  if (input.mode === 'full') {
    return [
      {
        x: margin,
        y: margin,
        width: Math.max(1, sheetW - 2 * margin),
        height: Math.max(1, sheetH - 2 * margin)
      }
    ];
  }
  if (input.mode === 'custom' && input.customSlots && input.customSlots.length > 0) {
    return input.customSlots.map((s) => ({
      x: s.x * sheetW,
      y: s.y * sheetH,
      width: s.width * sheetW,
      height: s.height * sheetH
    }));
  }
  return computeStripGrid(sheetW, sheetH, input.cellCount, input.stripAspect, margin, input.gap).cells;
}
