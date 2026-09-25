// Maps to the event routes in backend/masterticket/events/urls.py (mounted at /api/events/)

import { http } from "./httpClient";
import type {
  EventDto,
  EventInput,
  EventUpdateInput,
  Paginated,
  RecommendationResponse,
} from "./types";

/** The API's maximum page size (events.views.EventPagination.max_page_size). */
const PAGE_SIZE = 100;

/**
 * Every event visible to the caller.
 *
 * The endpoint is paginated, while the UI filters and paginates the full set client-side,
 * so the pages are followed to the end here. An unpaginated array is also accepted, since
 * the endpoint has served both shapes.
 */
export async function listEvents(): Promise<EventDto[]> {
  const events: EventDto[] = [];

  for (let page = 1; ; page += 1) {
    const response = await http.get<Paginated<EventDto> | EventDto[]>(
      `/events/?size=${PAGE_SIZE}&page=${page}`,
    );
    if (Array.isArray(response)) return response;

    events.push(...response.results);
    if (!response.next) return events;
  }
}

/**
 * Recommendations from the matrix-factorization model. Participants only. Resolves to an empty
 * list when the model has nothing for this user, so callers can fall back to something else.
 */
export async function listRecommendations(): Promise<EventDto[]> {
  const response = await http.get<RecommendationResponse>("/events/recommendation/");
  return Array.isArray(response) ? response : [];
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
