"use client";

import { useEffect, useState } from "react";

/** `value`, but only after it has stopped changing for `delayMs` (e.g. to not search per keystroke). */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
