import { useCallback, useEffect, useState } from 'react';
import type { AppSettings, UpdatableSettings } from '@shared/types/settings';
import type { AppErrorPayload } from '@shared/types/result';

interface MutationResult {
  ok: boolean;
  error?: AppErrorPayload;
}

interface UseSettings {
  settings: AppSettings | null;
  loading: boolean;
  error: string | null;
  update: (partial: UpdatableSettings) => Promise<MutationResult>;
  pickDataRoot: () => Promise<string | null>;
  setDataRoot: (path: string) => Promise<MutationResult>;
  reload: () => Promise<void>;
}

/** Loads global settings over IPC and exposes typed mutators that persist. */
export function useSettings(): UseSettings {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const result = await window.photoBooth.settings.get();
    if (result.ok) {
      setSettings(result.data);
      setError(null);
    } else {
      setError(result.error.userMessage);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const update = useCallback(async (partial: UpdatableSettings): Promise<MutationResult> => {
    const result = await window.photoBooth.settings.update(partial);
    if (result.ok) {
      setSettings(result.data);
      return { ok: true };
    }
    return { ok: false, error: result.error };
  }, []);

  const pickDataRoot = useCallback(async (): Promise<string | null> => {
    const result = await window.photoBooth.storage.pickDataRoot();
    return result.ok ? result.data : null;
  }, []);

  const setDataRoot = useCallback(async (path: string): Promise<MutationResult> => {
    const result = await window.photoBooth.storage.setDataRoot(path);
    if (result.ok) {
      setSettings(result.data);
      return { ok: true };
    }
    return { ok: false, error: result.error };
  }, []);

  return { settings, loading, error, update, pickDataRoot, setDataRoot, reload };
}
