# TEDI
## Pages and endpoint Requirements
### Welcome page
#### Functionality
- Log in
- Sign up
    - After successfull sign up got to wait for admin page

#### Api Endpoints
- authenticate
- create user

### Wait for admin
#### Functionality
- Wait for admins to accept user

### Admin page
#### Functionality
- Navigate list of users
- Access user's data
- Approve or deny entry for new users

#### Api Endpoints
- Get all users
- Get user by id
- update user

### Home page
#### Functionality
- Navigation to manage events
- Navigation to view/search events

### Manage Events
#### Functionality
- Create new event
- Navigate user's active events
- Delete or cancel event

#### Api Endpoints
- create event
- update event
- get all events by user id
- delete event

### Search events
#### Functionality
- Navigate through events
- Filter events
- Search events

#### Api Endpoints
- Get all events

### Event Details
#### Functionality
- Show events data
- Show event location
- Create a reservation

#### Api Endpoints
- get event by id
- create reservation

### Messages
...To do

## Data Models
### User
```json
User: {
    userid: number
    username: string
    password: string
    role: "adimn" | "guest" | "orginiser" | "participant"
    approved: boolean
    name: string
    surename: string
    email: string
    telephone: number
    address: string
    taxNumber: string
}
```

### Event
```
Event: {
    eventId: number
    title: string
    category: string[]
    eventType: string
    venue: string
    address: string
    city: string
    country: string
    geoLocation: string
    startDateTime: string
    endDateTime: string
    capacity: number
    ticketTypes: TicketType[]
    bookings: Booking[]
}
```

### TicketType
```
TicketType: {
    ticketTypeId: number
    name: string
    price: number
    quantity: string
    available: string
}
```

### Booking
```
Booking: { 
    bookingId: number
    atendeeId: number
    time: string
    ticketType: TicketType
    numOfTickets: number
    totalCost: number
    status: PENDING | CONFIRMED | CANCELLED 
    organiser: string
    status: DRAFT | PUBLISHED | COMPLETED | CANCELLED
    description: text
    media
} 
```

MASTER_TICKET_PROJECT
│
├── APP: users (Existing)
│   ├── Models: Custom User (Admin, Organizer, Participant, Guest) [DONE]
│   └── APIs: Authentication, User Profiles, Role Requests, Admin Approvals [DONE]
│
└── APP: events (New)
    │
    ├── MODELS
    │   ├── Category [DONE]
    │   │   └── Fields: name [DONE]
    │   │
    │   ├── Event [DONE]
    │   │   ├── Fields: title, event_type, venue, address, city, country [DONE]
    │   │   ├── Fields: start_datetime, end_datetime, capacity, status, description [DONE]
    │   │   ├── Relations: organizer (FK -> User), categories (M2M -> Category) [DONE]
    │   │   └── Reverse Access: ticket_types, bookings, media [DONE]
    │   │
    │   ├── TicketType [DONE]
    │   │   ├── Fields: name, price, quantity, available [DONE]
    │   │   └── Relations: event (FK -> Event, related_name='ticket_types') [DONE]
    │   │
    │   ├── Booking [PENDING]
    │   │   ├── Fields: number_of_tickets, total_cost, booking_status, created_at [PENDING]
    │   │   └── Relations: event (FK -> Event), attendee (FK -> User), ticket_type (FK -> TicketType) [PENDING]
    │   │
    │   └── Media [DONE]
    │       ├── Fields: photo [DONE]
    │       └── Relations: event (FK -> Event, related_name='media') [DONE]
    │
    └── APIS & ENDPOINTS
        │
        ├── Organizer Event Management
        │   ├── POST   /api/events/             -> Create Event (DRAFT state) [DONE]
        │   ├── PATCH  /api/events/<id>/        -> Edit Event details or Publish [DONE]
        │   ├── DELETE /api/events/<id>/        -> Delete Event (Allowed ONLY if no bookings exist) [DONE]
        │   ├── POST   /api/events/<id>/cancel/ -> Cancel Event (Sets state to CANCELLED) [DONE]
        │   └── GET    /api/events/my-events/   -> List organizer's own events & see booking stats [DONE]
        │
        ├── Public / Attendee Browsing
        │   ├── GET    /api/events/public/      -> Filterable list (title, category, date, price, location) [DONE]
        │   └── GET    /api/events/public/<id>/ -> Retrieve single event details + active ticket types [DONE]
        │
        └── Booking Transactions
            ├── POST   /api/bookings/           -> Create Booking (Atomic transaction, deducts availability) [PENDING]
            └── GET    /api/bookings/my-bookings/ -> List participant's active/past bookings [PENDING]