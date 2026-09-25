// Maps to backend/masterticket/MyMessages/urls.py (mounted at /api/messages/)

import { http } from "./httpClient";
import type {
  DeleteMessagesPayload,
  DeleteMessagesResponse,
  MessageDetail,
  MessageListItem,
  SendMessagePayload,
} from "./types";

export function listInbox() {
  return http.get<MessageListItem[]>("/messages/inbox/");
}

export function listOutbox() {
  return http.get<MessageListItem[]>("/messages/outbox/");
}

/** Only allowed between an event's organizer and one of its attendees. */
export function sendMessage(payload: SendMessagePayload) {
  return http.post<MessageListItem>("/messages/send/", payload);
}

/** Opening a message you received also marks it as read server-side. */
export function openMessage(messageId: number) {
  return http.get<MessageDetail>(`/messages/${messageId}/`);
}

export function deleteMessages(payload: DeleteMessagesPayload) {
  return http.post<DeleteMessagesResponse>("/messages/delete/", payload);
}
