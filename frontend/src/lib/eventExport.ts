import { EventItem } from "@/types/event";

// Element names, nesting and attributes follow the Document Type Definition of the assignment
// (section 7α). User references (Attendee / Organizer UserID) are usernames, as in its example.

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function eventsToXml(events: EventItem[]) {
  const eventsXml = events
    .map((event) => {
      const categories = event.categories
        .map((category) => `    <Category>${escapeXml(category)}</Category>`)
        .join("\n");
      const geoLocation = event.geoLocation
        ? `    <GeoLocation Latitude="${event.geoLocation.latitude}" Longitude="${event.geoLocation.longitude}"/>\n`
        : "";
      const ticketTypes = event.ticketTypes
        .map(
          (tt) => `      <TicketType TicketTypeID="${escapeXml(tt.ticketTypeId)}">
        <Name>${escapeXml(tt.name)}</Name>
        <Price>${tt.price.toFixed(2)}</Price>
        <Quantity>${tt.quantity}</Quantity>
        <Available>${tt.available}</Available>
      </TicketType>`,
        )
        .join("\n");
      const bookings = event.bookings
        .map(
          (booking) => `      <Booking BookingID="${escapeXml(booking.bookingId)}">
        <Attendee UserID="${escapeXml(booking.attendeeUsername)}"/>
        <Time>${booking.time}</Time>
        <TicketTypeRef>${escapeXml(booking.ticketTypeId)}</TicketTypeRef>
        <NumberOfTickets>${booking.numberOfTickets}</NumberOfTickets>
        <TotalCost>${booking.totalCost.toFixed(2)}</TotalCost>
        <BookingStatus>${booking.status}</BookingStatus>
      </Booking>`,
        )
        .join("\n");
      const media = event.media.map((photo) => `    <Photo>${escapeXml(photo)}</Photo>`).join("\n");

      return `  <Event EventID="${escapeXml(event.eventId)}">
    <Title>${escapeXml(event.title)}</Title>
${categories}
    <EventType>${escapeXml(event.eventType)}</EventType>
    <Venue>${escapeXml(event.venue)}</Venue>
    <Address>${escapeXml(event.address)}</Address>
    <City>${escapeXml(event.city)}</City>
    <Country>${escapeXml(event.country)}</Country>
${geoLocation}    <StartDateTime>${event.startDateTime}</StartDateTime>
    <EndDateTime>${event.endDateTime}</EndDateTime>
    <Capacity>${event.capacity}</Capacity>
    <TicketTypes>
${ticketTypes}
    </TicketTypes>
    <Bookings>
${bookings}
    </Bookings>
    <Organizer UserID="${escapeXml(event.organizerUsername)}"/>
    <Status>${event.status}</Status>
    <Description>${escapeXml(event.description)}</Description>
    <Media>
${media}
    </Media>
  </Event>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<Events>\n${eventsXml}\n</Events>\n`;
}

/** The same structure as the XML, so both exports describe an event identically. */
export function eventsToJson(events: EventItem[]) {
  const shaped = events.map((event) => ({
    EventID: event.eventId,
    Title: event.title,
    Category: event.categories,
    EventType: event.eventType,
    Venue: event.venue,
    Address: event.address,
    City: event.city,
    Country: event.country,
    ...(event.geoLocation
      ? {
          GeoLocation: {
            Latitude: String(event.geoLocation.latitude),
            Longitude: String(event.geoLocation.longitude),
          },
        }
      : {}),
    StartDateTime: event.startDateTime,
    EndDateTime: event.endDateTime,
    Capacity: event.capacity,
    TicketTypes: event.ticketTypes.map((tt) => ({
      TicketTypeID: tt.ticketTypeId,
      Name: tt.name,
      Price: tt.price.toFixed(2),
      Quantity: tt.quantity,
      Available: tt.available,
    })),
    Bookings: event.bookings.map((booking) => ({
      BookingID: booking.bookingId,
      Attendee: { UserID: booking.attendeeUsername },
      Time: booking.time,
      TicketTypeRef: booking.ticketTypeId,
      NumberOfTickets: booking.numberOfTickets,
      TotalCost: booking.totalCost.toFixed(2),
      BookingStatus: booking.status,
    })),
    Organizer: { UserID: event.organizerUsername },
    Status: event.status,
    Description: event.description,
    Media: event.media,
  }));
  return JSON.stringify({ Events: shaped }, null, 2);
}

export function downloadFile(filename: string, contents: string, mimeType: string) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
