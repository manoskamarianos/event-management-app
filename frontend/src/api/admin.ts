// Maps to the admin/* routes in backend/masterticket/users/urls.py (IsAdmin only)

import { http } from "./httpClient";
import type { ApproveUserPayload, MessageDetailResponse, UserProfile } from "./types";

export function listUsers() {
  return http.get<UserProfile[]>("/auth/admin/users/");
}

export function getUser(userId: number) {
  return http.get<UserProfile>(`/auth/admin/users/${userId}/`);
}

export function approveUser(userId: number, payload: ApproveUserPayload) {
  return http.patch<MessageDetailResponse>(`/auth/admin/users/${userId}/approve/`, payload);
}
