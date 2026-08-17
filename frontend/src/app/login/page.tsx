import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import FormField from "@/components/FormField";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <AuthCard title="Welcome back" description="Log in to manage your events">
        <form className="mt-6 flex flex-col gap-4">
          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
          />
          <FormField
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <input type="checkbox" className="rounded" />
              Remember me
            </label>
            <span className="font-medium text-zinc-950 dark:text-zinc-50">
              Forgot password?
            </span>
          </div>

          <button
            type="submit"
            className="mt-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Log in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-zinc-950 dark:text-zinc-50"
          >
            Sign up
          </Link>
        </p>
      </AuthCard>
    </div>
  );
}
