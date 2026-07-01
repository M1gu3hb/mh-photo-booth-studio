import { describe, it, expect } from 'vitest';
import { computePrintCells } from '../../src/shared/lib/printLayout';

describe('computePrintCells', () => {
  it('full mode returns a single cell filling the printable area', () => {
    const cells = computePrintCells({
      sheetW: 1200,
      sheetH: 1800,
      mode: 'full',
      cellCount: 1,
      stripAspect: 0.4,
      margin: 24,
      gap: 14
    });
    expect(cells).toHaveLength(1);
    expect(cells[0]).toMatchObject({ x: 24, y: 24, width: 1152, height: 1752 });
  });

  it('custom mode scales normalized slots to sheet pixels', () => {
    const cells = computePrintCells({
      sheetW: 1000,
      sheetH: 2000,
      mode: 'custom',
      cellCount: 0,
      stripAspect: 0.4,
      margin: 20,
      gap: 10,
      customSlots: [
        { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
        { x: 0.5, y: 0.5, width: 0.25, height: 0.25 }
      ]
    });
    expect(cells).toHaveLength(2);
    expect(cells[0]).toMatchObject({ x: 100, y: 400, width: 300, height: 800 });
    expect(cells[1]).toMatchObject({ x: 500, y: 1000, width: 250, height: 500 });
  });

  it('grid mode falls back to the tight strip grid', () => {
    const cells = computePrintCells({
      sheetW: 1200,
      sheetH: 1800,
      mode: 'grid',
      cellCount: 8,
      stripAspect: 0.4,
      margin: 24,
      gap: 14
    });
    expect(cells).toHaveLength(8);
  });

  it('custom mode with no slots falls back to the grid', () => {
    const cells = computePrintCells({
      sheetW: 1200,
      sheetH: 1800,
      mode: 'custom',
      cellCount: 4,
      stripAspect: 0.4,
      margin: 24,
      gap: 14
    });
    expect(cells).toHaveLength(4);
  });
});
