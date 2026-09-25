// The API keeps no view history, so events a user opened are remembered in this browser.
// They feed the recommendations when the user has no (or few) bookings.

const MAX_REMEMBERED = 50;

function key(userId: number) {
  return `eventhub.visited.${userId}`;
}

export function readVisited(userId: number): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key(userId)) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function recordVisit(userId: number, eventId: string) {
  if (typeof window === "undefined") return;
  const next = [eventId, ...readVisited(userId).filter((id) => id !== eventId)].slice(0, MAX_REMEMBERED);
  try {
    window.localStorage.setItem(key(userId), JSON.stringify(next));
  } catch {
    // Storage may be full or disabled; recommendations just get less personal.
  }
}
