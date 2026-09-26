"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { useEvents } from "@/context/EventsContext";
import { useMyBookings } from "@/hooks/useMyBookings";
import { useScopedData } from "@/hooks/useScopedData";
import { toEventItem } from "@/lib/eventMappers";
import { formatDate, recommendEventsFor } from "@/lib/eventHelpers";
import { decodeEntities } from "@/lib/text";
import { readVisited } from "@/lib/visitedEvents";
import EventCard from "@/components/EventCard";
import RequireRole from "@/components/RequireRole";
import StatusBadge from "@/components/StatusBadge";

export default function HomePage() {
  return (
    <RequireRole roles={["organizer", "participant", "guest"]}>
      <Home />
    </RequireRole>
  );
}

// Recommendations are a nice-to-have: any failure just means "no server recommendations".
async function fetchRecommendations() {
  try {
    return (await api.events.listRecommendations()).map(toEventItem);
  } catch {
    return [];
  }
}

function Home() {
  const { currentUser } = useAuth();
  const { events, refresh } = useEvents();
  const { bookings, loading: bookingsLoading } = useMyBookings();

  // Recommendations and "My bookings" links need the event list (a one-off, cached download).
  useEffect(() => {
    refresh();
  }, [refresh]);
  // Rendered only once the session is known (see RequireRole), so reading storage here is safe.
  const [visited] = useState(() => (currentUser ? new Set(readVisited(currentUser.id)) : new Set<string>()));

  const bookedEventIds = new Set(
    bookings.flatMap((booking) =>
      booking.eventId && booking.status !== "CANCELLED" ? [booking.eventId] : [],
    ),
  );
  const isOrganizer = currentUser?.role === "organizer";
  const isParticipant = currentUser?.role === "participant";

  // Recommendations are based on what the user booked or looked at. With no history there is
  // nothing to recommend from, and asking the server anyway is not free: for a user it does
  // not know yet it starts retraining the model, which slows the whole backend down.
  const hasHistory = bookings.length > 0 || visited.size > 0;

  // Only participants are part of the trained model. The server does not filter its answer, so
  // drop events that cannot be booked or were already booked.
  const { data: modelRecommendations } = useScopedData(
    isParticipant && currentUser && !bookingsLoading && hasHistory ? currentUser.id : null,
    fetchRecommendations,
  );
  const fromModel = (modelRecommendations ?? [])
    .filter((event) => event.status === "PUBLISHED" && !bookedEventIds.has(event.eventId))
    .slice(0, 3);
  // Without model output (new users, guests) fall back to the events they booked or visited.
  const recommended = !hasHistory
    ? []
    : fromModel.length > 0
      ? fromModel
      : recommendEventsFor(events, bookedEventIds, visited);

  return (
    <div className="flex flex-1 flex-col px-4 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Welcome back, {decodeEntities(currentUser?.firstName) || currentUser?.username}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          What would you like to do today?
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {isOrganizer && (
            <Link
              href="/events/manage"
              className="rounded-xl border border-black/[.08] bg-white p-6 shadow-sm transition-colors hover:border-black/[.16] dark:border-white/[.145] dark:bg-zinc-900 dark:hover:border-white/[.25]"
            >
              <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
                Manage events
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Create a new event, review your active events and their bookings.
              </p>
            </Link>
          )}
          <Link
            href="/events"
            className="rounded-xl border border-black/[.08] bg-white p-6 shadow-sm transition-colors hover:border-black/[.16] dark:border-white/[.145] dark:bg-zinc-900 dark:hover:border-white/[.25]"
          >
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
              Browse &amp; search events
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {isParticipant
                ? "Find events by category, date, price or location and book your tickets."
                : "Find events by category, date, price or location."}
            </p>
          </Link>
        </div>

        {isParticipant && bookings.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">My bookings</h2>
            <ul className="mt-4 divide-y divide-black/[.08] overflow-hidden rounded-xl border border-black/[.08] dark:divide-white/[.145] dark:border-white/[.145]">
              {bookings.slice(0, 5).map((booking) => (
                <li
                  key={booking.bookingId}
                  className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 text-sm dark:bg-zinc-950"
                >
                  <span className="text-zinc-950 dark:text-zinc-50">
                    {booking.eventId ? (
                      <Link href={`/events/${booking.eventId}`} className="font-medium hover:underline">
                        {booking.eventTitle}
                      </Link>
                    ) : (
                      <span className="font-medium">{booking.eventTitle}</span>
                    )}{" "}
                    <span className="text-zinc-500 dark:text-zinc-400">
                      · {booking.numberOfTickets} ticket{booking.numberOfTickets === 1 ? "" : "s"} ·
                      €{booking.totalCost.toFixed(2)} · {formatDate(booking.createdAt)}
                    </span>
                  </span>
                  <StatusBadge status={booking.status} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {recommended.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
              Recommended for you
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Based on the events you have booked and viewed.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {recommended.map((event) => (
                <EventCard key={event.eventId} event={event} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
