"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEvents } from "@/context/EventsContext";
import { formatDateTime } from "@/lib/eventHelpers";
import PageNotice from "@/components/PageNotice";
import RequireRole from "@/components/RequireRole";
import StatusBadge from "@/components/StatusBadge";

export default function EventBookingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireRole roles={["organizer"]}>
      <EventBookings eventId={id} />
    </RequireRole>
  );
}

function EventBookings({ eventId }: { eventId: string }) {
  const { currentUser } = useAuth();
  const { events, loading, refresh } = useEvents();
  const event = events.find((item) => item.eventId === eventId);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16 text-sm text-zinc-500 dark:text-zinc-400">
        Loading…
      </div>
    );
  }

  if (!event) {
    return (
      <PageNotice href="/events/manage" linkLabel="Back to manage events">
        This event could not be found.
      </PageNotice>
    );
  }

  if (event.organizerUserId !== currentUser?.id) {
    return (
      <PageNotice href="/events/manage" linkLabel="Back to manage events">
        You can only view bookings for events you organize.
      </PageNotice>
    );
  }

  function ticketTypeName(ticketTypeId: string) {
    return event!.ticketTypes.find((tt) => tt.ticketTypeId === ticketTypeId)?.name ?? "—";
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/events/manage" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
          ← Back to manage events
        </Link>

        <div className="mt-4 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Bookings for {event.title}
          </h1>
          <StatusBadge status={event.status} />
        </div>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {event.bookings.length} booking{event.bookings.length === 1 ? "" : "s"}
        </p>

        <div className="mt-6 overflow-x-auto rounded-xl border border-black/[.08] dark:border-white/[.145]">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Attendee</th>
                <th className="px-4 py-3">Ticket type</th>
                <th className="px-4 py-3">Tickets</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Booked at</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[.08] dark:divide-white/[.145]">
              {event.bookings.map((booking) => (
                <tr key={booking.bookingId} className="bg-white dark:bg-zinc-950">
                  <td className="px-4 py-3 font-medium text-zinc-950 dark:text-zinc-50">
                    {booking.attendeeUsername}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {ticketTypeName(booking.ticketTypeId)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {booking.numberOfTickets}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    €{booking.totalCost.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {formatDateTime(booking.time)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/messages?to=${booking.attendeeUserId}&event=${event.eventId}&name=${encodeURIComponent(booking.attendeeUsername)}`}
                      className="font-medium text-zinc-950 hover:underline dark:text-zinc-50"
                    >
                      Message
                    </Link>
                  </td>
                </tr>
              ))}
              {event.bookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
