import Link from "next/link";
import { EventItem } from "@/types/event";
import { formatDate, lowestPrice } from "@/lib/eventHelpers";
import StatusBadge from "@/components/StatusBadge";

export default function EventCard({ event }: { event: EventItem }) {
  return (
    <Link
      href={`/events/${event.eventId}`}
      className="flex flex-col gap-2 rounded-xl border border-black/[.08] bg-white p-5 shadow-sm transition-colors hover:border-black/[.16] dark:border-white/[.145] dark:bg-zinc-900 dark:hover:border-white/[.25]"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-zinc-950 dark:text-zinc-50">{event.title}</h3>
        <StatusBadge status={event.status} />
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {event.venue}, {event.city}
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{formatDate(event.startDateTime)}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {event.categories.map((category) => (
          <span
            key={category}
            className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          >
            {category}
          </span>
        ))}
      </div>
      <p className="mt-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">
        {lowestPrice(event) === 0 ? "Free" : `From €${lowestPrice(event).toFixed(2)}`}
      </p>
    </Link>
  );
}
