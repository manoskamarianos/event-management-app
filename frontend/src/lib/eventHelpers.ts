import { EventItem } from "@/types/event";

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function lowestPrice(event: EventItem) {
  if (event.ticketTypes.length === 0) return 0;
  return Math.min(...event.ticketTypes.map((tt) => tt.price));
}

export function totalAvailable(event: EventItem) {
  return event.ticketTypes.reduce((sum, tt) => sum + tt.available, 0);
}

/** Seats already reserved: confirmed bookings are what the API deducts from availability. */
export function totalBooked(event: EventItem) {
  return event.ticketTypes.reduce((sum, tt) => sum + (tt.quantity - tt.available), 0);
}

export function isBookable(event: EventItem) {
  return event.status === "PUBLISHED" && totalAvailable(event) > 0;
}

/** Whether `user` organizes `event`: by id when the API gave one, otherwise by username. */
export function isOrganizerOf(event: EventItem, user: { id: number; username: string } | null) {
  if (!user) return false;
  return event.organizerUserId !== null
    ? event.organizerUserId === user.id
    : event.organizerUsername === user.username;
}

/**
 * Spec 7γ: an event can be deleted only before publication or, at the latest, before its first
 * booking. The API applies the same rule to edits, so both share this check.
 */
export function canModifyEvent(event: EventItem) {
  const beforeFirstBooking = event.bookings.length === 0 && totalBooked(event) === 0;
  return (event.status === "DRAFT" || event.status === "PUBLISHED") && beforeFirstBooking;
}

/**
 * Lightweight content-based stand-in for the course's Biased Matrix
 * Factorization recommender: ranks published events the user hasn't booked
 * by category overlap with the events they booked or visited. Without any
 * booking history, visited events alone drive the ranking.
 */
export function recommendEventsFor(
  events: EventItem[],
  bookedEventIds: Set<string>,
  visitedEventIds: Set<string>,
  limit = 3,
) {
  const preferredCategories = new Set(
    events
      .filter((e) => bookedEventIds.has(e.eventId) || visitedEventIds.has(e.eventId))
      .flatMap((e) => e.categories),
  );

  const candidates = events.filter(
    (e) => e.status === "PUBLISHED" && !bookedEventIds.has(e.eventId),
  );

  const scored = candidates.map((event) => {
    const overlap = event.categories.filter((c) => preferredCategories.has(c)).length;
    return { event, score: overlap };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.event);
}
