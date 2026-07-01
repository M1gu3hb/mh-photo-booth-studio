import { type ReactNode } from 'react';
import { Icon } from '../Icon';
import './domain.css';

interface PrintPreviewProps {
  /** Rendered print-sheet image URL (Phase 7). */
  sheetUrl?: string;
  /** Paper description shown under the sheet (e.g. "4x6 · Vertical"). */
  paperLabel?: string;
  orientation?: 'portrait' | 'landscape';
  children?: ReactNode;
}

/** Paper-sheet frame for print previews. Empty state until a sheet is built. */
export function PrintPreview({
  sheetUrl,
  paperLabel,
  orientation = 'portrait',
  children
}: PrintPreviewProps) {
  return (
    <figure className="pb-print">
      <div className={`pb-print__sheet pb-print__sheet--${orientation}`}>
        {sheetUrl ? (
          <img className="pb-print__image" src={sheetUrl} alt="Hoja de impresión" />
        ) : (
          children ?? (
            <div className="pb-print__placeholder">
              <Icon name="print" size={32} strokeWidth={1.5} />
              <span>Sin hoja de impresión</span>
            </div>
          )
        )}
      </div>
      {paperLabel && <figcaption className="pb-print__caption">{paperLabel}</figcaption>}
    </figure>
  );
}
