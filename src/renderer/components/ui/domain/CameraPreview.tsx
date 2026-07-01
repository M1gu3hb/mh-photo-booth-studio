import { type ReactNode } from 'react';
import { Icon } from '../Icon';
import './domain.css';

interface CameraPreviewProps {
  /** The live <video> element (Phase 5). When absent, a "no signal" frame shows. */
  children?: ReactNode;
  /** Aspect ratio of the lens window, e.g. "4 / 3". */
  aspect?: string;
  /** Short status caption beneath the lens (e.g. "Cámara lista"). */
  caption?: string;
}

/** Brass lens ring framing the live preview, with a diagonal glass reflection. */
export function CameraPreview({ children, aspect = '4 / 3', caption }: CameraPreviewProps) {
  return (
    <figure className="pb-cam">
      <div className="pb-cam__lens" style={{ aspectRatio: aspect }}>
        <div className="pb-cam__glass">
          {children ?? (
            <div className="pb-cam__nosignal">
              <Icon name="camera" size={40} strokeWidth={1.5} />
              <span>Sin señal de cámara</span>
            </div>
          )}
        </div>
        <span className="pb-cam__reflection" aria-hidden />
      </div>
      {caption && <figcaption className="pb-cam__caption">{caption}</figcaption>}
    </figure>
  );
}
