"use client";

import { useMemo, useState } from "react";
import { api, describeError } from "@/api";
import type { UserProfile } from "@/api";
import { useScopedData } from "@/hooks/useScopedData";
import { useEvents } from "@/context/EventsContext";
import { eventsToJson, eventsToXml, downloadFile } from "@/lib/eventExport";
import { toBooking } from "@/lib/eventMappers";
import { EventItem } from "@/types/event";
import { decodeEntities } from "@/lib/text";
import {
  fullName,
  registrationStatus,
  RegistrationStatus,
  roleLabels,
  roleStyles,
  statusLabels,
  statusStyles,
} from "@/lib/userHelpers";
import FormField from "@/components/FormField";
import Pagination from "@/components/Pagination";
import RequireRole from "@/components/RequireRole";
import SelectField from "@/components/SelectField";
import UserActionsMenu from "@/components/UserActionsMenu";

export default function AdminDashboardPage() {
  return (
    <RequireRole roles={["admin"]}>
      <AdminDashboard />
    </RequireRole>
  );
}

const PAGE_SIZE = 20;
const EXPORT_BATCH_SIZE = 8;

const fetchUsers = () => api.admin.listUsers();

/**
 * The event list carries no bookings, so they are fetched per event, a few requests at a time.
 * `onProgress` reports how many events are done, since this is one request per event.
 */
async function withBookings(
  events: EventItem[],
  onProgress: (done: number) => void,
): Promise<EventItem[]> {
  const result: EventItem[] = [];
  for (let start = 0; start < events.length; start += EXPORT_BATCH_SIZE) {
    const batch = events.slice(start, start + EXPORT_BATCH_SIZE);
    const filled = await Promise.all(
      batch.map(async (event) => ({
        ...event,
        bookings: (await api.events.listEventBookings(Number(event.eventId))).map(toBooking),
      })),
    );
    result.push(...filled);
    onProgress(result.length);
  }
  return result;
}

type StatusFilter = "all" | RegistrationStatus;

function AdminDashboard() {
  const { refresh } = useEvents();
  const { data, error: loadError, loaded, reload } = useScopedData("users", fetchUsers);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [exportProgress, setExportProgress] = useState<{ done: number; total: number } | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const error = actionError || (loadError ? describeError(loadError, "Could not load users.") : "");
  const exporting = exportProgress !== null;

  const users = useMemo(() => data ?? [], [data]);
  const pendingCount = useMemo(
    () => users.filter((user) => registrationStatus(user) === "pending").length,
    [users],
  );

  // Registrations waiting for a decision come first: they are what the admin is here for.
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users
      .filter((user) => statusFilter === "all" || registrationStatus(user) === statusFilter)
      .filter(
        (user) =>
          needle === "" ||
          user.username.toLowerCase().includes(needle) ||
          user.email.toLowerCase().includes(needle) ||
          fullName(user).toLowerCase().includes(needle),
      )
      .map((user, index) => ({ user, index }))
      .sort((a, b) => {
        const pendingA = registrationStatus(a.user) === "pending" ? 0 : 1;
        const pendingB = registrationStatus(b.user) === "pending" ? 0 : 1;
        return pendingA - pendingB || a.index - b.index;
      })
      .map(({ user }) => user);
  }, [users, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageUsers = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function decide(user: UserProfile, approve: boolean) {
    setNotice("");
    setActionError("");
    try {
      const result = await api.admin.approveUser(user.id, { approve });
      setNotice(result.message.trim());
      await reload();
    } catch (decisionError) {
      setActionError(describeError(decisionError));
    }
  }

  async function handleExport(format: "xml" | "json") {
    setActionError("");
    setNotice("");
    setExportProgress({ done: 0, total: 0 });
    try {
      const events = await refresh({ force: true });
      setExportProgress({ done: 0, total: events.length });
      const complete = await withBookings(events, (done) =>
        setExportProgress({ done, total: events.length }),
      );
      if (format === "xml") downloadFile("events.xml", eventsToXml(complete), "application/xml");
      else downloadFile("events.json", eventsToJson(complete), "application/json");
    } catch (exportError) {
      setActionError(describeError(exportError, "Could not export the events."));
    } finally {
      setExportProgress(null);
    }
  }

  const exportLabel = exportProgress
    ? exportProgress.total > 0
      ? `Preparing export… ${exportProgress.done}/${exportProgress.total}`
      : "Preparing export…"
    : null;

  return (
    <div className="flex flex-1 flex-col px-4 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Users
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {users.length} registered users · {pendingCount} awaiting approval
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={exporting}
              onClick={() => handleExport("xml")}
              className="rounded-full border border-black/[.08] px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-40 dark:border-white/[.145] dark:text-zinc-300"
            >
              {exportLabel ?? "Export events (XML)"}
            </button>
            <button
              type="button"
              disabled={exporting}
              onClick={() => handleExport("json")}
              className="rounded-full border border-black/[.08] px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-40 dark:border-white/[.145] dark:text-zinc-300"
            >
              Export events (JSON)
            </button>
          </div>
        </div>

        {notice && <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-400">{notice}</p>}
        {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            id="userSearch"
            label="Search users"
            placeholder="Username, name or email"
            value={query}
            onChange={(value) => {
              setQuery(value);
              setPage(1);
            }}
          />
          <SelectField
            id="statusFilter"
            label="Status"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value as StatusFilter);
              setPage(1);
            }}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </SelectField>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-black/[.08] dark:border-white/[.145]">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Telephone</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Tax number</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[.08] dark:divide-white/[.145]">
              {pageUsers.map((user) => {
                const status = registrationStatus(user);
                return (
                  <tr key={user.id} className="bg-white dark:bg-zinc-950">
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{user.id}</td>
                    <td className="px-4 py-3 font-medium text-zinc-950 dark:text-zinc-50">
                      {fullName(user)}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{user.username}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{user.email}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{user.telephone}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {decodeEntities(user.address)}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{user.taxNumber}</td>
                    <td className="px-4 py-3">
                      {status === "pending" && user.requested_role ? (
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          Requests{" "}
                          <span className="font-medium">{roleLabels[user.requested_role]}</span>
                        </span>
                      ) : (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleStyles[user.role]}`}
                        >
                          {roleLabels[user.role]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}
                      >
                        {statusLabels[status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <UserActionsMenu
                        userId={user.id}
                        status={status}
                        onApprove={() => decide(user, true)}
                        onReject={() => decide(user, false)}
                      />
                    </td>
                  </tr>
                );
              })}
              {loaded && pageUsers.length === 0 && !error && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                    {users.length === 0 ? "No users yet." : "No users match your filters."}
                  </td>
                </tr>
              )}
              {!loaded && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                    Loading users…
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
