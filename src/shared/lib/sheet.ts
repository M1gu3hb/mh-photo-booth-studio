import type { SlotBox } from '@shared/lib/fit';

/**
 * Arranges `count` cells in a single row across a sheet, honoring margin and
 * gap. Used by the Print Sheet Builder to place strips/sessions side by side
 * (e.g. two strips on a 4×6). Pure function — unit tested.
 */
export function computeSheetCells(
  sheetW: number,
  sheetH: number,
  count: number,
  margin: number,
  gap: number
): SlotBox[] {
  const n = Math.max(1, Math.floor(count));
  const usableW = sheetW - 2 * margin - (n - 1) * gap;
  const cellW = usableW / n;
  const cellH = sheetH - 2 * margin;
  const cells: SlotBox[] = [];
  for (let i = 0; i < n; i += 1) {
    cells.push({
      x: margin + i * (cellW + gap),
      y: margin,
      width: cellW,
      height: cellH
    });
  }
  return cells;
}

export interface StripGrid {
  cells: SlotBox[];
  rows: number;
  cols: number;
  /** Cell size (matches the strip aspect, so strips fill cells with no waste). */
  cellWidth: number;
  cellHeight: number;
}

/**
 * Packs `count` strips of a fixed aspect ratio into the best rows×cols grid that
 * maximizes strip size while fitting the sheet — filling the page instead of
 * leaving big empty bands (e.g. 8 strips → 4 cols × 2 rows). Cells are sized to
 * `stripAspect` (width/height) so each strip fills its cell with no wasted space.
 * Rows are centered. Pure function — unit tested.
 */
export function computeStripGrid(
  sheetW: number,
  sheetH: number,
  count: number,
  stripAspect: number,
  margin: number,
  gap: number
): StripGrid {
  const n = Math.max(1, Math.floor(count));
  const aspect = stripAspect > 0 ? stripAspect : sheetW / sheetH;
  const usableW = Math.max(1, sheetW - 2 * margin);
  const usableH = Math.max(1, sheetH - 2 * margin);

  let best: { cols: number; rows: number; cellW: number; cellH: number; area: number } | null = null;
  for (let cols = 1; cols <= n; cols += 1) {
    const rows = Math.ceil(n / cols);
    const cellMaxW = (usableW - (cols - 1) * gap) / cols;
    const cellMaxH = (usableH - (rows - 1) * gap) / rows;
    if (cellMaxW <= 0 || cellMaxH <= 0) continue;
    // Fit the strip aspect inside the available cell box.
    let cellW = cellMaxW;
    let cellH = cellW / aspect;
    if (cellH > cellMaxH) {
      cellH = cellMaxH;
      cellW = cellH * aspect;
    }
    const area = cellW * cellH;
    if (!best || area > best.area) best = { cols, rows, cellW, cellH, area };
  }

  const chosen = best ?? { cols: n, rows: 1, cellW: usableW, cellH: usableH, area: 0 };
  const { cols, rows, cellW, cellH } = chosen;
  const blockH = rows * cellH + (rows - 1) * gap;
  const startY = margin + Math.max(0, (usableH - blockH) / 2);

  const cells: SlotBox[] = [];
  for (let r = 0; r < rows; r += 1) {
    const cellsInRow = Math.min(cols, n - r * cols);
    if (cellsInRow <= 0) break;
    const rowW = cellsInRow * cellW + (cellsInRow - 1) * gap;
    const startX = margin + Math.max(0, (usableW - rowW) / 2);
    for (let c = 0; c < cellsInRow; c += 1) {
      cells.push({
        x: startX + c * (cellW + gap),
        y: startY + r * (cellH + gap),
        width: cellW,
        height: cellH
      });
    }
  }
  return { cells, rows, cols, cellWidth: cellW, cellHeight: cellH };
}
