import { describe, it, expect } from 'vitest';
import { computeDrawRect } from '../../src/shared/lib/fit';

const slot = { x: 100, y: 200, width: 400, height: 300 };

describe('computeDrawRect', () => {
  it('stretch fills the slot exactly using the whole source', () => {
    const r = computeDrawRect(slot, 800, 600, 'stretch');
    expect(r).toMatchObject({ sx: 0, sy: 0, sw: 800, sh: 600, dx: 100, dy: 200, dw: 400, dh: 300 });
  });

  it('cover center-crops the source and fills the slot', () => {
    // image 800x400 (wider than slot 4:3) → crop width.
    const r = computeDrawRect(slot, 800, 400, 'cover');
    expect(r.dx).toBe(100);
    expect(r.dw).toBe(400);
    expect(r.dh).toBe(300);
    // scale = max(400/800, 300/400)=0.75 → sw=400/0.75=533.3, sh=300/0.75=400
    expect(Math.round(r.sw)).toBe(533);
    expect(Math.round(r.sh)).toBe(400);
    expect(r.sy).toBe(0); // full height used
    expect(r.sx).toBeGreaterThan(0); // cropped horizontally
  });

  it('contain fits inside and centers (letterbox)', () => {
    // image 800x400 into 400x300 slot → scale=min(0.5,0.75)=0.5 → 400x200, centered vertically.
    const r = computeDrawRect(slot, 800, 400, 'contain');
    expect(r.sw).toBe(800);
    expect(r.sh).toBe(400);
    expect(r.dw).toBe(400);
    expect(r.dh).toBe(200);
    expect(r.dx).toBe(100);
    expect(r.dy).toBe(250); // 200 + (300-200)/2
  });

  it('handles degenerate image dimensions without NaN', () => {
    const r = computeDrawRect(slot, 0, 0, 'cover');
    expect(Number.isFinite(r.dw)).toBe(true);
    expect(Number.isFinite(r.dh)).toBe(true);
  });
});
