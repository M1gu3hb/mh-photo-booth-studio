/** Supported event types (PRD). `key` is stored; `label` is shown in the UI. */
export interface EventTypeOption {
  key: string;
  label: string;
}

export const EVENT_TYPES: EventTypeOption[] = [
  { key: 'xv', label: 'XV años' },
  { key: 'boda', label: 'Boda' },
  { key: 'bautizo', label: 'Bautizo' },
  { key: 'graduacion', label: 'Graduación' },
  { key: 'empresa', label: 'Evento empresarial' },
  { key: 'fiesta', label: 'Fiesta privada' },
  { key: 'otro', label: 'Otro / personalizado' }
];

export function eventTypeLabel(key: string): string {
  return EVENT_TYPES.find((t) => t.key === key)?.label ?? key;
}
