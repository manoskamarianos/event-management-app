"use client";

import { createContext, useContext, useEffect, useMemo, ReactNode } from "react";
import { api } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { useScopedData } from "@/hooks/useScopedData";

interface MessagesContextValue {
  /** Unread messages in the signed-in user's inbox, for the header indicator. */
  unreadCount: number;
  refreshUnread: () => Promise<void>;
}

const POLL_INTERVAL_MS = 30_000;

const MessagesContext = createContext<MessagesContextValue | null>(null);

async function fetchUnreadCount() {
  return (await api.messages.listInbox()).filter((message) => !message.read).length;
}

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  // The messaging endpoints are limited to organizers and participants.
  const canMessage = currentUser?.role === "organizer" || currentUser?.role === "participant";
  const scope = currentUser && canMessage ? currentUser.id : null;
  const { data, reload } = useScopedData(scope, fetchUnreadCount);

  useEffect(() => {
    if (scope === null) return;
    const timer = window.setInterval(reload, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [scope, reload]);

  const value = useMemo(() => ({ unreadCount: data ?? 0, refreshUnread: reload }), [data, reload]);

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (!context) throw new Error("useMessages must be used within a MessagesProvider");
  return context;
}
