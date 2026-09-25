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
    if (typeof data === "string" && data.trim() !== "") return data;
    if (data && typeof data === "object") {
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
    return `Request failed with status ${status}`;
  }
}

/** DRF field errors ({ field: ["msg", ...] }) flattened to { field: "msg" }. */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.data || typeof error.data !== "object") return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(error.data as Record<string, unknown>)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (typeof first === "string") result[key] = first.trim();
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
  if (error instanceof TypeError) return "Could not reach the server. Please check your connection.";
  return fallback;
}
