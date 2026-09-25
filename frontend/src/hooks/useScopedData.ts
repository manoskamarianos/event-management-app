"use client";

import { useCallback, useEffect, useState } from "react";

type Scope = string | number;

interface Snapshot<T> {
  scope: Scope | null;
  data: T | null;
  error: unknown;
}

const EMPTY = { data: null, error: null, loaded: false };

/**
 * Loads data for a `scope` (e.g. the signed-in user's id, or the id of the record being viewed).
 *
 * - Nothing is fetched while `scope` is null.
 * - Data belongs to the scope it was fetched for: after the scope changes (another user logs in,
 *   another record is opened) the previous scope's data is never exposed, and a response that
 *   arrives late for an old scope is dropped.
 * - `fetcher` must be referentially stable (module-level function or `useCallback`).
 */
export function useScopedData<T>(scope: Scope | null, fetcher: () => Promise<T>) {
  const [snapshot, setSnapshot] = useState<Snapshot<T>>({ scope: null, data: null, error: null });

  const apply = useCallback((forScope: Scope, data: T) => {
    setSnapshot({ scope: forScope, data, error: null });
  }, []);

  const fail = useCallback((forScope: Scope, error: unknown) => {
    setSnapshot((current) => ({
      scope: forScope,
      data: current.scope === forScope ? current.data : null,
      error,
    }));
  }, []);

  useEffect(() => {
    if (scope === null) return;
    let cancelled = false;
    fetcher().then(
      (data) => {
        if (!cancelled) apply(scope, data);
      },
      (error) => {
        if (!cancelled) fail(scope, error);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [scope, fetcher, apply, fail]);

  /** Re-fetches for the current scope and resolves once the result has been applied. */
  const reload = useCallback(async () => {
    if (scope === null) return;
    try {
      apply(scope, await fetcher());
    } catch (error) {
      fail(scope, error);
    }
  }, [scope, fetcher, apply, fail]);

  const current = scope !== null && snapshot.scope === scope ? snapshot : null;
  return current
    ? { data: current.data, error: current.error, loaded: current.data !== null || current.error !== null, reload }
    : { ...EMPTY, reload };
}
