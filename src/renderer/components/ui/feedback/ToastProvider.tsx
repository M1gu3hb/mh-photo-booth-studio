import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { Icon, type IconName } from '../Icon';
import { type StatusTone } from './StatusBadge';
import './feedback.css';

interface ToastInput {
  tone?: StatusTone;
  title: string;
  message?: string;
  durationMs?: number;
}

interface ToastItem extends Required<Omit<ToastInput, 'message'>> {
  id: string;
  message?: string;
}

interface ToastContextValue {
  notify: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_ICON: Record<StatusTone, IconName> = {
  neutral: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'warning',
  info: 'info',
  active: 'retry'
};

const DEFAULT_DURATION = 4200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (input: ToastInput) => {
      counter.current += 1;
      const id = `toast-${counter.current}`;
      const item: ToastItem = {
        id,
        tone: input.tone ?? 'neutral',
        title: input.title,
        message: input.message,
        durationMs: input.durationMs ?? DEFAULT_DURATION
      };
      setItems((prev) => [...prev, item]);
      window.setTimeout(() => dismiss(id), item.durationMs);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pb-toast-stack" aria-live="polite" aria-atomic="false">
        {items.map((item) => (
          <div key={item.id} className={`pb-toast pb-toast--${item.tone}`} role="status">
            <Icon name={TONE_ICON[item.tone]} size={20} className="pb-toast__icon" />
            <div className="pb-toast__body">
              <strong className="pb-toast__title">{item.title}</strong>
              {item.message && <span className="pb-toast__message">{item.message}</span>}
            </div>
            <button
              type="button"
              className="pb-toast__close"
              onClick={() => dismiss(item.id)}
              aria-label="Cerrar aviso"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
