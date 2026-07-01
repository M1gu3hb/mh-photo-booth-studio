import { describe, it, expect } from 'vitest';
import { computeSheetCells, computeStripGrid } from '../../src/shared/lib/sheet';

describe('computeSheetCells', () => {
  it('arranges N cells in a row honoring margin and gap', () => {
    const cells = computeSheetCells(1000, 600, 2, 40, 20);
    expect(cells).toHaveLength(2);
    // usableW = 1000 - 80 - 20 = 900 → cellW 450; cellH = 600 - 80 = 520
    expect(cells[0]).toMatchObject({ x: 40, y: 40, width: 450, height: 520 });
    expect(cells[1]?.x).toBe(40 + 450 + 20);
  });

  it('single cell fills the margin box', () => {
    const cells = computeSheetCells(1200, 1800, 1, 50, 30);
    expect(cells).toHaveLength(1);
    expect(cells[0]).toMatchObject({ x: 50, y: 50, width: 1100, height: 1700 });
  });
});

describe('computeStripGrid', () => {
  const SHEET_W = 1200;
  const SHEET_H = 1800;
  const MARGIN = 24;
  const GAP = 14;

  it('packs 8 tall strips as 4 columns × 2 rows (fills the sheet)', () => {
    const aspect = 0.4; // vertical strip (w/h)
    const grid = computeStripGrid(SHEET_W, SHEET_H, 8, aspect, MARGIN, GAP);
    expect(grid.cells).toHaveLength(8);
    expect(grid.cols).toBe(4);
    expect(grid.rows).toBe(2);
    // Cells keep the strip aspect, so there is no wasted space inside each cell.
    expect(grid.cellWidth / grid.cellHeight).toBeCloseTo(aspect, 2);
  });

  it('keeps every cell inside the sheet bounds', () => {
    const grid = computeStripGrid(SHEET_W, SHEET_H, 6, 0.45, MARGIN, GAP);
    expect(grid.cells).toHaveLength(6);
    for (const c of grid.cells) {
      expect(c.x).toBeGreaterThanOrEqual(MARGIN - 0.5);
      expect(c.y).toBeGreaterThanOrEqual(MARGIN - 0.5);
      expect(c.x + c.width).toBeLessThanOrEqual(SHEET_W - MARGIN + 0.5);
      expect(c.y + c.height).toBeLessThanOrEqual(SHEET_H - MARGIN + 0.5);
    }
  });

  it('stacks wide strips vertically (1 column) on a portrait sheet', () => {
    const grid = computeStripGrid(SHEET_W, SHEET_H, 4, 3.0, MARGIN, GAP);
    expect(grid.cells).toHaveLength(4);
    expect(grid.cols).toBe(1);
    expect(grid.rows).toBe(4);
  });

  it('a tight grid yields bigger strips than a single row', () => {
    const aspect = 0.4;
    const grid = computeStripGrid(SHEET_W, SHEET_H, 8, aspect, MARGIN, GAP);
    const row = computeSheetCells(SHEET_W, SHEET_H, 8, MARGIN, GAP);
    const gridArea = grid.cellWidth * grid.cellHeight;
    // Single-row cell: strip fit by aspect inside a full-height thin column.
    const rowCellH = row[0]!.height;
    const rowStripH = Math.min(rowCellH, row[0]!.width / aspect);
    const rowStripW = rowStripH * aspect;
    expect(gridArea).toBeGreaterThan(rowStripW * rowStripH);
  });
});
