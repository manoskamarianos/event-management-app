"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { describeError } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { useEvents } from "@/context/EventsContext";
import { canModifyEvent, formatDate, isOrganizerOf, totalAvailable, totalBooked } from "@/lib/eventHelpers";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import RequireRole from "@/components/RequireRole";
import { EventItem } from "@/types/event";

export default function ManageEventsPage() {
  return (
    <RequireRole roles={["organizer"]}>
      <ManageEvents />
    </RequireRole>
  );
}

function ManageEvents() {
  const { currentUser } = useAuth();
  const { events, loading, error: loadError, refresh, publishEvent, cancelEvent, deleteEvent } =
    useEvents();

  const [pendingCancel, setPendingCancel] = useState<EventItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EventItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    refresh();
  }, [refresh]);

  const myEvents = events.filter((event) => isOrganizerOf(event, currentUser));

  async function handlePublish(event: EventItem) {
    setError("");
    setNotice("");
    try {
      await publishEvent(event.eventId);
    } catch (publishError) {
      setError(describeError(publishError));
    }
  }

  async function handleCancelConfirm() {
    if (!pendingCancel) return;
    const target = pendingCancel;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await cancelEvent(target.eventId);
    } catch (cancelError) {
      setError(describeError(cancelError));
      setBusy(false);
      setPendingCancel(null);
      return;
    }

    // The backend sends the cancellation message to every attendee itself (spec 10).
    setNotice("The event was cancelled and its attendees were notified.");
    setBusy(false);
    setPendingCancel(null);
  }

  async function handleDeleteConfirm() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await deleteEvent(target.eventId);
    } catch (deleteError) {
      setError(describeError(deleteError));
    }
    setBusy(false);
    setPendingDelete(null);
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Manage events
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {loading
                ? "Loading events…"
                : `${myEvents.length} event${myEvents.length === 1 ? "" : "s"} created by you`}
            </p>
          </div>
          <Link
            href="/events/manage/new"
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            + Create new event
          </Link>
        </div>

        {notice && <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-400">{notice}</p>}
        {(error || loadError) && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error || loadError}</p>
        )}

        <div className="mt-6 overflow-x-auto rounded-xl border border-black/[.08] dark:border-white/[.145]">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Capacity</th>
                <th className="px-4 py-3">Booked</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[.08] dark:divide-white/[.145]">
              {myEvents.map((event) => (
                <tr key={event.eventId} className="bg-white dark:bg-zinc-950">
                  <td className="px-4 py-3 font-medium text-zinc-950 dark:text-zinc-50">
                    {event.title}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {formatDate(event.startDateTime)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{event.capacity}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {totalBooked(event)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {totalAvailable(event)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={event.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-3 text-sm">
                      <Link
                        href={`/events/manage/${event.eventId}/bookings`}
                        className="font-medium text-zinc-950 hover:underline dark:text-zinc-50"
                      >
                        Bookings
                      </Link>
                      {event.status === "DRAFT" && (
                        <button
                          type="button"
                          onClick={() => handlePublish(event)}
                          className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                        >
                          Publish
                        </button>
                      )}
                      {canModifyEvent(event) && (
                        <Link
                          href={`/events/manage/${event.eventId}/edit`}
                          className="font-medium text-zinc-950 hover:underline dark:text-zinc-50"
                        >
                          Edit
                        </Link>
                      )}
                      {event.status === "PUBLISHED" && (
                        <button
                          type="button"
                          onClick={() => setPendingCancel(event)}
                          className="font-medium text-amber-700 hover:underline dark:text-amber-400"
                        >
                          Cancel
                        </button>
                      )}
                      {canModifyEvent(event) && (
                        <button
                          type="button"
                          onClick={() => setPendingDelete(event)}
                          className="font-medium text-red-600 hover:underline dark:text-red-400"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                    Loading events…
                  </td>
                </tr>
              )}
              {!loading && myEvents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                    You haven&apos;t created any events yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={pendingCancel !== null}
        busy={busy}
        title="Cancel this event?"
        description={
          <>
            This will mark <strong>{pendingCancel?.title}</strong> as cancelled. No new bookings
            will be accepted, existing bookings stay on record, and every attendee with a booking
            is notified by message.
          </>
        }
        confirmLabel="Cancel event"
        onConfirm={handleCancelConfirm}
        onCancel={() => setPendingCancel(null)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        busy={busy}
        title="Delete this event?"
        description={
          <>
            This will permanently delete <strong>{pendingDelete?.title}</strong>. This is only
            possible because it has no bookings yet.
          </>
        }
        confirmLabel="Delete event"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
