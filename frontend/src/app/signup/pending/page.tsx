import Link from "next/link";

export default function PendingApprovalPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-xl border border-black/[.08] bg-white p-8 text-center shadow-sm dark:border-white/[.145] dark:bg-zinc-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16Zm.75-13a.75.75 0 00-1.5 0v5c0 .199.079.39.22.53l3 3a.75.75 0 101.06-1.06l-2.78-2.78V5Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Registration submitted
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Thanks for signing up! Your registration is now pending review. An administrator needs
          to approve your account before you can log in.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Back to welcome page
        </Link>
      </div>
    </div>
  );
}
