const styles: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400",
  PUBLISHED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  CONFIRMED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400"
      }`}
    >
      {status}
    </span>
  );
}
