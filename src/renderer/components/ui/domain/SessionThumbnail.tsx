import { Icon } from '../Icon';
import './domain.css';

interface SessionThumbnailProps {
  thumbnailUrl?: string;
  label?: string;
  timestamp?: string;
  onOpen?: () => void;
  selected?: boolean;
}

/** Framed session thumbnail for the history grid. Honest placeholder if no image. */
export function SessionThumbnail({
  thumbnailUrl,
  label,
  timestamp,
  onOpen,
  selected = false
}: SessionThumbnailProps) {
  const interactive = typeof onOpen === 'function';
  const content = (
    <>
      <div className="pb-thumb__frame">
        {thumbnailUrl ? (
          <img className="pb-thumb__image" src={thumbnailUrl} alt={label ?? 'Sesión'} />
        ) : (
          <span className="pb-thumb__placeholder" aria-hidden>
            <Icon name="image" size={26} strokeWidth={1.5} />
          </span>
        )}
      </div>
      {(label || timestamp) && (
        <div className="pb-thumb__meta">
          {label && <span className="pb-thumb__label">{label}</span>}
          {timestamp && <span className="pb-thumb__time">{timestamp}</span>}
        </div>
      )}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        className={`pb-thumb pb-thumb--button ${selected ? 'pb-thumb--selected' : ''}`.trim()}
        onClick={onOpen}
      >
        {content}
      </button>
    );
  }
  return <div className={`pb-thumb ${selected ? 'pb-thumb--selected' : ''}`.trim()}>{content}</div>;
}
