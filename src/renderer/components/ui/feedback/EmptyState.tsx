import { type ReactNode } from 'react';
import { Icon, type IconName } from '../Icon';
import './feedback.css';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  /** Optional real action (e.g. "Crear evento"). Never a fake/no-op button. */
  action?: ReactNode;
  compact?: boolean;
}

/**
 * The honest stand-in for "nothing here yet". Used wherever data does not exist
 * so the UI never shows invented/hardcoded values (BUILD_CRITERIA §4).
 */
export function EmptyState({ icon = 'info', title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`pb-empty ${compact ? 'pb-empty--compact' : ''}`.trim()} role="status">
      <span className="pb-empty__icon" aria-hidden>
        <Icon name={icon} size={compact ? 26 : 38} strokeWidth={1.5} />
      </span>
      <h3 className="pb-empty__title">{title}</h3>
      {description && <p className="pb-empty__desc">{description}</p>}
      {action && <div className="pb-empty__action">{action}</div>}
    </div>
  );
}
