// Mirrors backend/masterticket serializers field-for-field (snake_case, as DRF emits it).

export type UserRole = "admin" | "guest" | "organizer" | "participant";

export interface RegisterPayload {
  username: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  email: string;
  telephone: string;
  address: string;
  taxNumber: string;
  postcode: number;
  requested_role?: UserRole;
}

export interface RegisterResponse {
  message: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  username: string;
  role: UserRole;
  first_name: string;
}

export interface RefreshResponse {
  access: string;
}

export interface UserProfile {
  id: number;
  username: string;
  role: UserRole;
  postcode: number;
  requested_role: UserRole | null;
  approved: boolean;
  first_name: string;
  last_name: string;
  email: string;
  telephone: string;
  address: string;
  taxNumber: string;
}

export type UpdateProfilePayload = Partial<
  Pick<
    UserProfile,
    "first_name" | "last_name" | "email" | "telephone" | "address" | "taxNumber" | "postcode"
  >
>;

export interface RequestRolePayload {
  requested_role: "guest" | "participant" | "organizer";
}

export interface ApproveUserPayload {
  approve: boolean;
}

export interface MessageDetailResponse {
  message: string;
}

// --- Events ---

export type EventStatus = "draft" | "published" | "completed" | "cancelled";

export interface EventTypeDto {
  id: number;
  name: string;
}

export interface CategoryDto {
  id: number;
  name: string;
}

export interface TicketTypeDto {
  id: number;
  name: string;
  price: string;
  quantity: number;
  available: number;
}

export interface TicketTypeInput {
  name: string;
  price: number;
  quantity: number;
}

export interface EventMediaDto {
  id: number;
  photo: string;
}

export interface EventDto {
  id: number;
  title: string;
  venue: string;
  address: string;
  city: string;
  country: string;
  latitude: string | null;
  longitude: string | null;
  start_date_time: string;
  end_date_time: string;
  capacity: number;
  status: EventStatus;
  description: string;
  event_type: EventTypeDto;
  organizer: string | null;
  organizer_id: number | null;
  categories: CategoryDto[];
  ticket_types: TicketTypeDto[];
  media: EventMediaDto[];
  /** Only sent to the event's organizer and to admins. */
  bookings?: BookingDto[];
}

export interface EventInput {
  title: string;
  venue: string;
  address: string;
  city: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  start_date_time: string;
  end_date_time: string;
  /** Total capacity; ticket quantities may not add up to more than this. */
  capacity?: number;
  status?: EventStatus;
  description: string;
  event_type: string;
  categories: string[];
  ticket_types: TicketTypeInput[];
}

export type EventUpdateInput = Partial<EventInput>;

// --- Bookings ---

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface BookingDto {
  id: number;
  event: string;
  event_title: string;
  attendee: string;
  attendee_id: number;
  ticket_type: number;
  number_of_tickets: number;
  total_cost: string;
  status: BookingStatus;
  created_at: string;
}

export interface CreateBookingPayload {
  ticket_type: number;
  number_of_tickets: number;
}

export type ModifyBookingPayload = Partial<CreateBookingPayload>;

// --- Messages ---

export interface MessageListItem {
  id: number;
  sender: number | null;
  sender_name: string;
  receiver: number | null;
  receiver_name: string;
  event: number | null;
  event_title: string;
  subject: string;
  read: boolean;
  created_at: string;
}

export interface MessageDetail {
  id: number;
  subject: string;
  body: string;
  read: boolean;
  created_at: string;
  deleted_sender: boolean;
  deleted_receiver: boolean;
  sender: string;
  receiver: string;
  event: string;
}

export interface SendMessagePayload {
  subject: string;
  body: string;
  receiver: number;
  event: number;
}

export interface DeleteMessagesPayload {
  message_ids: number[];
}

export interface DeleteMessagesResponse {
  detail: string;
}
