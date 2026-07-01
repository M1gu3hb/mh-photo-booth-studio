import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { Icon, type IconName } from '../Icon';
import './button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

/**
 * Tactile brass control. Hover lifts brightness, active "presses" (inverted
 * gradient + inset shadow + 1px translate), disabled goes matte. Always renders
 * its text label alongside any icon so meaning is never icon-only.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'left',
    fullWidth = false,
    type = 'button',
    className,
    children,
    ...rest
  },
  ref
) {
  const classes = [
    'pb-btn',
    `pb-btn--${variant}`,
    `pb-btn--${size}`,
    fullWidth ? 'pb-btn--block' : '',
    className ?? ''
  ]
    .filter(Boolean)
    .join(' ');

  const iconSize = size === 'lg' ? 24 : size === 'sm' ? 16 : 20;

  return (
    <button ref={ref} type={type} className={classes} {...rest}>
      {icon && iconPosition === 'left' && <Icon name={icon} size={iconSize} className="pb-btn__icon" />}
      {children != null && <span className="pb-btn__label">{children}</span>}
      {icon && iconPosition === 'right' && <Icon name={icon} size={iconSize} className="pb-btn__icon" />}
    </button>
  );
});

/** Convenience wrappers matching docs/DESIGN_SYSTEM.md component list. */
export const PrimaryButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  function PrimaryButton(props, ref) {
    return <Button ref={ref} variant="primary" {...props} />;
  }
);

export const DangerButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  function DangerButton(props, ref) {
    return <Button ref={ref} variant="danger" {...props} />;
  }
);
