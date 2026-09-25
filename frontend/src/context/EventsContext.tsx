"use client";

import { createContext, useCallback, useContext, useMemo, ReactNode } from "react";
import { api, describeError } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { useScopedData } from "@/hooks/useScopedData";
import { EventItem } from "@/types/event";
import { EventFormValues, toEventInput, toEventItem } from "@/lib/eventMappers";

interface EventsContextValue {
  /** Events visible to the signed-in user (an organizer also gets their own drafts). */
  events: EventItem[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  createEvent: (values: EventFormValues) => Promise<EventItem>;
  updateEvent: (eventId: string, values: EventFormValues) => Promise<EventItem>;
  publishEvent: (eventId: string) => Promise<void>;
  cancelEvent: (eventId: string) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
}

const EventsContext = createContext<EventsContextValue | null>(null);

async function fetchEvents() {
  return (await api.events.listEvents()).map(toEventItem);
}

const NO_EVENTS: EventItem[] = [];

export function EventsProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;
  const { data, error, loaded, reload } = useScopedData(userId, fetchEvents);

  const createEvent = useCallback(
    async (values: EventFormValues) => {
      const created = toEventItem(await api.events.createEvent(toEventInput(values, "draft")));
      await reload();
      return created;
    },
    [reload],
  );

  const updateEvent = useCallback(
    async (eventId: string, values: EventFormValues) => {
      const updated = toEventItem(await api.events.updateEvent(Number(eventId), toEventInput(values)));
      await reload();
      return updated;
    },
    [reload],
  );

  const publishEvent = useCallback(
    async (eventId: string) => {
      await api.events.updateEvent(Number(eventId), { status: "published" });
      await reload();
    },
    [reload],
  );

  const cancelEvent = useCallback(
    async (eventId: string) => {
      await api.events.updateEvent(Number(eventId), { status: "cancelled" });
      await reload();
    },
    [reload],
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      await api.events.deleteEvent(Number(eventId));
      await reload();
    },
    [reload],
  );

  const value = useMemo<EventsContextValue>(
    () => ({
      events: data ?? NO_EVENTS,
      loading: userId !== null && !loaded,
      error: error ? describeError(error, "Could not load events.") : "",
      refresh: reload,
      createEvent,
      updateEvent,
      publishEvent,
      cancelEvent,
      deleteEvent,
    }),
    [data, error, loaded, userId, reload, createEvent, updateEvent, publishEvent, cancelEvent, deleteEvent],
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) throw new Error("useEvents must be used within an EventsProvider");
  return context;
}
