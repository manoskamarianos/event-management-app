interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-md border border-black/[.08] px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-40 dark:border-white/[.145] dark:text-zinc-300"
      >
        Previous
      </button>
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        Page {page} of {pageCount}
      </span>
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        className="rounded-md border border-black/[.08] px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-40 dark:border-white/[.145] dark:text-zinc-300"
      >
        Next
      </button>
    </div>
  );
}
