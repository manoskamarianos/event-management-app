import { API_BASE_URL } from "./config";
import { ApiError } from "./errors";
import { tokenStorage } from "./tokenStorage";
import type { RefreshResponse } from "./types";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Attach the stored access token as a Bearer header. Defaults to true. */
  auth?: boolean;
  /** Internal: set when retrying once after a token refresh, to avoid refresh loops. */
  isRetry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

// Endpoints are refreshed at most once concurrently: parallel 401s share one
// in-flight refresh instead of each racing the refresh token separately.
function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  const refresh = tokenStorage.getRefreshToken();
  if (!refresh) return Promise.resolve(null);

  refreshPromise = fetch(`${API_BASE_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  })
    .then(async (response) => {
      if (!response.ok) {
        tokenStorage.clear();
        return null;
      }
      const data = (await response.json()) as RefreshResponse;
      tokenStorage.setAccessToken(data.access);
      return data.access;
    })
    .catch(() => {
      tokenStorage.clear();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers, isRetry, ...rest } = options;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    // For FormData the Content-Type (with its boundary) must be left to the browser.
    ...(body !== undefined && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(headers as Record<string, string> | undefined),
  };

  if (auth) {
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) finalHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  if (response.status === 401 && auth && !isRetry) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      return apiFetch<T>(path, { ...options, isRetry: true });
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text();

  if (!response.ok) {
    throw new ApiError(response.status, payload);
  }

  return payload as T;
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),
};
