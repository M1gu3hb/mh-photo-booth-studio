/** Parsed settings as consumed by the UI. `dataRoot` comes from StorageService. */
export interface AppSettings {
  dataRoot: string;
  soundEnabled: boolean;
  fullscreenDefault: boolean;
  defaultCountdownSeconds: number;
  language: string;
}

/** Settings the UI may change (data root has its own dedicated channel). */
export type UpdatableSettings = Partial<Omit<AppSettings, 'dataRoot' | 'language'>>;
