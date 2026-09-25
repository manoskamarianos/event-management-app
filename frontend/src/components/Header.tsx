"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useMessages } from "@/context/MessagesContext";
import { decodeEntities } from "@/lib/text";

export default function Header() {
  const { currentUser, loading, logout } = useAuth();
  const { unreadCount } = useMessages();
  const router = useRouter();

  const role = currentUser?.role;
  const isAdmin = role === "admin";
  const canMessage = role === "organizer" || role === "participant";

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="border-b border-black/[.08] bg-white px-6 py-4 dark:border-white/[.145] dark:bg-black">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link
          href={currentUser ? (isAdmin ? "/admin" : "/home") : "/"}
          className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
        >
          EventHub
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {!loading && !currentUser && (
            <>
              <Link href="/login">Log in</Link>
              <Link
                href="/signup"
                className="rounded-full bg-foreground px-4 py-1.5 text-background"
              >
                Sign up
              </Link>
            </>
          )}

          {currentUser && isAdmin && <Link href="/admin">Users</Link>}

          {currentUser && !isAdmin && (
            <>
              {role === "organizer" && <Link href="/events/manage">Manage events</Link>}
              <Link href="/events">Browse events</Link>
              {canMessage && (
                <Link href="/messages" className="relative">
                  Messages
                  {unreadCount > 0 && (
                    <span className="absolute -right-3 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              )}
            </>
          )}

          {currentUser && (
            <>
              <span className="text-zinc-950 dark:text-zinc-50">
                {decodeEntities(currentUser.firstName) || currentUser.username}
              </span>
              <button type="button" onClick={handleLogout}>
                Log out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
