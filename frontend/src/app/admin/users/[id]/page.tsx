"use client";

import { use, useCallback, useState } from "react";
import Link from "next/link";
import { api, ApiError, describeError } from "@/api";
import { useScopedData } from "@/hooks/useScopedData";
import { decodeEntities } from "@/lib/text";
import {
  fullName,
  registrationStatus,
  roleLabels,
  statusLabels,
  statusStyles,
} from "@/lib/userHelpers";
import PageNotice from "@/components/PageNotice";
import RequireRole from "@/components/RequireRole";

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <RequireRole roles={["admin"]}>
      <AdminUserDetail userId={Number(id)} />
    </RequireRole>
  );
}

function AdminUserDetail({ userId }: { userId: number }) {
  const fetchUser = useCallback(() => api.admin.getUser(userId), [userId]);
  const { data: user, error: loadError, reload } = useScopedData(
    Number.isNaN(userId) ? null : userId,
    fetchUser,
  );
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const error = actionError || (loadError ? describeError(loadError, "Could not load this user.") : "");

  async function decide(approve: boolean) {
    setActionError("");
    setNotice("");
    try {
      const result = await api.admin.approveUser(userId, { approve });
      setNotice(result.message.trim());
      await reload();
    } catch (decisionError) {
      setActionError(describeError(decisionError));
    }
  }

  const missing = loadError instanceof ApiError && loadError.status === 404;
  if (Number.isNaN(userId) || missing) {
    return (
      <PageNotice href="/admin" linkLabel="Back to user list">
        This user does not exist.
      </PageNotice>
    );
  }
  if (loadError && !user) {
    return (
      <PageNotice href="/admin" linkLabel="Back to user list">
        {error}
      </PageNotice>
    );
  }
  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16 text-sm text-zinc-500 dark:text-zinc-400">
        Loading…
      </div>
    );
  }

  const status = registrationStatus(user);
  const fields: [string, string][] = [
    ["Username", user.username],
    ["Full name", fullName(user)],
    ["Email", user.email],
    ["Telephone", user.telephone],
    ["Address", `${decodeEntities(user.address)}, ${user.postcode}`],
    ["Tax number", user.taxNumber],
    ["Role", roleLabels[user.role]],
    ...(user.requested_role
      ? ([["Requested role", roleLabels[user.requested_role]]] as [string, string][])
      : []),
  ];

  return (
    <div className="flex flex-1 flex-col px-4 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/admin" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
          ← Back to user list
        </Link>

        <div className="mt-4 rounded-xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.145] dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {fullName(user)}
          </h1>
          <span
            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}
          >
            {status === "pending" ? "Pending approval" : statusLabels[status]}
          </span>

          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {label}
                </dt>
                <dd className="mt-1 text-sm text-zinc-950 dark:text-zinc-50">{value}</dd>
              </div>
            ))}
          </dl>

          {notice && <p className="mt-6 text-sm text-emerald-700 dark:text-emerald-400">{notice}</p>}
          {error && <p className="mt-6 text-sm text-red-600 dark:text-red-400">{error}</p>}

          {status === "pending" && (
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => decide(true)}
                className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
              >
                Approve registration
              </button>
              <button
                type="button"
                onClick={() => decide(false)}
                className="rounded-full border border-black/[.08] px-5 py-2.5 text-sm font-medium text-red-600 dark:border-white/[.145] dark:text-red-400"
              >
                Reject registration
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
