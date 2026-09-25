import type { BookingDto, EventDto, EventInput, EventStatus as ApiEventStatus, TicketTypeInput } from "@/api";
import type { Booking, BookingStatus, EventItem, EventStatus, MyBooking } from "@/types/event";

function toBooking(dto: BookingDto): Booking {
  return {
    bookingId: String(dto.id),
    attendeeUserId: dto.attendee_id,
    attendeeUsername: dto.attendee,
    time: dto.created_at,
    ticketTypeId: String(dto.ticket_type),
    numberOfTickets: dto.number_of_tickets,
    totalCost: Number(dto.total_cost),
    status: dto.status.toUpperCase() as BookingStatus,
  };
}

export function toEventItem(dto: EventDto): EventItem {
  const hasGeo = dto.latitude !== null && dto.longitude !== null;
  return {
    eventId: String(dto.id),
    title: dto.title,
    categories: dto.categories.map((category) => category.name),
    eventType: dto.event_type.name,
    venue: dto.venue,
    address: dto.address,
    city: dto.city,
    country: dto.country,
    geoLocation: hasGeo
      ? { latitude: Number(dto.latitude), longitude: Number(dto.longitude) }
      : undefined,
    startDateTime: dto.start_date_time,
    endDateTime: dto.end_date_time,
    capacity: dto.capacity,
    ticketTypes: dto.ticket_types.map((tt) => ({
      ticketTypeId: String(tt.id),
      name: tt.name,
      price: Number(tt.price),
      quantity: tt.quantity,
      available: tt.available,
    })),
    bookings: (dto.bookings ?? []).map(toBooking),
    organizerUserId: dto.organizer_id,
    organizerUsername: dto.organizer ?? "",
    status: dto.status.toUpperCase() as EventStatus,
    description: dto.description,
    media: dto.media.map((media) => media.photo),
  };
}

export function toMyBooking(dto: BookingDto, events: EventItem[]): MyBooking {
  // A booking only carries its ticket type id, so the event is found through that.
  const ticketTypeId = String(dto.ticket_type);
  const event = events.find((item) => item.ticketTypes.some((tt) => tt.ticketTypeId === ticketTypeId));
  return {
    bookingId: String(dto.id),
    eventId: event?.eventId ?? null,
    eventTitle: dto.event_title,
    ticketTypeId,
    numberOfTickets: dto.number_of_tickets,
    totalCost: Number(dto.total_cost),
    status: dto.status.toUpperCase() as BookingStatus,
    createdAt: dto.created_at,
  };
}

/** What the organizer's create / edit forms collect. Dates are `datetime-local` strings. */
export interface EventFormValues {
  title: string;
  categories: string[];
  eventType: string;
  venue: string;
  address: string;
  city: string;
  country: string;
  latitude: string;
  longitude: string;
  startDateTime: string;
  endDateTime: string;
  capacity: number;
  description: string;
  ticketTypes: TicketTypeInput[];
}

function toCoordinate(value: string): number | null {
  if (value.trim() === "") return null;
  return Number(Number(value).toFixed(6));
}

export function toEventInput(values: EventFormValues, status?: ApiEventStatus): EventInput {
  return {
    title: values.title.trim(),
    categories: values.categories,
    event_type: values.eventType,
    venue: values.venue.trim(),
    address: values.address.trim(),
    city: values.city.trim(),
    country: values.country.trim(),
    latitude: toCoordinate(values.latitude),
    longitude: toCoordinate(values.longitude),
    start_date_time: new Date(values.startDateTime).toISOString(),
    end_date_time: new Date(values.endDateTime).toISOString(),
    capacity: values.capacity,
    description: values.description.trim(),
    ticket_types: values.ticketTypes.map((tt) => ({
      name: tt.name.trim(),
      price: Number(Number(tt.price).toFixed(2)),
      quantity: tt.quantity,
    })),
    ...(status ? { status } : {}),
  };
}

/** ISO instant -> value for an `<input type="datetime-local">` in the viewer's timezone. */
export function toDateTimeLocal(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
