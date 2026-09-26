export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(ApiError.extractMessage(data, status));
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }

  private static extractMessage(data: unknown, status: number): string {
    // A string body is only a usable message when it is short plain text. Server crashes come
    // back as a full HTML debug page, which must never end up in the UI.
    if (typeof data === "string") {
      const text = data.trim();
      if (text !== "" && text.length <= 200 && !text.startsWith("<")) return text;
    } else if (data && typeof data === "object") {
      const record = data as Record<string, unknown>;
      const candidate = record.detail ?? record.message ?? record.error;
      if (typeof candidate === "string") return candidate;
      const firstKey = Object.keys(record)[0];
      if (firstKey) {
        const value = record[firstKey];
        const flat = Array.isArray(value) ? value[0] : value;
        if (typeof flat === "string") return flat;
      }
    }
    if (status >= 500) return "The server ran into a problem handling this request. Please try again later.";
    return `Request failed with status ${status}`;
  }
}

/** DRF field errors ({ field: ["msg", ...] }) flattened to { field: "msg" }. */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.data || typeof error.data !== "object") return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(error.data as Record<string, unknown>)) {
    // A field can fail several rules at once (e.g. a password): show all of them.
    const messages = (Array.isArray(value) ? value : [value]).filter(
      (item): item is string => typeof item === "string",
    );
    if (messages.length > 0) result[key] = messages.map((message) => message.trim()).join(" ");
  }
  return result;
}

/** A single user-facing message for any thrown value. */
export function describeError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof ApiError) {
    const fields = fieldErrors(error);
    const entries = Object.entries(fields);
    if (entries.length > 1) return entries.map(([key, msg]) => `${key}: ${msg}`).join(" ");
    return error.message.trim() || fallback;
  }
  // fetch() rejects with a TypeError only when the request never got an answer; other
  // TypeErrors are bugs in our own code and must not be reported as a connection problem.
  if (error instanceof TypeError && /failed to fetch|networkerror|load failed/i.test(error.message)) {
    return "Could not reach the server. Please check your connection.";
  }
  return fallback;
}
