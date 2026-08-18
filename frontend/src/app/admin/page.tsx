import { mockUsers } from "@/lib/mockUsers";
import UserActionsMenu from "@/components/UserActionsMenu";

const roleStyles: Record<string, string> = {
  adimn: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  orginiser: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  participant: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  guest: "bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400",
};

const roleLabels: Record<string, string> = {
  adimn: "Admin",
  orginiser: "Organiser",
  participant: "Participant",
  guest: "Guest",
};

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-1 flex-col px-4 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Users
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {mockUsers.length} registered users
        </p>

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
              {mockUsers.map((user) => (
                <tr key={user.userid} className="bg-white dark:bg-zinc-950">
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {user.userid}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-950 dark:text-zinc-50">
                    {user.name} {user.surename}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {user.username}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {user.telephone}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {user.address}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {user.taxNumber}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleStyles[user.role]}`}
                    >
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        user.approved
                          ? "inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                      }
                    >
                      {user.approved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <UserActionsMenu approved={user.approved} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
