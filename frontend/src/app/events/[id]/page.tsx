"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError, describeError } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { useMyBookings } from "@/hooks/useMyBookings";
import { useScopedData } from "@/hooks/useScopedData";
import { formatDateTime, isBookable } from "@/lib/eventHelpers";
import { toEventItem } from "@/lib/eventMappers";
import { recordVisit } from "@/lib/visitedEvents";
import StatusBadge from "@/components/StatusBadge";
import MapEmbed from "@/components/MapEmbed";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageNotice from "@/components/PageNotice";
import RequireRole from "@/components/RequireRole";

export default function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <RequireRole>
      <EventDetails eventId={id} />
    </RequireRole>
  );
}

function EventDetails({ eventId }: { eventId: string }) {
  const { currentUser } = useAuth();
  const { bookings: myBookings, reload: reloadMyBookings } = useMyBookings();
  const numericId = Number(eventId);
  const validId = Number.isInteger(numericId);
  const fetchEvent = useCallback(
    async () => toEventItem(await api.events.getEvent(numericId)),
    [numericId],
  );
  const { data: event, error: loadError, reload: load } = useScopedData(
    validId ? numericId : null,
    fetchEvent,
  );

  const [ticketTypeId, setTicketTypeId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(
    null,
  );

  const userId = currentUser?.id;
  useEffect(() => {
    if (userId !== undefined && event) recordVisit(userId, eventId);
  }, [userId, eventId, event]);

  const missing = !validId || (loadError instanceof ApiError && loadError.status === 404);
  if (missing) {
    return (
      <PageNotice href="/events" linkLabel="Back to events">
        This event could not be found.
      </PageNotice>
    );
  }
  if (loadError && !event) {
    return (
      <PageNotice href="/events" linkLabel="Back to events">
        {describeError(loadError, "Could not load this event.")}
      </PageNotice>
    );
  }
  if (!event) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16 text-sm text-zinc-500 dark:text-zinc-400">
        Loading…
      </div>
    );
  }

  const current = event;
  const isParticipant = currentUser?.role === "participant";
  const selectedTicketType =
    current.ticketTypes.find((tt) => tt.ticketTypeId === ticketTypeId) ??
    current.ticketTypes.find((tt) => tt.available > 0) ??
    current.ticketTypes[0];
  const bookable = isBookable(current);
  const validQuantity =
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    selectedTicketType !== undefined &&
    quantity <= selectedTicketType.available;
  const myBookingsHere = myBookings.filter((booking) =>
    current.ticketTypes.some((tt) => tt.ticketTypeId === booking.ticketTypeId),
  );

  async function handleConfirmBooking() {
    if (!selectedTicketType) return;
    setBusy(true);
    setMessage(null);
    let pendingBookingId: number | null = null;
    try {
      // The API books in two steps: a pending booking, then its confirmation, which is what
      // deducts availability. The user has already confirmed in the dialog, so do both.
      const pending = await api.bookings.createBooking({
        ticket_type: Number(selectedTicketType.ticketTypeId),
        number_of_tickets: quantity,
      });
      pendingBookingId = pending.id;
      const confirmed = await api.bookings.confirmBooking(pending.id);
      setMessage({
        kind: "success",
        text: `Booking confirmed: ${quantity} × ${selectedTicketType.name} (€${Number(confirmed.total_cost).toFixed(2)}).`,
      });
      setQuantity(1);
    } catch (error) {
      if (pendingBookingId !== null) {
        // Do not leave a dangling pending booking behind after a failed confirmation.
        await api.bookings.cancelBooking(pendingBookingId).catch(() => undefined);
      }
      setMessage({ kind: "error", text: describeError(error) });
    } finally {
      setConfirmOpen(false);
      setBusy(false);
      await Promise.all([load(), reloadMyBookings()]);
    }
  }

  async function handlePendingBooking(bookingId: string, action: "confirm" | "cancel") {
    setMessage(null);
    try {
      if (action === "confirm") await api.bookings.confirmBooking(Number(bookingId));
      else await api.bookings.cancelBooking(Number(bookingId));
      setMessage({
        kind: "success",
        text: action === "confirm" ? "Booking confirmed." : "Booking cancelled.",
      });
    } catch (error) {
      setMessage({ kind: "error", text: describeError(error) });
    }
    await Promise.all([load(), reloadMyBookings()]);
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/events" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
          ← Back to events
        </Link>

        <div className="mt-4 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {current.title}
          </h1>
          <StatusBadge status={current.status} />
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {current.categories.map((category) => (
            <span
              key={category}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            >
              {category}
            </span>
          ))}
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-black/[.08] bg-white p-5 text-sm dark:border-white/[.145] dark:bg-zinc-900 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Type
            </dt>
            <dd className="mt-1 text-zinc-950 dark:text-zinc-50">{current.eventType}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Venue
            </dt>
            <dd className="mt-1 text-zinc-950 dark:text-zinc-50">
              {current.venue}, {current.address}, {current.city}, {current.country}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Starts
            </dt>
            <dd className="mt-1 text-zinc-950 dark:text-zinc-50">
              {formatDateTime(current.startDateTime)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Ends
            </dt>
            <dd className="mt-1 text-zinc-950 dark:text-zinc-50">
              {formatDateTime(current.endDateTime)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Organiser
            </dt>
            <dd className="mt-1 text-zinc-950 dark:text-zinc-50">{current.organizerUsername}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Capacity
            </dt>
            <dd className="mt-1 text-zinc-950 dark:text-zinc-50">{current.capacity}</dd>
          </div>
        </dl>

        <div className="mt-6">
          <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">Description</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-400">
            {current.description}
          </p>
        </div>

        {current.geoLocation && (
          <div className="mt-6">
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">Location</h2>
            <div className="mt-2">
              <MapEmbed
                latitude={current.geoLocation.latitude}
                longitude={current.geoLocation.longitude}
                label={current.venue}
              />
            </div>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">Ticket types</h2>
          <div className="mt-2 overflow-hidden rounded-lg border border-black/[.08] dark:border-white/[.145]">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Price</th>
                  <th className="px-4 py-2">Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[.08] dark:divide-white/[.145]">
                {current.ticketTypes.map((tt) => (
                  <tr key={tt.ticketTypeId} className="bg-white dark:bg-zinc-950">
                    <td className="px-4 py-2 text-zinc-950 dark:text-zinc-50">{tt.name}</td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                      {tt.price === 0 ? "Free" : `€${tt.price.toFixed(2)}`}
                    </td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                      {tt.available} / {tt.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-900">
          <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">Book tickets</h2>

          {!isParticipant && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Only participant accounts can book tickets.
            </p>
          )}

          {isParticipant && !bookable && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {current.status === "PUBLISHED"
                ? "All tickets for this event are sold out."
                : "This event is not currently accepting bookings."}
            </p>
          )}

          {isParticipant && bookable && (
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ticketType" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Ticket type
                </label>
                <select
                  id="ticketType"
                  value={selectedTicketType?.ticketTypeId ?? ""}
                  onChange={(e) => {
                    setTicketTypeId(e.target.value);
                    setQuantity(1);
                  }}
                  className="rounded-md border border-black/[.08] bg-white px-3 py-2 text-sm text-zinc-950 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
                >
                  {current.ticketTypes.map((tt) => (
                    <option key={tt.ticketTypeId} value={tt.ticketTypeId} disabled={tt.available === 0}>
                      {tt.name} {tt.available === 0 ? "(sold out)" : `(${tt.available} left)`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="quantity" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Number of tickets
                </label>
                <input
                  id="quantity"
                  type="number"
                  min={1}
                  max={selectedTicketType?.available ?? 1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-24 rounded-md border border-black/[.08] bg-white px-3 py-2 text-sm text-zinc-950 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>
              <button
                type="button"
                disabled={!validQuantity}
                onClick={() => setConfirmOpen(true)}
                className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-[#383838] disabled:opacity-40 dark:hover:bg-[#ccc]"
              >
                Book now
              </button>
            </div>
          )}

          {message && (
            <p
              className={`mt-4 text-sm ${
                message.kind === "success"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {message.text}
            </p>
          )}
        </div>

        {isParticipant && myBookingsHere.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
                Your bookings for this event
              </h2>
              {current.organizerUserId !== null && (
                <Link
                  href={`/messages?to=${current.organizerUserId}&event=${current.eventId}&name=${encodeURIComponent(current.organizerUsername)}`}
                  className="text-sm font-medium text-zinc-950 hover:underline dark:text-zinc-50"
                >
                  Message the organiser
                </Link>
              )}
            </div>
            <ul className="mt-2 divide-y divide-black/[.08] overflow-hidden rounded-lg border border-black/[.08] dark:divide-white/[.145] dark:border-white/[.145]">
              {myBookingsHere.map((booking) => (
                <li
                  key={booking.bookingId}
                  className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 text-sm dark:bg-zinc-950"
                >
                  <span className="text-zinc-950 dark:text-zinc-50">
                    {booking.numberOfTickets} ×{" "}
                    {current.ticketTypes.find((tt) => tt.ticketTypeId === booking.ticketTypeId)?.name}{" "}
                    <span className="text-zinc-500 dark:text-zinc-400">
                      · €{booking.totalCost.toFixed(2)}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <StatusBadge status={booking.status} />
                    {booking.status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handlePendingBooking(booking.bookingId, "confirm")}
                          className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePendingBooking(booking.bookingId, "cancel")}
                          className="font-medium text-red-600 hover:underline dark:text-red-400"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        busy={busy}
        title="Confirm booking"
        description={
          selectedTicketType && (
            <>
              You are about to book <strong>{quantity}</strong> × {selectedTicketType.name} for
              a total of <strong>€{(selectedTicketType.price * quantity).toFixed(2)}</strong>.
              Once confirmed, this booking cannot be undone.
            </>
          )
        }
        confirmLabel="Confirm booking"
        onConfirm={handleConfirmBooking}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
