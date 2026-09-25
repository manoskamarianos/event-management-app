"use client";

import { useState } from "react";
import { api, describeError } from "@/api";
import type { UserProfile } from "@/api";
import { useScopedData } from "@/hooks/useScopedData";
import { useEvents } from "@/context/EventsContext";
import { eventsToJson, eventsToXml, downloadFile } from "@/lib/eventExport";
import { decodeEntities } from "@/lib/text";
import {
  fullName,
  registrationStatus,
  roleLabels,
  roleStyles,
  statusLabels,
  statusStyles,
} from "@/lib/userHelpers";
import RequireRole from "@/components/RequireRole";
import UserActionsMenu from "@/components/UserActionsMenu";

export default function AdminDashboardPage() {
  return (
    <RequireRole roles={["admin"]}>
      <AdminDashboard />
    </RequireRole>
  );
}

const fetchUsers = () => api.admin.listUsers();

function AdminDashboard() {
  const { events, loading: eventsLoading, error: eventsError } = useEvents();
  const { data, error: loadError, loaded, reload } = useScopedData("users", fetchUsers);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const users = data ?? [];
  const error = actionError || (loadError ? describeError(loadError, "Could not load users.") : "");

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

  const exportDisabled = eventsLoading || Boolean(eventsError);

  return (
    <div className="flex flex-1 flex-col px-4 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Users
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {users.length} registered users
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={exportDisabled}
              onClick={() => downloadFile("events.xml", eventsToXml(events), "application/xml")}
              className="rounded-full border border-black/[.08] px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-40 dark:border-white/[.145] dark:text-zinc-300"
            >
              Export events (XML)
            </button>
            <button
              type="button"
              disabled={exportDisabled}
              onClick={() =>
                downloadFile("events.json", eventsToJson(events), "application/json")
              }
              className="rounded-full border border-black/[.08] px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-40 dark:border-white/[.145] dark:text-zinc-300"
            >
              Export events (JSON)
            </button>
          </div>
        </div>

        {notice && <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-400">{notice}</p>}
        {(error || eventsError) && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error || eventsError}</p>
        )}

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
              {users.map((user) => {
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
              {loaded && users.length === 0 && !error && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                    No users yet.
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
      </div>
    </div>
  );
}
