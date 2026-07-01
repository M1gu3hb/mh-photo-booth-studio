import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import type { EventRecord } from '@shared/types/entities';
import type { EventInput } from '@shared/types/events';
import type { AppErrorPayload, Result } from '@shared/types/result';

export type MutationResult<T> = { ok: true; data: T } | { ok: false; error: AppErrorPayload };

interface EventsContextValue {
  events: EventRecord[];
  activeEvent: EventRecord | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createEvent: (input: EventInput) => Promise<MutationResult<EventRecord>>;
  updateEvent: (id: string, input: EventInput) => Promise<MutationResult<EventRecord>>;
  archiveEvent: (id: string) => Promise<MutationResult<EventRecord>>;
  setActiveEvent: (id: string) => Promise<MutationResult<EventRecord>>;
}

const EventsContext = createContext<EventsContextValue | null>(null);

/** Centralized events state (server state) shared by Topbar, Dashboard and Events screen. */
export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [activeEvent, setActiveEventState] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [listRes, activeRes] = await Promise.all([
      window.photoBooth.events.list(),
      window.photoBooth.events.getActive()
    ]);
    if (listRes.ok) {
      setEvents(listRes.data);
      setError(null);
    } else {
      setError(listRes.error.userMessage);
    }
    if (activeRes.ok) {
      setActiveEventState(activeRes.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runAndRefresh = useCallback(
    async (promise: Promise<Result<EventRecord>>): Promise<MutationResult<EventRecord>> => {
      const result = await promise;
      if (result.ok) {
        await refresh();
        return { ok: true, data: result.data };
      }
      return { ok: false, error: result.error };
    },
    [refresh]
  );

  const value = useMemo<EventsContextValue>(
    () => ({
      events,
      activeEvent,
      loading,
      error,
      refresh,
      createEvent: (input) => runAndRefresh(window.photoBooth.events.create(input)),
      updateEvent: (id, input) => runAndRefresh(window.photoBooth.events.update(id, input)),
      archiveEvent: (id) => runAndRefresh(window.photoBooth.events.archive(id)),
      setActiveEvent: (id) => runAndRefresh(window.photoBooth.events.setActive(id))
    }),
    [events, activeEvent, loading, error, refresh, runAndRefresh]
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents(): EventsContextValue {
  const ctx = useContext(EventsContext);
  if (!ctx) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return ctx;
}
