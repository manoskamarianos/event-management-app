import type { UserRole } from "@/api";

export type { UserRole };

/** The signed-in user, as kept in the session. */
export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
  firstName: string;
}
