"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { EventsProvider } from "@/context/EventsContext";
import { MessagesProvider } from "@/context/MessagesContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <EventsProvider>
        <MessagesProvider>{children}</MessagesProvider>
      </EventsProvider>
    </AuthProvider>
  );
}
