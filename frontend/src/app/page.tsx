"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";
import { useAuth } from "@/context/AuthContext";

export default function WelcomePage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (currentUser) router.replace(currentUser.role === "admin" ? "/admin" : "/home");
  }, [currentUser, router]);

  if (currentUser) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-16">
      <div className="flex w-full max-w-4xl flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Welcome to EventHub
        </h1>
        <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Discover events near you, book your tickets in a few clicks, or create and manage your
          own events.
        </p>
        <Link
          href="/signup"
          className="mt-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Sign up
        </Link>
      </div>

      <div className="mt-12 w-full max-w-sm rounded-xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.145] dark:bg-zinc-900">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Log in
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Enter your username and password to access your account.
        </p>

        <LoginForm />

        <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
          New here?{" "}
          <Link href="/signup" className="font-medium text-zinc-950 dark:text-zinc-50">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
