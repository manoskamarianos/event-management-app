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
