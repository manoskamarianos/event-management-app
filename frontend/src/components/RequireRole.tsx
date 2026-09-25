"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/user";

interface RequireRoleProps {
  /** Roles allowed on the page; any signed-in user when omitted. */
  roles?: UserRole[];
  children: ReactNode;
}

/** Route guard: sends anonymous visitors to the welcome page and blocks other roles. */
export default function RequireRole({ roles, children }: RequireRoleProps) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) router.replace("/");
  }, [loading, currentUser, router]);

  if (loading || !currentUser) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16 text-sm text-zinc-500 dark:text-zinc-400">
        Loading…
      </div>
    );
  }

  if (roles && !roles.includes(currentUser.role)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          Your account does not have access to this page.
        </p>
        <Link
          href={currentUser.role === "admin" ? "/admin" : "/home"}
          className="font-medium text-zinc-950 hover:underline dark:text-zinc-50"
        >
          Go back
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
