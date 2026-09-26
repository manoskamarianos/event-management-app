"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { api, describeError } from "@/api";
import { useScopedData } from "@/hooks/useScopedData";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDate, lowestPrice } from "@/lib/eventHelpers";
import { toEventItem } from "@/lib/eventMappers";
import StatusBadge from "@/components/StatusBadge";
import Pagination from "@/components/Pagination";
import FormField from "@/components/FormField";
import RequireRole from "@/components/RequireRole";

const PAGE_SIZE = 10;

export default function SearchEventsPage() {
  return (
    <RequireRole>
      <SearchEvents />
    </RequireRole>
  );
}

/** The API stores categories upper-cased; the filter is exact, so normalise what was typed. */
function normalizeCategories(value: string) {
  return value
    .split(",")
    .map((category) => category.trim().toUpperCase())
    .filter(Boolean)
    .join(",");
}

function SearchEvents() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);

  // Typing does not search on every keystroke.
  const filters = useDebouncedValue(
    { query, category, city, startDate, endDate, minPrice, maxPrice },
    350,
  );

  // Free text and location are one API parameter: each word has to match some field.
  const search = [filters.query, filters.city].map((part) => part.trim()).filter(Boolean).join(" ");
  const scope = JSON.stringify({ search, filters, page });

  const fetchPage = useCallback(async () => {
    const response = await api.events.searchEvents({
      search,
      category: normalizeCategories(filters.category),
      priceMin: filters.minPrice === "" ? undefined : Number(filters.minPrice),
      priceMax: filters.maxPrice === "" ? undefined : Number(filters.maxPrice),
      startDate: filters.startDate ? new Date(`${filters.startDate}T00:00:00`).toISOString() : undefined,
      endDate: filters.endDate ? new Date(`${filters.endDate}T23:59:59.999`).toISOString() : undefined,
      page,
      size: PAGE_SIZE,
    });
    return { count: response.count, events: response.results.map(toEventItem) };
  }, [search, filters, page]);

  const { data, error } = useScopedData(scope, fetchPage);
  const loading = data === null && !error;
  // An organizer also receives their own drafts here; those are not "browsable" events.
  const pageItems = (data?.events ?? []).filter((event) => event.status !== "DRAFT");
  const count = data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  function changeFilter(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Browse events
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {loading ? "Loading events…" : `${count} event${count === 1 ? "" : "s"} found`}
        </p>

        {error ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">
            {describeError(error, "Could not load events.")}
          </p>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-900 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            id="query"
            label="Search title or description"
            placeholder="e.g. music, conference..."
            value={query}
            onChange={changeFilter(setQuery)}
          />
          <FormField
            id="category"
            label="Category"
            placeholder="e.g. Music, Theatre"
            value={category}
            onChange={changeFilter(setCategory)}
          />
          <FormField
            id="city"
            label="Location"
            placeholder="City, country or venue"
            value={city}
            onChange={changeFilter(setCity)}
          />
          <FormField
            id="startDate"
            label="From date"
            type="date"
            value={startDate}
            onChange={changeFilter(setStartDate)}
          />
          <FormField
            id="endDate"
            label="To date"
            type="date"
            value={endDate}
            onChange={changeFilter(setEndDate)}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="minPrice"
              label="Min price (€)"
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={changeFilter(setMinPrice)}
            />
            <FormField
              id="maxPrice"
              label="Max price (€)"
              type="number"
              placeholder="50"
              value={maxPrice}
              onChange={changeFilter(setMaxPrice)}
            />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-black/[.08] dark:border-white/[.145]">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">From price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">
                  <span className="sr-only">View</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[.08] dark:divide-white/[.145]">
              {pageItems.map((event) => (
                <tr key={event.eventId} className="bg-white dark:bg-zinc-950">
                  <td className="px-4 py-3 font-medium text-zinc-950 dark:text-zinc-50">
                    {event.title}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {event.categories.join(", ")}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{event.city}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {formatDate(event.startDateTime)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {lowestPrice(event) === 0 ? "Free" : `€${lowestPrice(event).toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={event.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/events/${event.eventId}`}
                      className="font-medium text-zinc-950 hover:underline dark:text-zinc-50"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                    {loading ? "Loading events…" : "No events match your filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </div>
    </div>
  );
}
