"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import LoginForm from "@/components/LoginForm";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (currentUser) router.replace(currentUser.role === "admin" ? "/admin" : "/home");
  }, [currentUser, router]);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <AuthCard title="Welcome back" description="Log in to manage your events">
        <LoginForm />

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-zinc-950 dark:text-zinc-50">
            Sign up
          </Link>
        </p>
      </AuthCard>
    </div>
  );
}
