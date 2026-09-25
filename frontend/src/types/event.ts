export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export interface TicketType {
  ticketTypeId: string;
  name: string;
  price: number;
  quantity: number;
  available: number;
}

export interface Booking {
  bookingId: string;
  attendeeUserId: number;
  attendeeUsername: string;
  time: string;
  ticketTypeId: string;
  numberOfTickets: number;
  totalCost: number;
  status: BookingStatus;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface EventItem {
  eventId: string;
  title: string;
  categories: string[];
  eventType: string;
  venue: string;
  address: string;
  city: string;
  country: string;
  geoLocation?: GeoLocation;
  /** ISO-8601 instant, as sent by the API. */
  startDateTime: string;
  endDateTime: string;
  capacity: number;
  ticketTypes: TicketType[];
  /** Only populated for the event's organizer and for admins. */
  bookings: Booking[];
  organizerUserId: number | null;
  organizerUsername: string;
  status: EventStatus;
  description: string;
  media: string[];
}

/** A booking of the signed-in participant, resolved to its event where possible. */
export interface MyBooking {
  bookingId: string;
  eventId: string | null;
  eventTitle: string;
  ticketTypeId: string;
  numberOfTickets: number;
  totalCost: number;
  status: BookingStatus;
  createdAt: string;
}
