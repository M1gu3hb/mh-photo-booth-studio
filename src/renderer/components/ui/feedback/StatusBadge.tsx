import { type ReactNode } from 'react';
import { Icon, type IconName } from '../Icon';
import './feedback.css';

export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'active';

interface StatusBadgeProps {
  tone: StatusTone;
  children: ReactNode;
  icon?: IconName;
  /** Soft pulse for in-progress states (capturing / printing). */
  pulse?: boolean;
}

const DEFAULT_ICON: Record<StatusTone, IconName> = {
  neutral: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'warning',
  info: 'info',
  active: 'retry'
};

/**
 * Communicates state with color + icon + text together (never color alone),
 * satisfying the accessibility rule in DESIGN_SYSTEM / DESIGN_BRAND §3.
 */
export function StatusBadge({ tone, children, icon, pulse = false }: StatusBadgeProps) {
  return (
    <span className={`pb-badge pb-badge--${tone} ${pulse ? 'pb-badge--pulse' : ''}`.trim()}>
      <Icon name={icon ?? DEFAULT_ICON[tone]} size={15} className="pb-badge__icon" />
      <span className="pb-badge__label">{children}</span>
    </span>
  );
}
