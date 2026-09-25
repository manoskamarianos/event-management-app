// Maps to the booking routes in backend/masterticket/events/urls.py (mounted at /api/events/bookings/)

import { http } from "./httpClient";
import type { BookingDto, CreateBookingPayload, ModifyBookingPayload } from "./types";

/** Participant only; returns the current user's own bookings. */
export function listBookings() {
  return http.get<BookingDto[]>("/events/bookings/");
}

/** Participant only; creates a PENDING booking, not yet deducted from availability. */
export function createBooking(payload: CreateBookingPayload) {
  return http.post<BookingDto>("/events/bookings/create/", payload);
}

/** Participant only; only allowed while the booking is still PENDING. */
export function modifyBooking(bookingId: number, payload: ModifyBookingPayload) {
  return http.patch<BookingDto>(`/events/bookings/${bookingId}/modify/`, payload);
}

/** Participant only; deducts ticket availability and marks the booking CONFIRMED. */
export function confirmBooking(bookingId: number) {
  return http.post<BookingDto>(`/events/bookings/${bookingId}/confirm/`);
}

/** Participant only; only allowed while the booking is still PENDING (not after confirmation). */
export function cancelBooking(bookingId: number) {
  return http.post<BookingDto>(`/events/bookings/${bookingId}/cancel/`);
}
