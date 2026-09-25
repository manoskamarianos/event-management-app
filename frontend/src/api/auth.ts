// Maps to backend/masterticket/users/urls.py (mounted at /api/auth/)

import { http } from "./httpClient";
import { tokenStorage } from "./tokenStorage";
import type {
  LoginPayload,
  LoginResponse,
  MessageDetailResponse,
  RegisterPayload,
  RegisterResponse,
  RequestRolePayload,
  UpdateProfilePayload,
  UserProfile,
} from "./types";

export function register(payload: RegisterPayload) {
  return http.post<RegisterResponse>("/auth/register/", payload, { auth: false });
}

export async function login(payload: LoginPayload) {
  const data = await http.post<LoginResponse>("/auth/login/", payload, { auth: false });
  tokenStorage.setTokens(data.access, data.refresh);
  return data;
}

export async function logout() {
  const refresh = tokenStorage.getRefreshToken();
  try {
    if (refresh) {
      await http.post<MessageDetailResponse>("/auth/logout/", { refresh });
    }
  } finally {
    tokenStorage.clear();
  }
}

export function getProfile() {
  return http.get<UserProfile>("/auth/profile/");
}

export function updateProfile(payload: UpdateProfilePayload) {
  return http.patch<UserProfile>("/auth/profile/", payload);
}

export function requestRole(payload: RequestRolePayload) {
  return http.post<MessageDetailResponse>("/auth/request/role/", payload);
}
