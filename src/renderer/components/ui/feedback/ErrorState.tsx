import { type ReactNode } from 'react';
import { Icon } from '../Icon';
import './feedback.css';

interface ErrorStateProps {
  /** Friendly "what happened". */
  userMessage: string;
  /** "What to do" guidance. */
  action?: string;
  /** Technical code, shown small for support (never a stack trace in event mode). */
  code?: string;
  retry?: ReactNode;
  compact?: boolean;
}

/**
 * Renders an error the way docs/ERROR_HANDLING.md requires: what happened +
 * what to do, with an optional recovery action. No raw stack traces.
 */
export function ErrorState({ userMessage, action, code, retry, compact = false }: ErrorStateProps) {
  return (
    <div className={`pb-error ${compact ? 'pb-error--compact' : ''}`.trim()} role="alert">
      <span className="pb-error__icon" aria-hidden>
        <Icon name="warning" size={compact ? 24 : 34} strokeWidth={1.75} />
      </span>
      <div className="pb-error__content">
        <p className="pb-error__message">{userMessage}</p>
        {action && <p className="pb-error__action">{action}</p>}
        {code && <span className="pb-error__code">{code}</span>}
      </div>
      {retry && <div className="pb-error__retry">{retry}</div>}
    </div>
  );
}
