/** Print constants. Pixel sizes are at 300 DPI, portrait orientation. */
export const PRINT_DPI = 300;

export interface PaperSize {
  key: string;
  label: string;
  widthPx: number;
  heightPx: number;
}

export const PAPER_SIZES: PaperSize[] = [
  { key: '4x6', label: '4×6" (postal)', widthPx: 1200, heightPx: 1800 },
  { key: '2x6', label: 'Tira 2×6"', widthPx: 600, heightPx: 1800 },
  { key: 'letter', label: 'Carta', widthPx: 2550, heightPx: 3300 },
  { key: 'a4', label: 'A4', widthPx: 2480, heightPx: 3508 }
];

export function paperByKey(key: string): PaperSize {
  return PAPER_SIZES.find((p) => p.key === key) ?? PAPER_SIZES[0]!;
}

export const PRINT_METHODS = [
  { key: 'image', label: 'Exportar imagen (PNG)' },
  { key: 'pdf', label: 'Exportar PDF' },
  { key: 'windows', label: 'Imprimir (Windows)' }
] as const;

/** Strips per sheet. The builder packs them in the tightest rows×cols grid that
 * fills the paper (e.g. 8 → 4 cols × 2 rows), so more strips = less wasted paper. */
export const SHEET_LAYOUTS = [1, 2, 3, 4, 6, 8, 10, 12] as const;

export const MAX_PRINT_COPIES = 20;
