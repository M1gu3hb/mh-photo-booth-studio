import { type ReactNode } from 'react';
import { Icon } from '../Icon';
import './domain.css';

interface TemplatePreviewProps {
  /** Resolved image URL for the composed/base image. */
  imageUrl?: string;
  /** Intrinsic template size, used to keep the preview aspect correct. */
  widthPx?: number;
  heightPx?: number;
  /** Slot overlays (Phase 4 editor draws boxes here). */
  children?: ReactNode;
  alt?: string;
}

/** Framed preview of a template / composition. Honest empty state when no image. */
export function TemplatePreview({
  imageUrl,
  widthPx,
  heightPx,
  children,
  alt = 'Vista previa de plantilla'
}: TemplatePreviewProps) {
  const aspect = widthPx && heightPx ? `${widthPx} / ${heightPx}` : '2 / 3';
  return (
    <div className="pb-tpl">
      <div className="pb-tpl__stage" style={{ aspectRatio: aspect }}>
        {imageUrl ? (
          <img className="pb-tpl__image" src={imageUrl} alt={alt} />
        ) : (
          <div className="pb-tpl__placeholder">
            <Icon name="templates" size={34} strokeWidth={1.5} />
            <span>Sin imagen de plantilla</span>
          </div>
        )}
        {children && <div className="pb-tpl__overlay">{children}</div>}
      </div>
    </div>
  );
}
