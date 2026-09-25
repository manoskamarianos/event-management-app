const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#x27;": "'",
  "&#39;": "'",
};

/**
 * The API HTML-escapes user-supplied text (names, addresses, messages) before storing it.
 * React already escapes on render, so undo the storage escaping to avoid showing "&#x27;".
 */
export function decodeEntities(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, (entity) => ENTITIES[entity] ?? entity);
}
