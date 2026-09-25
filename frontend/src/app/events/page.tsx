"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useEvents } from "@/context/EventsContext";
import { formatDate, lowestPrice } from "@/lib/eventHelpers";
import StatusBadge from "@/components/StatusBadge";
import Pagination from "@/components/Pagination";
import SelectField from "@/components/SelectField";
import FormField from "@/components/FormField";
import RequireRole from "@/components/RequireRole";

const PAGE_SIZE = 5;

export default function SearchEventsPage() {
  return (
    <RequireRole>
      <SearchEvents />
    </RequireRole>
  );
}

function SearchEvents() {
  const { events, loading, error, refresh } = useEvents();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const allCategories = useMemo(
    () => Array.from(new Set(events.flatMap((e) => e.categories))).sort(),
    [events],
  );

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events
      .filter((event) => event.status !== "DRAFT")
      .filter((event) => (category ? event.categories.includes(category) : true))
      .filter((event) =>
        city ? event.city.toLowerCase().includes(city.trim().toLowerCase()) : true,
      )
      .filter((event) =>
        q
          ? event.title.toLowerCase().includes(q) || event.description.toLowerCase().includes(q)
          : true,
      )
      .filter((event) =>
        startDate ? new Date(event.startDateTime) >= new Date(`${startDate}T00:00:00`) : true,
      )
      .filter((event) =>
        endDate ? new Date(event.startDateTime) <= new Date(`${endDate}T23:59:59.999`) : true,
      )
      .filter((event) => (maxPrice ? lowestPrice(event) <= Number(maxPrice) : true));
  }, [events, query, category, city, startDate, endDate, maxPrice]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetPage() {
    setPage(1);
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Browse events
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {filtered.length} event{filtered.length === 1 ? "" : "s"} found
        </p>

        {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-900 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            id="query"
            label="Search title or description"
            placeholder="e.g. music, conference..."
            value={query}
            onChange={(v) => {
              setQuery(v);
              resetPage();
            }}
          />
          <SelectField
            id="category"
            label="Category"
            value={category}
            onChange={(v) => {
              setCategory(v);
              resetPage();
            }}
          >
            <option value="">All categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectField>
          <FormField
            id="city"
            label="Location"
            placeholder="City"
            value={city}
            onChange={(v) => {
              setCity(v);
              resetPage();
            }}
          />
          <FormField
            id="startDate"
            label="From date"
            type="date"
            value={startDate}
            onChange={(v) => {
              setStartDate(v);
              resetPage();
            }}
          />
          <FormField
            id="endDate"
            label="To date"
            type="date"
            value={endDate}
            onChange={(v) => {
              setEndDate(v);
              resetPage();
            }}
          />
          <FormField
            id="maxPrice"
            label="Max ticket price (€)"
            type="number"
            placeholder="e.g. 50"
            value={maxPrice}
            onChange={(v) => {
              setMaxPrice(v);
              resetPage();
            }}
          />
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

        <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
      </div>
    </div>
  );
}
