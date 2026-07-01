import { useId } from 'react';
import './controls.css';

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  /** Hide the visible label text (still used for the accessible name). */
  hideLabel?: boolean;
  disabled?: boolean;
}

/** Skeuomorphic switch: brass knob sliding in a sunken felt track. */
export function Toggle({ checked, onChange, label, hideLabel = false, disabled = false }: ToggleProps) {
  const id = useId();
  return (
    <label className={`pb-toggle ${disabled ? 'pb-toggle--disabled' : ''}`.trim()} htmlFor={id}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={hideLabel ? label : undefined}
        disabled={disabled}
        className={`pb-toggle__track ${checked ? 'pb-toggle__track--on' : ''}`.trim()}
        onClick={() => onChange(!checked)}
      >
        <span className="pb-toggle__knob" />
      </button>
      {!hideLabel && <span className="pb-toggle__label">{label}</span>}
    </label>
  );
}
