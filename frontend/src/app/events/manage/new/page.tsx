"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEvents } from "@/context/EventsContext";
import EventForm from "@/components/EventForm";
import RequireRole from "@/components/RequireRole";

export default function CreateEventPage() {
  return (
    <RequireRole roles={["organizer"]}>
      <CreateEvent />
    </RequireRole>
  );
}

function CreateEvent() {
  const { createEvent } = useEvents();
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col px-4 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/events/manage" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
          ← Back to manage events
        </Link>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Create a new event
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          The event will be created as a draft. Publish it when you&apos;re ready to accept
          bookings.
        </p>

        <EventForm
          submitLabel="Create event"
          submittingLabel="Creating…"
          onSubmit={async (values) => {
            await createEvent(values);
            router.push("/events/manage");
          }}
        />
      </div>
    </div>
  );
}
