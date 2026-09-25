"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api, ApiError, describeError, SESSION_CLEARED_EVENT, tokenStorage } from "@/api";
import type { UserProfile } from "@/api";
import { AuthUser } from "@/types/user";

type LoginResult = { ok: true; user: AuthUser } | { ok: false; message: string };

interface AuthContextValue {
  currentUser: AuthUser | null;
  /** True until the stored session (if any) has been checked against the API. */
  loading: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(profile: UserProfile): AuthUser {
  return {
    id: profile.id,
    username: profile.username,
    role: profile.role,
    firstName: profile.first_name,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the session after a page load: the tokens live in localStorage, the profile
  // (id, role) is re-read from the API so a stale or revoked session is never trusted.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      if (tokenStorage.getAccessToken() || tokenStorage.getRefreshToken()) {
        try {
          const profile = await api.auth.getProfile();
          if (!cancelled) setCurrentUser(toAuthUser(profile));
        } catch {
          tokenStorage.clear();
        }
      }
      if (!cancelled) setLoading(false);
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  // The HTTP client drops the tokens when a refresh is rejected (expired session).
  useEffect(() => {
    const handleCleared = () => setCurrentUser(null);
    window.addEventListener(SESSION_CLEARED_EVENT, handleCleared);
    return () => window.removeEventListener(SESSION_CLEARED_EVENT, handleCleared);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<LoginResult> => {
    try {
      await api.auth.login({ username: username.trim(), password });
      const profile = await api.auth.getProfile();
      const user = toAuthUser(profile);
      setCurrentUser(user);
      return { ok: true, user };
    } catch (error) {
      tokenStorage.clear();
      if (error instanceof ApiError && error.status === 401) {
        const detail = error.message.trim();
        const pending = detail.toLowerCase().includes("pending");
        return {
          ok: false,
          message: pending
            ? "Your registration is still pending approval by an administrator."
            : "Invalid username or password.",
        };
      }
      return { ok: false, message: describeError(error) };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // The tokens are dropped locally either way; a failed blacklist call must not trap the user.
    }
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
