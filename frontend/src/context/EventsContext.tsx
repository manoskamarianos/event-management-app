"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { api, describeError } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { EventItem } from "@/types/event";
import { EventFormValues, toEventItem, toEventPayload } from "@/lib/eventMappers";

interface RefreshOptions {
  /** Skip the freshness cache, e.g. right after changing an event. */
  force?: boolean;
}

interface EventsContextValue {
  /**
   * Every event visible to the signed-in user. This is a full download (all pages), so nothing
   * loads it automatically: pages that need it call `refresh()`. Browsing uses server-side
   * search instead (see `api.events.searchEvents`).
   */
  events: EventItem[];
  loading: boolean;
  error: string;
  /** Loads (or re-uses, when fresh) the full list and resolves with it. */
  refresh: (options?: RefreshOptions) => Promise<EventItem[]>;
  createEvent: (values: EventFormValues) => Promise<EventItem>;
  updateEvent: (eventId: string, values: EventFormValues) => Promise<EventItem>;
  publishEvent: (eventId: string) => Promise<void>;
  cancelEvent: (eventId: string) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
}

const EventsContext = createContext<EventsContextValue | null>(null);

/** How long a downloaded list is reused before a page asks the API again. */
const FRESH_MS = 30_000;

const NO_EVENTS: EventItem[] = [];

interface Snapshot {
  scope: number;
  events: EventItem[];
  error: unknown;
}

async function fetchEvents() {
  return (await api.events.listEvents()).map(toEventItem);
}

export function EventsProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  // Refs let `refresh` stay stable while still seeing the current user and the current download.
  const userIdRef = useRef(userId);
  const cache = useRef<{ scope: number; at: number; events: EventItem[] } | null>(null);
  const inflight = useRef<Promise<EventItem[]> | null>(null);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const refresh = useCallback(async (options: RefreshOptions = {}): Promise<EventItem[]> => {
    const scope = userIdRef.current;
    if (scope === null) return NO_EVENTS;

    const cached = cache.current;
    if (!options.force && cached?.scope === scope && Date.now() - cached.at < FRESH_MS) {
      return cached.events;
    }
    if (inflight.current) {
      if (!options.force) return inflight.current;
      // A change was just made: wait for the download already under way, then fetch again.
      await inflight.current.catch(() => undefined);
    }

    const run = (async () => {
      try {
        const events = await fetchEvents();
        if (userIdRef.current === scope) {
          cache.current = { scope, at: Date.now(), events };
          setSnapshot({ scope, events, error: null });
        }
        return events;
      } catch (error) {
        if (userIdRef.current === scope) {
          setSnapshot((current) => ({
            scope,
            events: current?.scope === scope ? current.events : NO_EVENTS,
            error,
          }));
        }
        return cache.current?.scope === scope ? cache.current.events : NO_EVENTS;
      } finally {
        inflight.current = null;
      }
    })();
    inflight.current = run;
    return run;
  }, []);

  const createEvent = useCallback(
    async (values: EventFormValues) => {
      const created = toEventItem(await api.events.createEvent(toEventPayload(values, "draft")));
      await refresh({ force: true });
      return created;
    },
    [refresh],
  );

  const updateEvent = useCallback(
    async (eventId: string, values: EventFormValues) => {
      const updated = toEventItem(await api.events.updateEvent(Number(eventId), toEventPayload(values)));
      await refresh({ force: true });
      return updated;
    },
    [refresh],
  );

  const publishEvent = useCallback(
    async (eventId: string) => {
      await api.events.updateEvent(Number(eventId), { status: "published" });
      await refresh({ force: true });
    },
    [refresh],
  );

  const cancelEvent = useCallback(
    async (eventId: string) => {
      await api.events.updateEvent(Number(eventId), { status: "cancelled" });
      await refresh({ force: true });
    },
    [refresh],
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      await api.events.deleteEvent(Number(eventId));
      await refresh({ force: true });
    },
    [refresh],
  );

  const current = snapshot !== null && snapshot.scope === userId ? snapshot : null;

  const value = useMemo<EventsContextValue>(
    () => ({
      events: current?.events ?? NO_EVENTS,
      loading: userId !== null && current === null,
      error: current?.error ? describeError(current.error, "Could not load events.") : "",
      refresh,
      createEvent,
      updateEvent,
      publishEvent,
      cancelEvent,
      deleteEvent,
    }),
    [current, userId, refresh, createEvent, updateEvent, publishEvent, cancelEvent, deleteEvent],
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) throw new Error("useEvents must be used within an EventsProvider");
  return context;
}
