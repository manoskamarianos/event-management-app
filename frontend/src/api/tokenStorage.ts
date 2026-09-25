const ACCESS_KEY = "eventhub.accessToken";
const REFRESH_KEY = "eventhub.refreshToken";

/** Fired when the stored session is dropped (logout, or a refresh that was rejected). */
export const SESSION_CLEARED_EVENT = "eventhub:session-cleared";

function isBrowser() {
  return typeof window !== "undefined";
}

export const tokenStorage = {
  getAccessToken(): string | null {
    return isBrowser() ? window.localStorage.getItem(ACCESS_KEY) : null;
  },
  getRefreshToken(): string | null {
    return isBrowser() ? window.localStorage.getItem(REFRESH_KEY) : null;
  },
  setTokens(access: string, refresh: string) {
    if (!isBrowser()) return;
    window.localStorage.setItem(ACCESS_KEY, access);
    window.localStorage.setItem(REFRESH_KEY, refresh);
  },
  setAccessToken(access: string) {
    if (!isBrowser()) return;
    window.localStorage.setItem(ACCESS_KEY, access);
  },
  clear() {
    if (!isBrowser()) return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    window.dispatchEvent(new Event(SESSION_CLEARED_EVENT));
  },
};
