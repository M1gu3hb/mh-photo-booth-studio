import './domain.css';

interface CountdownDisplayProps {
  /** The big value (a remaining second, or a word like "¡Ya!"). */
  value: number | string;
  caption?: string;
}

/**
 * Giant ceremonial countdown number. The `value` is used as the React key so a
 * fresh scale-in animation fires on every change (Phase 5/9 drive it).
 */
export function CountdownDisplay({ value, caption }: CountdownDisplayProps) {
  return (
    <div className="pb-countdown" role="timer" aria-live="assertive">
      <span key={String(value)} className="pb-countdown__value">
        {value}
      </span>
      {caption && <span className="pb-countdown__caption">{caption}</span>}
    </div>
  );
}
