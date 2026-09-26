"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEvents } from "@/context/EventsContext";
import EventForm from "@/components/EventForm";
import PageNotice from "@/components/PageNotice";
import RequireRole from "@/components/RequireRole";
import { toDateTimeLocal } from "@/lib/eventMappers";
import { canModifyEvent, isOrganizerOf } from "@/lib/eventHelpers";

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireRole roles={["organizer"]}>
      <EditEvent eventId={id} />
    </RequireRole>
  );
}

function EditEvent({ eventId }: { eventId: string }) {
  const { currentUser } = useAuth();
  const { events, loading, refresh, updateEvent } = useEvents();
  const router = useRouter();
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

  if (!isOrganizerOf(event, currentUser)) {
    return (
      <PageNotice href="/events/manage" linkLabel="Back to manage events">
        You can only edit events you organize.
      </PageNotice>
    );
  }

  if (!canModifyEvent(event)) {
    return (
      <PageNotice href="/events/manage" linkLabel="Back to manage events">
        This event can no longer be edited: it has bookings, or it has been cancelled or completed.
      </PageNotice>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/events/manage" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
          ← Back to manage events
        </Link>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Edit event
        </h1>

        <EventForm
          key={event.eventId}
          existingPhotos={event.media}
          initialValues={{
            title: event.title,
            categories: event.categories,
            eventType: event.eventType,
            venue: event.venue,
            address: event.address,
            city: event.city,
            country: event.country,
            latitude: event.geoLocation ? String(event.geoLocation.latitude) : "",
            longitude: event.geoLocation ? String(event.geoLocation.longitude) : "",
            startDateTime: toDateTimeLocal(event.startDateTime),
            endDateTime: toDateTimeLocal(event.endDateTime),
            description: event.description,
            ticketTypes: event.ticketTypes.map((tt) => ({
              name: tt.name,
              price: tt.price,
              quantity: tt.quantity,
            })),
            photos: [],
          }}
          submitLabel="Save changes"
          submittingLabel="Saving…"
          onSubmit={async (values) => {
            await updateEvent(event.eventId, values);
            router.push("/events/manage");
          }}
        />
      </div>
    </div>
  );
}
