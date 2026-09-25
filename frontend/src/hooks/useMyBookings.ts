"use client";

import { api, describeError } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { useEvents } from "@/context/EventsContext";
import { useScopedData } from "@/hooks/useScopedData";
import { toMyBooking } from "@/lib/eventMappers";
import { MyBooking } from "@/types/event";

const fetchBookings = () => api.bookings.listBookings();

/** The signed-in participant's own bookings (the API only serves these to participants). */
export function useMyBookings() {
  const { currentUser } = useAuth();
  const { events } = useEvents();
  const scope = currentUser?.role === "participant" ? currentUser.id : null;
  const { data, error, loaded, reload } = useScopedData(scope, fetchBookings);

  const bookings: MyBooking[] = (data ?? []).map((dto) => toMyBooking(dto, events));

  return {
    bookings,
    loading: scope !== null && !loaded,
    error: error ? describeError(error, "Could not load your bookings.") : "",
    reload,
  };
}
