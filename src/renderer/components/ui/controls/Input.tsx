import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import './controls.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

/** Sunken brass-rimmed text field with label, hint and error states. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, id, className, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="pb-field">
      {label && (
        <label className="pb-field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`pb-input ${error ? 'pb-input--error' : ''} ${className ?? ''}`.trim()}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {error ? (
        <span id={`${inputId}-error`} className="pb-field__error">
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} className="pb-field__hint">
          {hint}
        </span>
      ) : null}
    </div>
  );
});
