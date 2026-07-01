import { Icon } from '../Icon';
import './controls.css';

interface StepperProps {
  steps: string[];
  /** Zero-based index of the active step. */
  current: number;
}

/** Horizontal numbered progress indicator with brass connectors. */
export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="pb-stepper" aria-label="Progreso">
      {steps.map((label, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'todo';
        return (
          <li
            key={label}
            className={`pb-stepper__step pb-stepper__step--${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className="pb-stepper__marker">
              {state === 'done' ? <Icon name="check" size={16} /> : index + 1}
            </span>
            <span className="pb-stepper__label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
