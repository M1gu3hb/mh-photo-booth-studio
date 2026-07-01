import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { Icon } from '../Icon';
import './controls.css';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options?: SelectOption[];
}

/** Native select styled as a brass control with a gold chevron. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, id, className, children, ...rest },
  ref
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const describedBy = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined;

  return (
    <div className="pb-field">
      {label && (
        <label className="pb-field__label" htmlFor={selectId}>
          {label}
        </label>
      )}
      <div className={`pb-select ${error ? 'pb-select--error' : ''}`.trim()}>
        <select
          ref={ref}
          id={selectId}
          className={`pb-select__el ${className ?? ''}`.trim()}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <Icon name="next" size={18} className="pb-select__chevron" />
      </div>
      {error ? (
        <span id={`${selectId}-error`} className="pb-field__error">
          {error}
        </span>
      ) : hint ? (
        <span id={`${selectId}-hint`} className="pb-field__hint">
          {hint}
        </span>
      ) : null}
    </div>
  );
});
