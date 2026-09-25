import type { UserProfile, UserRole } from "@/api";
import { decodeEntities } from "@/lib/text";

export type RegistrationStatus = "approved" | "pending" | "rejected";

export const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  organizer: "Organiser",
  participant: "Participant",
  guest: "Guest",
};

export const roleStyles: Record<UserRole, string> = {
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  organizer: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  participant: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  guest: "bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400",
};

export const statusLabels: Record<RegistrationStatus, string> = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
};

export const statusStyles: Record<RegistrationStatus, string> = {
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

/**
 * An unapproved user is waiting for review while they still have a requested role; the API
 * clears that request once an admin has decided, so an unapproved user without one was rejected.
 */
export function registrationStatus(user: UserProfile): RegistrationStatus {
  if (user.approved) return "approved";
  return user.requested_role ? "pending" : "rejected";
}

export function fullName(user: UserProfile) {
  return `${decodeEntities(user.first_name)} ${decodeEntities(user.last_name)}`.trim() || user.username;
}
