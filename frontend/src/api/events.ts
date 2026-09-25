// Maps to the event routes in backend/masterticket/events/urls.py (mounted at /api/events/)

import { http } from "./httpClient";
import type { EventDto, EventInput, EventUpdateInput } from "./types";

export function listEvents() {
  return http.get<EventDto[]>("/events/");
}

export function getEvent(eventId: number) {
  return http.get<EventDto>(`/events/${eventId}/`);
}

/** Organizer only. */
export function createEvent(payload: EventInput) {
  return http.post<EventDto>("/events/create/", payload);
}

/** Organizer (own events) only; rejected once the event has bookings or is cancelled/completed. */
export function updateEvent(eventId: number, payload: EventUpdateInput) {
  return http.patch<EventDto>(`/events/MyEvents/${eventId}/`, payload);
}

/** Organizer (own events) only; rejected once the event has bookings or is cancelled/completed. */
export function deleteEvent(eventId: number) {
  return http.delete<void>(`/events/MyEvents/${eventId}/`);
}
