import { type HTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from '../Icon';
import './surface.css';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  icon?: IconName;
  actions?: ReactNode;
  /** Slightly raised felt panel (one elevation level up). */
  elevated?: boolean;
  bodyClassName?: string;
}

/** Emerald felt panel with gold hairline. The base container surface. */
export function Card({
  title,
  icon,
  actions,
  elevated = false,
  className,
  bodyClassName,
  children,
  ...rest
}: CardProps) {
  const classes = ['pb-card', elevated ? 'pb-card--elevated' : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <section className={classes} {...rest}>
      {(title || actions) && (
        <header className="pb-card__header">
          <div className="pb-card__title">
            {icon && <Icon name={icon} size={20} className="pb-card__title-icon" />}
            {title && <h2>{title}</h2>}
          </div>
          {actions && <div className="pb-card__actions">{actions}</div>}
        </header>
      )}
      <div className={['pb-card__body', bodyClassName ?? ''].filter(Boolean).join(' ')}>
        {children}
      </div>
    </section>
  );
}
